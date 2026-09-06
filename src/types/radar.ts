/**
 * ALCO MARKET RADAR - Domain Types & Schemas
 * Core Intelligence Philosophy:
 * OBSERVE -> NORMALIZE -> ANALYZE -> INFER -> EXPLAIN -> ACT
 * Strictly distinguishing between OBSERVED, INFERRED, and HYPOTHESIS.
 */

export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type EvidenceConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type InterpretationConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type HypothesisConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ConfidenceAssessment {
  evidence: EvidenceConfidenceLevel;
  interpretation: InterpretationConfidenceLevel;
  hypothesis?: HypothesisConfidenceLevel;
  rationale?: string;
}

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

export interface ObservationSnapshot {
  id: string;
  workspaceId: string;
  entityType: 'AD' | 'COMPETITOR' | 'CREATIVE' | 'LANDING_PAGE';
  entityId: string;
  observedAt: string;
  status?: 'active' | 'inactive' | 'unknown';
  format?: FormatType;
  active?: boolean;
  headline?: string;
  primaryAngle?: MessagingAngle;
  primaryHook?: HookType;
  metadata?: Record<string, unknown>;
}

export type LongevityTier = 'new_detected' | 'testing' | 'established' | 'high_longevity';

export interface CreativeIntelligence {
  id: string;
  adObservationId: string;
  creativeFamilyId?: string;
  format: FormatType;
  hookType: HookType; // preserved for backward compatibility (primary hook)
  messagingAngle: MessagingAngle; // preserved for backward compatibility (primary angle)
  offerType: OfferType;
  cta: CtaType;
  primaryHook: HookType;
  secondaryHooks?: HookType[];
  primaryAngle: MessagingAngle;
  secondaryAngles?: MessagingAngle[];
  observedDurationDays: number;
  longevityTier: LongevityTier;
  strategicImportanceHypothesis: string;
  confidence: ConfidenceLevel; // overall confidence
  confidenceAssessment?: ConfidenceAssessment;
  hookConfidence?: ConfidenceLevel;
  angleConfidence?: ConfidenceLevel;
  offerConfidence?: ConfidenceLevel;
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
  confidenceAssessment?: ConfidenceAssessment;
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

export interface EvidenceChain {
  observation: string;
  evidenceSummary: string;
  pattern: string;
  signal: string;
  interpretation: string;
  hypothesis: string;
  strategicImplication: string;
}

export interface MarketSignal {
  id: string;
  workspaceId: string;
  type: SignalType;
  title: string;
  description: string;
  whyItMatters: string;
  severity: SignalSeverity;
  confidence: ConfidenceLevel; // backward-compat overall confidence
  confidenceAssessment?: ConfidenceAssessment;
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
  observedFacts?: string[];
  calculatedPatterns?: string[];
  interpretation?: string;
  hypothesis?: string;
  strategicImplication?: string;
  nextActions?: string[];
  evidenceChain?: EvidenceChain;
  createdAt: string;
}

export interface CompetitorVelocity {
  competitorId: string;
  competitorName: string;
  newCreativesCurrentPeriod: number;
  newCreativesPreviousPeriod: number;
  velocityChangePct: number;
  disappearedCreatives: number;
  activeInventoryCount: number;
  netCreativeChange: number;
  dominantFormat: FormatType;
  dominantAngle: MessagingAngle;
}

export interface TemporalTrendReport {
  workspaceId: string;
  periodDays: number;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  totalActiveCreatives: number;
  newCreativesCount: number;
  disappearedCreativesCount: number;
  overallTurnoverRate: number;
  formatShifts: MarketTrendMetric[];
  hookShifts: MarketTrendMetric[];
  angleShifts: MarketTrendMetric[];
  offerShifts: MarketTrendMetric[];
  competitorVelocities: CompetitorVelocity[];
  calculatedAt: string;
}

export interface MarketOpportunityScore {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  score: number; // 0-100 composite score
  novelty: number; // 0-100
  adoptionGap: number; // 0-100 (uncontested space)
  evidenceStrength: number; // 0-100
  saturation: number; // 0-100
  confidence: ConfidenceAssessment;
  uncontestedAngle?: string;
  recommendedExploration?: string;
  supportingEvidenceIds?: string[];
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
  confidence: ConfidenceLevel | ConfidenceAssessment;
  confidenceAssessment?: ConfidenceAssessment;
  evidenceIds: string[];
  nextActions?: string[];
}
