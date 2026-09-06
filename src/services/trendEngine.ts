import {
  AdObservation,
  CompetitorVelocity,
  FormatType,
  HookType,
  MarketTrendMetric,
  MessagingAngle,
  ObservationSnapshot,
  OfferType,
  TemporalTrendReport,
} from '../types/radar';
import { buildCreativeIntelligenceV1_1 } from './classificationEngine';

export interface TimeWindow {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

/**
 * Creates sliding observation windows (e.g. last 7 days vs prior 7 days)
 */
export function createSlidingWindow(days = 7, referenceDate = new Date()): TimeWindow {
  const currentEnd = new Date(referenceDate);
  const currentStart = new Date(referenceDate);
  currentStart.setDate(currentStart.getDate() - days);

  const previousEnd = new Date(currentStart);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days);

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  };
}

/**
 * Mathematical distribution calculation for any categorical dimension
 */
export function calculateDistributionShifts<T extends string>(
  dimension: 'format' | 'hook' | 'angle' | 'offer',
  currentItems: { value: T; competitorId: string }[],
  previousItems: { value: T; competitorId: string }[]
): MarketTrendMetric[] {
  const currentTotal = currentItems.length || 1;
  const previousTotal = previousItems.length || 1;

  // Tally current
  const currentCounts = new Map<T, number>();
  const competitorBreadth = new Map<T, Set<string>>();

  for (const item of currentItems) {
    currentCounts.set(item.value, (currentCounts.get(item.value) || 0) + 1);
    if (!competitorBreadth.has(item.value)) {
      competitorBreadth.set(item.value, new Set());
    }
    competitorBreadth.get(item.value)!.add(item.competitorId);
  }

  // Tally previous
  const previousCounts = new Map<T, number>();
  for (const item of previousItems) {
    previousCounts.set(item.value, (previousCounts.get(item.value) || 0) + 1);
  }

  // Combine unique keys
  const allKeys = new Set<T>([
    ...Array.from(currentCounts.keys()),
    ...Array.from(previousCounts.keys()),
  ]);

  const metrics: MarketTrendMetric[] = [];

  for (const key of allKeys) {
    if (key === 'unknown' || key === 'other') continue;

    const currCount = currentCounts.get(key) || 0;
    const prevCount = previousCounts.get(key) || 0;

    const currentPeriodPct = Math.round((currCount / currentTotal) * 100);
    const previousPeriodPct = Math.round((prevCount / previousTotal) * 100);
    const deltaPercentagePoints = currentPeriodPct - previousPeriodPct;

    let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
    if (deltaPercentagePoints >= 3) trendDirection = 'up';
    else if (deltaPercentagePoints <= -3) trendDirection = 'down';

    metrics.push({
      dimension,
      name: key,
      previousPeriodPct,
      currentPeriodPct,
      deltaPercentagePoints,
      trendDirection,
      competitorBreadthCount: competitorBreadth.get(key)?.size || 0,
    });
  }

  // Sort by highest absolute percentage point delta
  return metrics.sort((a, b) => Math.abs(b.deltaPercentagePoints) - Math.abs(a.deltaPercentagePoints));
}

/**
 * Calculates deterministic launch velocity, disappearance, and net change per competitor
 */
export function calculateCompetitorVelocities(
  ads: AdObservation[],
  competitorMap: Map<string, string>,
  window: TimeWindow = createSlidingWindow(7)
): CompetitorVelocity[] {
  const compAds = new Map<string, AdObservation[]>();

  for (const ad of ads) {
    if (!compAds.has(ad.competitorId)) {
      compAds.set(ad.competitorId, []);
    }
    compAds.get(ad.competitorId)!.push(ad);
  }

  const results: CompetitorVelocity[] = [];

  for (const [compId, adList] of compAds.entries()) {
    const compName = competitorMap.get(compId) || 'Competitor';

    // Current period newly launched: firstSeen in current window or observedDays <= 7
    const currentNew = adList.filter((ad) => {
      const first = new Date(ad.firstSeen).getTime();
      return (
        (!isNaN(first) && first >= window.currentStart.getTime() && first <= window.currentEnd.getTime()) ||
        (ad.observedDays || 1) <= 7
      );
    });

    // Previous period newly launched: firstSeen in previous window or observedDays between 8 and 14
    const previousNew = adList.filter((ad) => {
      const first = new Date(ad.firstSeen).getTime();
      return (
        (!isNaN(first) && first >= window.previousStart.getTime() && first < window.currentStart.getTime()) ||
        (ad.observedDays > 7 && ad.observedDays <= 14)
      );
    });

    // Inactive / disappeared ads
    const disappeared = adList.filter((ad) => ad.adStatus === 'inactive');
    const activeInventory = adList.filter((ad) => ad.adStatus !== 'inactive');

    const currCount = currentNew.length;
    const prevCount = previousNew.length;

    let velocityChangePct = 0;
    if (prevCount === 0) {
      velocityChangePct = currCount > 0 ? 100 : 0;
    } else {
      velocityChangePct = Math.round(((currCount - prevCount) / prevCount) * 100);
    }

    // Dominant format
    const formatCounts = new Map<FormatType, number>();
    for (const ad of activeInventory) {
      formatCounts.set(ad.format, (formatCounts.get(ad.format) || 0) + 1);
    }
    let dominantFormat: FormatType = 'video';
    let maxFormatCount = 0;
    for (const [fmt, c] of formatCounts.entries()) {
      if (c > maxFormatCount) {
        maxFormatCount = c;
        dominantFormat = fmt;
      }
    }

    // Dominant angle
    const angleCounts = new Map<MessagingAngle, number>();
    for (const ad of activeInventory) {
      const ci = buildCreativeIntelligenceV1_1(ad);
      angleCounts.set(ci.primaryAngle, (angleCounts.get(ci.primaryAngle) || 0) + 1);
    }
    let dominantAngle: MessagingAngle = 'transformation';
    let maxAngleCount = 0;
    for (const [ang, c] of angleCounts.entries()) {
      if (c > maxAngleCount) {
        maxAngleCount = c;
        dominantAngle = ang;
      }
    }

    results.push({
      competitorId: compId,
      competitorName: compName,
      newCreativesCurrentPeriod: currCount,
      newCreativesPreviousPeriod: prevCount,
      velocityChangePct,
      disappearedCreatives: disappeared.length,
      activeInventoryCount: activeInventory.length,
      netCreativeChange: currCount - disappeared.length,
      dominantFormat,
      dominantAngle,
    });
  }

  // Sort by highest current period launch velocity
  return results.sort((a, b) => b.newCreativesCurrentPeriod - a.newCreativesCurrentPeriod);
}

/**
 * Builds a comprehensive Temporal Trend Report for a workspace
 */
export function generateTemporalTrendReport(
  workspaceId: string,
  ads: AdObservation[],
  competitorMap: Map<string, string>,
  periodDays = 7
): TemporalTrendReport {
  const workspaceAds = ads.filter((a) => a.workspaceId === workspaceId);
  const window = createSlidingWindow(periodDays);

  const competitorVelocities = calculateCompetitorVelocities(workspaceAds, competitorMap, window);

  // Divide ads into current period active cohort vs previous period cohort
  const currentAds = workspaceAds.filter((a) => a.adStatus !== 'inactive');
  const recentNewAds = workspaceAds.filter((a) => (a.observedDays || 1) <= periodDays);
  const olderAds = workspaceAds.filter((a) => (a.observedDays || 1) > periodDays);

  const totalActiveCreatives = currentAds.length;
  const newCreativesCount = recentNewAds.length;
  const disappearedCreativesCount = workspaceAds.filter((a) => a.adStatus === 'inactive').length;
  const overallTurnoverRate = totalActiveCreatives > 0 
    ? Math.round((newCreativesCount / totalActiveCreatives) * 100) 
    : 0;

  // 1. Format Shifts
  const currentFormats = currentAds.map((a) => ({ value: a.format, competitorId: a.competitorId }));
  const previousFormats = (olderAds.length > 0 ? olderAds : currentAds).map((a) => ({
    value: a.format,
    competitorId: a.competitorId,
  }));
  const formatShifts = calculateDistributionShifts('format', currentFormats, previousFormats);

  // 2. Hook Shifts
  const currentHooks = currentAds.map((a) => ({
    value: buildCreativeIntelligenceV1_1(a).primaryHook,
    competitorId: a.competitorId,
  }));
  const previousHooks = (olderAds.length > 0 ? olderAds : currentAds).map((a) => ({
    value: buildCreativeIntelligenceV1_1(a).primaryHook,
    competitorId: a.competitorId,
  }));
  const hookShifts = calculateDistributionShifts('hook', currentHooks, previousHooks);

  // 3. Angle Shifts
  const currentAngles = currentAds.map((a) => ({
    value: buildCreativeIntelligenceV1_1(a).primaryAngle,
    competitorId: a.competitorId,
  }));
  const previousAngles = (olderAds.length > 0 ? olderAds : currentAds).map((a) => ({
    value: buildCreativeIntelligenceV1_1(a).primaryAngle,
    competitorId: a.competitorId,
  }));
  const angleShifts = calculateDistributionShifts('angle', currentAngles, previousAngles);

  // 4. Offer Shifts
  const currentOffers = currentAds.map((a) => ({
    value: buildCreativeIntelligenceV1_1(a).offerType,
    competitorId: a.competitorId,
  }));
  const previousOffers = (olderAds.length > 0 ? olderAds : currentAds).map((a) => ({
    value: buildCreativeIntelligenceV1_1(a).offerType,
    competitorId: a.competitorId,
  }));
  const offerShifts = calculateDistributionShifts('offer', currentOffers, previousOffers);

  return {
    workspaceId,
    periodDays,
    currentPeriodLabel: `${periodDays} Hari Terakhir`,
    previousPeriodLabel: `${periodDays} Hari Sebelumnya`,
    totalActiveCreatives,
    newCreativesCount,
    disappearedCreativesCount,
    overallTurnoverRate,
    formatShifts,
    hookShifts,
    angleShifts,
    offerShifts,
    competitorVelocities,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Market Memory Engine: Processes temporal snapshots to detect state transitions:
 * - Lifespan & active duration
 * - Disappearance & reactivation
 * - Activity spikes
 */
export function analyzeObservationSnapshots(
  snapshots: ObservationSnapshot[]
): {
  entityDurations: Map<string, { daysObserved: number; firstSeen: string; lastSeen: string; status: string }>;
  reactivatedEntities: string[];
  disappearedEntities: string[];
} {
  const sorted = [...snapshots].sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime());
  const entityDurations = new Map<string, { daysObserved: number; firstSeen: string; lastSeen: string; status: string }>();
  const statusHistory = new Map<string, boolean[]>(); // true for active, false for inactive

  for (const s of sorted) {
    if (!statusHistory.has(s.entityId)) {
      statusHistory.set(s.entityId, []);
    }
    const isActive = s.active ?? (s.status === 'active');
    statusHistory.get(s.entityId)!.push(isActive);

    const prev = entityDurations.get(s.entityId);
    if (!prev) {
      entityDurations.set(s.entityId, {
        daysObserved: 1,
        firstSeen: s.observedAt,
        lastSeen: s.observedAt,
        status: s.status || (isActive ? 'active' : 'inactive'),
      });
    } else {
      const diffMs = new Date(s.observedAt).getTime() - new Date(prev.firstSeen).getTime();
      const days = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      entityDurations.set(s.entityId, {
        daysObserved: days,
        firstSeen: prev.firstSeen,
        lastSeen: s.observedAt,
        status: s.status || (isActive ? 'active' : 'inactive'),
      });
    }
  }

  const reactivatedEntities: string[] = [];
  const disappearedEntities: string[] = [];

  for (const [entityId, hist] of statusHistory.entries()) {
    // Check if transitioned from inactive back to active
    let sawInactive = false;
    for (const active of hist) {
      if (!active) sawInactive = true;
      if (sawInactive && active) {
        reactivatedEntities.push(entityId);
        break;
      }
    }
    // Check if currently inactive
    if (hist.length > 0 && hist[hist.length - 1] === false) {
      disappearedEntities.push(entityId);
    }
  }

  return {
    entityDurations,
    reactivatedEntities,
    disappearedEntities,
  };
}
