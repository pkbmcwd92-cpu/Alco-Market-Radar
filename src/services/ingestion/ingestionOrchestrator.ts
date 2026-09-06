import { MarketDataProvider, MarketSearchInput, IngestionJob, IngestionResult, IngestionError } from '../../types/provider';
import { ObservationRepository, defaultObservationRepository } from '../storage/observationRepository';
import { normalizeRawAd } from './normalizationService';
import { validateBatchObservations } from './validationService';
import { deduplicateAndPrepareStorage } from './deduplicationService';
import { AdObservation, Competitor, MarketSignal } from '../../types/radar';
import { evaluateSignalsV1_1 } from '../signalEngine';
import { generateTemporalTrendReport } from '../trendEngine';

export interface IngestionOptions {
  repository?: ObservationRepository;
  competitorsMap?: Map<string, string>; // competitorId -> competitorName
  targetCompetitorId?: string;
  targetCompetitorName?: string;
}

/**
 * Ingestion Orchestrator
 * Connects the real public data foundation to the existing Radar Intelligence Engines.
 * 
 * Pipeline:
 * PROVIDER -> FETCH -> NORMALIZE -> VALIDATE -> DEDUPLICATE -> REPOSITORY -> SNAPSHOT -> INTELLIGENCE ENGINES
 */
export async function runIngestionPipeline(
  provider: MarketDataProvider,
  input: MarketSearchInput,
  options?: IngestionOptions
): Promise<{
  job: IngestionJob;
  result: IngestionResult;
  updatedAds: AdObservation[];
  generatedSignals: MarketSignal[];
}> {
  const startedAt = new Date().toISOString();
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const repo = options?.repository || defaultObservationRepository;

  const job: IngestionJob = {
    id: jobId,
    workspaceId: input.workspaceId,
    providerId: provider.id,
    status: 'RUNNING',
    startedAt,
    targetCompetitorName: input.advertiserName || options?.targetCompetitorName,
  };

  await repo.saveIngestionJob(job);

  const errors: IngestionError[] = [];
  let fetchedCount = 0;

  try {
    // 1. FETCH FROM PROVIDER
    const searchResult = await provider.searchAds(input);
    const rawItems = searchResult.items || [];
    fetchedCount = rawItems.length;

    // 2. NORMALIZE RAW DATA INTO CANONICAL AD OBSERVATIONS
    const normalizedAds: AdObservation[] = rawItems.map((raw) =>
      normalizeRawAd(raw, input.workspaceId, input.competitorId || options?.targetCompetitorId)
    );

    // 3. VALIDATE
    const { accepted, rejected, allErrors } = validateBatchObservations(normalizedAds);
    errors.push(...allErrors);

    // 4. DEDUPLICATE & UPDATE MARKET MEMORY
    const dedupResult = await deduplicateAndPrepareStorage(accepted, repo);

    // 5. PERSIST TO REPOSITORY
    for (const newAd of dedupResult.createdAds) {
      await repo.saveObservation(newAd);
    }
    for (const upAd of dedupResult.updatedAds) {
      await repo.saveObservation(upAd);
    }
    for (const snap of dedupResult.snapshotsToSave) {
      await repo.saveSnapshot(snap);
    }

    // 6. GET ALL CURRENT ADS FOR THIS WORKSPACE
    const allWorkspaceAds = await repo.listObservations(input.workspaceId);

    // 7. RUN RADAR INTELLIGENCE ENGINES
    // Build competitor list
    const compMap = options?.competitorsMap || new Map<string, string>();
    allWorkspaceAds.forEach((ad) => {
      if (ad.competitorId && ad.advertiserName && !compMap.has(ad.competitorId)) {
        compMap.set(ad.competitorId, ad.advertiserName);
      }
    });

    const competitorsList: Competitor[] = Array.from(compMap.entries()).map(([id, name]) => ({
      id,
      workspaceId: input.workspaceId,
      name,
      category: 'Market Monitored',
      description: `Monitored brand: ${name}`,
      website: '',
      status: 'active',
      monitoringStatus: 'monitoring',
      priority: 'medium',
      tags: ['Auto Ingested'],
      notes: '',
      firstSeen: new Date().toISOString(),
      lastObserved: new Date().toISOString(),
      color: '#2563eb',
    }));

    const generatedSignals = evaluateSignalsV1_1(input.workspaceId, allWorkspaceAds, competitorsList);

    const completedAt = new Date().toISOString();
    const result: IngestionResult = {
      jobId,
      providerId: provider.id,
      workspaceId: input.workspaceId,
      startedAt,
      completedAt,
      fetched: fetchedCount,
      accepted: accepted.length,
      rejected: rejected.length,
      created: dedupResult.createdAds.length,
      updated: dedupResult.updatedAds.length,
      duplicates: dedupResult.duplicateCount,
      snapshotsCreated: dedupResult.snapshotsToSave.length,
      errors,
      status: errors.length > 0 && accepted.length === 0 ? 'FAILED' : errors.length > 0 ? 'PARTIAL' : 'COMPLETED',
    };

    job.status = result.status;
    job.completedAt = completedAt;
    job.result = result;
    await repo.saveIngestionJob(job);

    return {
      job,
      result,
      updatedAds: allWorkspaceAds,
      generatedSignals,
    };
  } catch (err: any) {
    const completedAt = new Date().toISOString();
    const networkError: IngestionError = {
      code: 'NETWORK_ERROR',
      message: err?.message || 'Gagal mengambil data dari provider.',
    };
    errors.push(networkError);

    const result: IngestionResult = {
      jobId,
      providerId: provider.id,
      workspaceId: input.workspaceId,
      startedAt,
      completedAt,
      fetched: fetchedCount,
      accepted: 0,
      rejected: 0,
      created: 0,
      updated: 0,
      duplicates: 0,
      snapshotsCreated: 0,
      errors,
      status: 'FAILED',
    };

    job.status = 'FAILED';
    job.completedAt = completedAt;
    job.result = result;
    await repo.saveIngestionJob(job);

    // Keep existing stored observations unharmed
    const existingAds = await repo.listObservations(input.workspaceId);
    return {
      job,
      result,
      updatedAds: existingAds,
      generatedSignals: [],
    };
  }
}
