import {
  AdObservation,
  CreativeFamily,
  CreativeIntelligence,
  EvidenceItem,
  FormatType,
  HookType,
  LongevityTier,
  MarketSignal,
  MessagingAngle,
  OfferType,
  SignalSeverity,
  SignalType,
  ConfidenceLevel,
  Competitor,
} from '../types/radar';
import { buildCreativeIntelligenceV1_1, classifyCreativeV1_1 } from './classificationEngine';
import { evaluateSignalsV1_1, calculateMarketOpportunities } from './signalEngine';
import {
  generateTemporalTrendReport,
  calculateCompetitorVelocities,
  analyzeObservationSnapshots,
} from './trendEngine';

export {
  classifyCreativeV1_1,
  buildCreativeIntelligenceV1_1,
  evaluateSignalsV1_1,
  calculateMarketOpportunities,
  generateTemporalTrendReport,
  calculateCompetitorVelocities,
  analyzeObservationSnapshots,
};

/**
 * DETERMINISTIC CREATIVE CLASSIFICATION
 * Fallback and primary rule-based categorizer for ad copy and creative formats
 */
export function classifyCreativeDeterministically(ad: AdObservation): CreativeIntelligence {
  return buildCreativeIntelligenceV1_1(ad);
}

export function calculateObservedDays(firstSeen: string, lastSeen: string): number {
  const start = new Date(firstSeen).getTime();
  const end = new Date(lastSeen).getTime();
  const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  return isNaN(diffDays) ? 1 : diffDays;
}

/**
 * CLUSTERING: Group Ad Observations into Creative Families
 * Group by (competitorId + commonHook + commonAngle + commonOffer)
 */
export function clusterCreativeFamilies(ads: AdObservation[]): CreativeFamily[] {
  const groups = new Map<string, AdObservation[]>();

  for (const ad of ads) {
    const ci = classifyCreativeDeterministically(ad);
    const key = `${ad.competitorId}_${ci.hookType}_${ci.messagingAngle}_${ci.offerType}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(ad);
  }

  const families: CreativeFamily[] = [];
  let index = 1;

  for (const [key, memberAds] of groups.entries()) {
    const sample = memberAds[0];
    const ci = classifyCreativeDeterministically(sample);
    const avgDays = Math.round(
      memberAds.reduce((acc, m) => acc + (m.observedDays || calculateObservedDays(m.firstSeen, m.lastSeen)), 0) / memberAds.length
    );

    // Pick representative creative: highest longevity
    const sorted = [...memberAds].sort((a, b) => (b.observedDays || 0) - (a.observedDays || 0));
    const repAd = sorted[0];

    const hookLabel = ci.hookType;
    const angleLabel = ci.messagingAngle;

    families.push({
      familyId: `fam_${key.replace(/[^a-zA-Z0-9]/g, '_')}_${index++}`,
      workspaceId: repAd.workspaceId,
      competitorId: repAd.competitorId,
      name: `Kluster Hook ${hookLabel} & Angle ${angleLabel} (${memberAds.length} variasi)`,
      representativeCreativeId: repAd.id,
      memberAdIds: memberAds.map((m) => m.id),
      commonHook: ci.hookType,
      commonAngle: ci.messagingAngle,
      commonOffer: ci.offerType,
      format: ci.format,
      confidence: memberAds.length > 2 ? 'HIGH' : 'MEDIUM',
      averageLongevityDays: avgDays,
      description: `Kluster materi iklan dengan kombinasi hook ${hookLabel} dan angle ${angleLabel}. Variasi representatif terpantau aktif selama ${repAd.observedDays} hari.`,
    });
  }

  return families;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * DETERMINISTIC MARKET SIGNAL ENGINE
 * Evaluates deltas across observed ads and competitors to emit traceable market signals
 */
export function evaluateMarketSignals(
  workspaceId: string,
  ads: AdObservation[],
  competitorsOrMap: Map<string, string> | Competitor[]
): MarketSignal[] {
  let competitors: Competitor[] = [];

  if (Array.isArray(competitorsOrMap)) {
    competitors = competitorsOrMap;
  } else {
    competitors = Array.from(competitorsOrMap.entries()).map(([id, name]) => ({
      id,
      workspaceId,
      name,
      category: 'General',
      description: '',
      website: 'https://example.com',
      color: '#3b82f6',
      status: 'active',
      monitoringStatus: 'monitoring',
      priority: 'medium',
      tags: [],
      notes: '',
      firstSeen: new Date().toISOString(),
      lastObserved: new Date().toISOString(),
    }));
  }

  return evaluateSignalsV1_1(workspaceId, ads, competitors);
}

/**
 * Filter Helper
 */
export interface AdFilterOptions {
  competitorId?: string;
  format?: FormatType | 'all';
  hookType?: HookType | 'all';
  messagingAngle?: MessagingAngle | 'all';
  offerType?: OfferType | 'all';
  longevityTier?: LongevityTier | 'all';
  searchQuery?: string;
  minDays?: number;
}

export function filterAds(ads: AdObservation[], filters: AdFilterOptions): AdObservation[] {
  return ads.filter((ad) => {
    if (filters.competitorId && filters.competitorId !== 'all' && ad.competitorId !== filters.competitorId) {
      return false;
    }
    if (filters.format && filters.format !== 'all' && ad.format !== filters.format) {
      return false;
    }

    const ci = classifyCreativeDeterministically(ad);

    if (filters.hookType && filters.hookType !== 'all' && ci.hookType !== filters.hookType) {
      return false;
    }
    if (filters.messagingAngle && filters.messagingAngle !== 'all' && ci.messagingAngle !== filters.messagingAngle) {
      return false;
    }
    if (filters.offerType && filters.offerType !== 'all' && ci.offerType !== filters.offerType) {
      return false;
    }
    if (filters.longevityTier && filters.longevityTier !== 'all' && ci.longevityTier !== filters.longevityTier) {
      return false;
    }
    if (filters.minDays && ad.observedDays < filters.minDays) {
      return false;
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        ad.headline.toLowerCase().includes(q) ||
        ad.primaryText.toLowerCase().includes(q) ||
        ad.advertiserName.toLowerCase().includes(q) ||
        ci.hookType.toLowerCase().includes(q) ||
        ci.messagingAngle.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}
