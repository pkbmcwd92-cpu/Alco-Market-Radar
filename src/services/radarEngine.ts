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
} from '../types/radar';

/**
 * DETERMINISTIC CREATIVE CLASSIFICATION
 * Fallback and primary rule-based categorizer for ad copy and creative formats
 */
export function classifyCreativeDeterministically(ad: AdObservation): CreativeIntelligence {
  const text = `${ad.headline} ${ad.primaryText} ${ad.description || ''}`.toLowerCase();

  // 1. Detect Hook Type
  let hookType: HookType = 'curiosity';
  if (text.includes('masalah') || text.includes('kemerahan') || text.includes('breakout') || text.includes('rusak') || text.includes('rugi') || text.includes('stop')) {
    hookType = 'problem';
  } else if (text.includes('dokter') || text.includes('spesialis') || text.includes('spkk') || text.includes('klinis') || text.includes('bpom') || text.includes('lab')) {
    hookType = 'authority';
  } else if (text.includes('before') || text.includes('after') || text.includes('sebelum') || text.includes('sesudah') || text.includes('hasil') || text.includes('bukti')) {
    hookType = 'result';
  } else if (text.includes('review') || text.includes('kata mereka') || text.includes('jujur') || text.includes('kak ')) {
    hookType = 'testimonial';
  } else if (text.includes('bandingkan') || text.includes('daripada') || text.includes('vs') || text.includes('bedanya')) {
    hookType = 'comparison';
  } else if (text.includes('sekarang') || text.includes('terbatas') || text.includes('hari ini') || text.includes('cepetan') || text.includes('viral')) {
    hookType = 'urgency';
  } else if (text.includes('panduan') || text.includes('cara') || text.includes('step') || text.includes('kenapa') || text.includes('langkah')) {
    hookType = 'educational';
  } else if (text.includes('promo') || text.includes('diskon') || text.includes('gratis') || text.includes('beli 1') || text.includes('paket') || text.includes('cuma ')) {
    hookType = 'offer-led';
  }

  // 2. Detect Messaging Angle
  let angle: MessagingAngle = 'differentiation';
  if (text.includes('perbaiki') || text.includes('glowing') || text.includes('cerah') || text.includes('mulus') || text.includes('pudar')) {
    angle = 'transformation';
  } else if (text.includes('parah') || text.includes('sensitif') || text.includes('ketarik') || text.includes('perih')) {
    angle = 'pain point';
  } else if (text.includes('murah') || text.includes('cuma') || text.includes('30rb') || text.includes('hemat') || text.includes('terjangkau')) {
    angle = 'price/value';
  } else if (text.includes('terjual') || text.includes('rating') || text.includes('viral') || text.includes('favorit')) {
    angle = 'social proof';
  } else if (text.includes('uji') || text.includes('dermatologist') || text.includes('halal') || text.includes('aman')) {
    angle = 'trust';
  } else if (text.includes('alami') || text.includes('vegan') || text.includes('kualitas') || text.includes('organik')) {
    angle = 'quality';
  }

  // 3. Detect Offer Type
  let offer: OfferType = 'no explicit offer';
  if (text.includes('paket') || text.includes('bundle') || text.includes('buy 2 get 1') || text.includes('b2g1') || text.includes('bundling')) {
    offer = 'bundle';
  } else if (text.includes('gratis') || text.includes('free gift') || text.includes('free sample')) {
    offer = 'bonus';
  } else if (text.includes('ongkir') || text.includes('free ongkir')) {
    offer = 'free shipping';
  } else if (text.includes('diskon') || text.includes('%') || text.includes('off') || text.includes('potongan')) {
    offer = 'discount';
  } else if (text.includes('garansi') || text.includes('100% original')) {
    offer = 'guarantee';
  } else if (text.includes('terbatas') || text.includes('flash sale') || text.includes('minggu ini')) {
    offer = 'limited time';
  }

  // 4. Calculate Longevity Tier
  const days = ad.observedDays || calculateObservedDays(ad.firstSeen, ad.lastSeen);
  let longevityTier: LongevityTier = 'testing';
  if (days <= 7) longevityTier = 'new_detected';
  else if (days <= 21) longevityTier = 'testing';
  else if (days <= 60) longevityTier = 'established';
  else longevityTier = 'high_longevity';

  // Explicitly note intelligence philosophy on longevity
  const strategicImportanceHypothesis = days > 45 
    ? 'High observed longevity (45+ days) suggests advertiser prioritizes this concept, but performance cannot be confirmed from public observation alone.'
    : days <= 7 
    ? 'Newly detected creative in initial public observation window; monitoring for persistence or rapid pause.'
    : 'Active observation within standard testing lifecycle.';

  // Deterministic Confidence based on data completeness
  const hasMedia = Boolean(ad.mediaUrl || ad.thumbnailUrl);
  const hasCompleteCopy = Boolean(ad.headline && ad.primaryText);
  const confidence: ConfidenceLevel = (hasMedia && hasCompleteCopy && days > 3) ? 'HIGH' : (hasCompleteCopy ? 'MEDIUM' : 'LOW');

  return {
    id: `ci_${ad.id}`,
    adObservationId: ad.id,
    format: ad.format,
    hookType,
    messagingAngle: angle,
    offerType: offer,
    cta: ad.CTA,
    observedDurationDays: days,
    longevityTier,
    strategicImportanceHypothesis,
    confidence,
  };
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

    families.push({
      familyId: `fam_${key.replace(/[^a-zA-Z0-9]/g, '_')}_${index++}`,
      workspaceId: repAd.workspaceId,
      competitorId: repAd.competitorId,
      name: `${capitalize(ci.hookType)} Hook & ${capitalize(ci.messagingAngle)} Concept (${memberAds.length} variations)`,
      representativeCreativeId: repAd.id,
      memberAdIds: memberAds.map((m) => m.id),
      commonHook: ci.hookType,
      commonAngle: ci.messagingAngle,
      commonOffer: ci.offerType,
      format: ci.format,
      confidence: memberAds.length > 2 ? 'HIGH' : 'MEDIUM',
      averageLongevityDays: avgDays,
      description: `Creative cluster sharing ${ci.hookType} hook with ${ci.messagingAngle} messaging angle. Representative variation active for ${repAd.observedDays} observed days.`,
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
  competitorMap: Map<string, string> // id -> name
): MarketSignal[] {
  const signals: MarketSignal[] = [];

  // Filter ads for this workspace
  const workspaceAds = ads.filter((a) => a.workspaceId === workspaceId);
  if (workspaceAds.length === 0) return [];

  // 1. Detect Creative Surge per competitor (>= 2 ads launched in last 7 days)
  const competitorAdCounts = new Map<string, AdObservation[]>();
  for (const ad of workspaceAds) {
    if (!competitorAdCounts.has(ad.competitorId)) {
      competitorAdCounts.set(ad.competitorId, []);
    }
    competitorAdCounts.get(ad.competitorId)!.push(ad);
  }

  for (const [compId, compAds] of competitorAdCounts.entries()) {
    const recentAds = compAds.filter((a) => (a.observedDays || 1) <= 7);
    const compName = competitorMap.get(compId) || 'Competitor';

    if (recentAds.length >= 2) {
      const evidence: EvidenceItem[] = [
        {
          evidenceId: `ev_surge_${compId}`,
          type: 'LAUNCH_FREQUENCY_DELTA',
          description: `${compName} published ${recentAds.length} newly observed creatives in the past 7 days.`,
          sourceId: compId,
          observedAt: new Date().toISOString(),
          value: `${recentAds.length} new creatives`,
          supportingIds: recentAds.map((a) => a.id),
        },
      ];

      signals.push({
        id: `sig_surge_${compId}_${Date.now().toString().slice(-4)}`,
        workspaceId,
        type: 'CREATIVE_SURGE',
        title: `${compName} Creative Launch Surge`,
        description: `High launch frequency detected: ${recentAds.length} new ads detected within 7 days.`,
        whyItMatters: 'Competitor may be scaling new angles, testing fresh hooks, or aggressively combating creative fatigue.',
        severity: 'high',
        confidence: recentAds.length >= 3 ? 'HIGH' : 'MEDIUM',
        detectedAt: new Date().toISOString(),
        evidence,
        relatedCompetitors: [compId],
        relatedAds: recentAds.map((a) => a.id),
        relatedCreatives: recentAds.map((a) => a.creativeId),
        status: 'active',
        triad: {
          observed: `${compName} has launched ${recentAds.length} unique ad creatives within 7 days.`,
          inferred: 'The brand is actively diversifying creative angles to prevent ad fatigue.',
          hypothesis: 'Recent budget shifts into testing or a planned promotional blitz in progress.',
        },
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 2. Detect Format Shift (e.g. Video vs Static)
  const total = workspaceAds.length;
  const videoCount = workspaceAds.filter((a) => a.format === 'video').length;
  const videoPct = Math.round((videoCount / total) * 100);

  if (videoPct >= 60) {
    signals.push({
      id: `sig_format_shift_${Date.now().toString().slice(-4)}`,
      workspaceId,
      type: 'FORMAT_SHIFT',
      title: 'Short-Form Video Dominance Across Monitored Competitors',
      description: `Vertical video accounts for ${videoPct}% (${videoCount}/${total}) of all active observed advertisements.`,
      whyItMatters: 'Indicates user attention in this category has shifted heavily toward dynamic UGC and motion demonstrations.',
      severity: 'medium',
      confidence: 'HIGH',
      detectedAt: new Date().toISOString(),
      evidence: [
        {
          evidenceId: `ev_video_ratio_${workspaceId}`,
          type: 'FORMAT_RATIO',
          description: `Video format represents ${videoPct}% of total observed inventory across ${competitorAdCounts.size} brands.`,
          sourceId: workspaceId,
          observedAt: new Date().toISOString(),
          value: `${videoPct}%`,
          currentValue: `${videoPct}%`,
          supportingIds: workspaceAds.filter((a) => a.format === 'video').slice(0, 4).map((a) => a.id),
        },
      ],
      relatedCompetitors: Array.from(competitorAdCounts.keys()).slice(0, 3),
      relatedAds: workspaceAds.filter((a) => a.format === 'video').slice(0, 4).map((a) => a.id),
      relatedCreatives: workspaceAds.filter((a) => a.format === 'video').slice(0, 4).map((a) => a.creativeId),
      status: 'active',
      triad: {
        observed: `${videoCount} out of ${total} active observed creatives utilize video format.`,
        inferred: 'Advertisers find video essential to establish proof or capture feed dwell time.',
        hypothesis: 'Static banner formats may encounter higher CPMs or lower thumb-stop rates in this category.',
      },
      createdAt: new Date().toISOString(),
    });
  }

  return signals;
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
