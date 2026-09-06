/**
 * ALCO MARKET RADAR - Domain Types & Schemas
 * Core Intelligence Philosophy:
 * OBSERVE -> NORMALIZE -> ANALYZE -> INFER -> EXPLAIN -> ACT
 * Strictly distinguishing between OBSERVED, INFERRED, and HYPOTHESIS.
 */

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type FormatType = 
  | 'static image' 
  | 'video' 
  | 'carousel' 
  | 'collection' 
  | 'other' 
  | 'unknown';

export type HookType = 
  | 'problem' 
  | 'curiosity' 
  | 'result' 
  | 'testimonial' 
  | 'comparison' 
  | 'authority' 
  | 'urgency' 
  | 'educational' 
  | 'emotional' 
  | 'offer-led' 
  | 'unknown';

export type MessagingAngle = 
  | 'pain point' 
  | 'transformation' 
  | 'convenience' 
  | 'price/value' 
  | 'quality' 
  | 'trust' 
  | 'social proof' 
  | 'status' 
  | 'fear/risk reduction' 
  | 'education' 
  | 'differentiation' 
  | 'other' 
  | 'unknown';

export type OfferType = 
  | 'discount' 
  | 'bundle' 
  | 'free shipping' 
  | 'bonus' 
  | 'trial' 
  | 'guarantee' 
  | 'limited time' 
  | 'informational' 
  | 'no explicit offer' 
  | 'unknown';

export type CtaType = 
  | 'shop now' 
  | 'learn more' 
  | 'sign up' 
  | 'contact' 
  | 'get offer' 
  | 'order now' 
  | 'unknown';

export type CompetitorStatus = 'active' | 'pausing' | 'surging' | 'dormant';
export type MonitoringStatus = 'monitoring' | 'paused' | 'archived';
export type CompetitorPriority = 'high' | 'medium' | 'low';

export interface MarketWorkspace {
  id: string;
  name: string;
  category: string;
  description: string;
  keywords: string[];
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Competitor {
  id: string;
  workspaceId: string;
  name: string;
  category: string;
  description: string;
  website: string;
  metaPageId?: string;
  instagramHandle?: string;
  status: CompetitorStatus;
  monitoringStatus: MonitoringStatus;
  priority: CompetitorPriority;
  tags: string[];
  notes: string;
  firstSeen: string;
  lastObserved: string;
  avatarUrl?: string;
  color: string;
}

export interface AdObservation {
  id: string;
  workspaceId: string;
  competitorId: string;
  externalAdId: string;
  platform: 'meta' | 'instagram' | 'audience_network' | 'messenger' | 'other';
  advertiserName: string;
  pageName: string;
  adStatus: 'active' | 'inactive' | 'unknown';
  firstSeen: string;
  lastSeen: string;
  detectedAt: string;
  format: FormatType;
  primaryText: string;
  headline: string;
  description: string | null;
  CTA: CtaType;
  destinationUrl: string;
  landingPageId: string | null;
  mediaUrl: string;
  thumbnailUrl: string;
  creativeId: string;
  observationSource: 'META_ADS_LIBRARY' | 'PUBLIC_OBSERVATION' | 'USER_PROVIDED' | 'SYNTHETIC_DEMO';
  rawSourceMetadata?: Record<string, any>;
  observedDays: number;
}

export type LongevityTier = 'new_detected' | 'testing' | 'established' | 'high_longevity';

export interface CreativeIntelligence {
  id: string;
  adObservationId: string;
  creativeFamilyId?: string;
  format: FormatType;
  hookType: HookType;
  messagingAngle: MessagingAngle;
  offerType: OfferType;
  cta: CtaType;
  observedDurationDays: number;
  longevityTier: LongevityTier;
  strategicImportanceHypothesis: string;
  confidence: ConfidenceLevel;
}

export interface CreativeFamily {
  familyId: string;
  workspaceId: string;
  competitorId: string;
  name: string;
  representativeCreativeId: string;
  memberAdIds: string[];
  commonHook: HookType;
  commonAngle: MessagingAngle;
  commonOffer: OfferType;
  format: FormatType;
  confidence: ConfidenceLevel;
  averageLongevityDays: number;
  description: string;
}

export type SignalType = 
  | 'NEW_COMPETITOR'
  | 'NEW_CREATIVE'
  | 'CREATIVE_SURGE'
  | 'CREATIVE_DISAPPEARANCE'
  | 'NEW_OFFER'
  | 'OFFER_SHIFT'
  | 'NEW_MESSAGING_ANGLE'
  | 'CREATIVE_PATTERN_SHIFT'
  | 'FORMAT_SHIFT'
  | 'COMPETITOR_ACTIVITY_CHANGE'
  | 'MARKET_TREND'
  | 'POTENTIAL_MARKET_GAP';

export type SignalSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SignalStatus = 'active' | 'acknowledged' | 'investigating' | 'archived';

export interface EvidenceItem {
  evidenceId: string;
  type: string;
  description: string;
  sourceId: string;
  observedAt: string;
  value: string | number;
  previousValue?: string | number;
  currentValue?: string | number;
  supportingIds?: string[];
}

export interface MarketSignal {
  id: string;
  workspaceId: string;
  type: SignalType;
  title: string;
  description: string;
  whyItMatters: string;
  severity: SignalSeverity;
  confidence: ConfidenceLevel;
  detectedAt: string;
  evidence: EvidenceItem[];
  relatedCompetitors: string[]; // competitor IDs
  relatedAds: string[]; // ad observation IDs
  relatedCreatives: string[];
  status: SignalStatus;
  triad: {
    observed: string;
    inferred: string;
    hypothesis: string;
  };
  createdAt: string;
}

export interface LandingPageObservation {
  landingPageId: string;
  workspaceId: string;
  competitorId: string;
  url: string;
  domain: string;
  title: string;
  metaDescription: string;
  firstObserved: string;
  lastObserved: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  detectedPrice: string | null;
  detectedOffer: string | null;
  hasSocialProof: boolean;
  hasGuarantee: boolean;
  hasUrgency: boolean;
  pageSections: string[];
}

export interface MarketTrendMetric {
  dimension: 'format' | 'hook' | 'angle' | 'offer';
  name: string;
  previousPeriodPct: number;
  currentPeriodPct: number;
  deltaPercentagePoints: number;
  trendDirection: 'up' | 'down' | 'neutral';
  competitorBreadthCount: number; // how many competitors use this
}

/**
 * Clean architectural contract for future integration with ALCO META ADS ANALYSIS
 * Cross-product bridge:
 * ALCO ADS: "WHAT IS HAPPENING TO MY ADVERTISING?"
 * ALCO RADAR: "WHAT IS HAPPENING IN MY MARKET?"
 * ALCO INTELLIGENCE: "GIVEN MY PERFORMANCE AND MY MARKET, WHAT SHOULD I DO NEXT?"
 */
export interface AlcoAdsIntegrationContract {
  firstPartyContext: {
    connectedAccountId?: string;
    accountName: string;
    activeCreativesCount: number;
    topFirstPartyAngles: string[];
    topFirstPartyHooks: string[];
    topFirstPartyOffers: string[];
    flaggedFatiguedCreativeCount: number;
  };
  marketRadarContext: {
    workspaceId: string;
    workspaceName: string;
    monitoredCompetitorsCount: number;
    activeSignalsCount: number;
    dominantSurgingAngles: string[];
    dominantSurgingHooks: string[];
  };
  synthesizedOpportunities: Array<{
    id: string;
    opportunityTitle: string;
    radarEvidence: string;
    firstPartyAdDiagnosis: string;
    recommendedAction: string;
    confidence: ConfidenceLevel;
  }>;
}

export interface AISignalSynthesisResponse {
  summary: string;
  observed: string[];
  inferred: string[];
  hypotheses: string[];
  opportunities: string[];
  threats: string[];
  confidence: ConfidenceLevel;
  evidenceIds: string[];
}
