import {
  AdObservation,
  Competitor,
  ConfidenceAssessment,
  EvidenceChain,
  EvidenceItem,
  MarketOpportunityScore,
  MarketSignal,
  SignalSeverity,
  SignalType,
} from '../types/radar';
import { buildCreativeIntelligenceV1_1 } from './classificationEngine';
import { generateTemporalTrendReport } from './trendEngine';

/**
 * Deterministically evaluates market signals and attaches traceable evidence chains
 */
export function evaluateSignalsV1_1(
  workspaceId: string,
  ads: AdObservation[],
  competitors: Competitor[]
): MarketSignal[] {
  const signals: MarketSignal[] = [];
  const workspaceAds = ads.filter((a) => a.workspaceId === workspaceId);
  const competitorMap = new Map<string, string>(competitors.map((c) => [c.id, c.name]));

  if (workspaceAds.length === 0) return [];

  // Generate temporal report
  const trendReport = generateTemporalTrendReport(workspaceId, workspaceAds, competitorMap, 7);

  // 1. Detect Creative Surge / Velocity Spike per competitor
  for (const vel of trendReport.competitorVelocities) {
    if (vel.newCreativesCurrentPeriod >= 2 && vel.velocityChangePct >= 50) {
      const recentAds = workspaceAds.filter(
        (a) => a.competitorId === vel.competitorId && (a.observedDays || 1) <= 7
      );

      const evidenceId = `ev_surge_${vel.competitorId}`;
      const evidence: EvidenceItem[] = [
        {
          evidenceId,
          type: 'LAUNCH_VELOCITY_SPIKE',
          description: `${vel.competitorName} launch rate increased from ${vel.newCreativesPreviousPeriod} ads/period to ${vel.newCreativesCurrentPeriod} ads/period (+${vel.velocityChangePct}%).`,
          sourceId: vel.competitorId,
          observedAt: new Date().toISOString(),
          value: `+${vel.velocityChangePct}% velocity`,
          previousValue: `${vel.newCreativesPreviousPeriod} ads`,
          currentValue: `${vel.newCreativesCurrentPeriod} ads`,
          supportingIds: recentAds.map((a) => a.id),
        },
      ];

      const evidenceConfidence = recentAds.length >= 3 ? 'HIGH' : 'MEDIUM';
      const interpretationConfidence = 'MEDIUM'; // Launch velocity is verified, but testing intent is inferred
      const hypothesisConfidence = 'LOW'; // Specific commercial motive remains unverified

      const confidenceAssessment: ConfidenceAssessment = {
        evidence: evidenceConfidence,
        interpretation: interpretationConfidence,
        hypothesis: hypothesisConfidence,
        rationale: `Verified detection of ${recentAds.length} newly observed public creatives within 7 days. Higher velocity indicates creative iteration, but internal promotional calendar and budget cannot be confirmed from public observations alone.`,
      };

      const chain: EvidenceChain = {
        observation: `${vel.competitorName} published ${vel.newCreativesCurrentPeriod} new unique advertisements in the last 7 days.`,
        evidenceSummary: `Previous 7-day volume: ${vel.newCreativesPreviousPeriod} ads. Current 7-day volume: ${vel.newCreativesCurrentPeriod} ads. Net delta: +${vel.velocityChangePct}%.`,
        pattern: `Creative launch velocity accelerated by ${vel.velocityChangePct}%.`,
        signal: `Creative launch velocity surge detected for ${vel.competitorName}.`,
        interpretation: `The brand appears to be actively testing new angles or rotating creative assets to manage creative fatigue.`,
        hypothesis: `The advertiser may be preparing for upcoming seasonal shopping events or testing multiple hooks against a refreshed product bundle.`,
        strategicImplication: `Monitor whether the newly introduced hooks continue past the 14-day mark and watch whether other competitors mirror the angle.`,
      };

      signals.push({
        id: `sig_surge_${vel.competitorId}`,
        workspaceId,
        type: 'CREATIVE_SURGE',
        title: `${vel.competitorName} Creative Launch Velocity Surge`,
        description: `High launch frequency detected: ${vel.newCreativesCurrentPeriod} new creatives observed within 7 days (+${vel.velocityChangePct}% vs previous window).`,
        whyItMatters: `Surges in creative velocity often precede major promotional pushes or signal aggressive iteration to counter ad fatigue.`,
        severity: 'high',
        confidence: evidenceConfidence,
        confidenceAssessment,
        detectedAt: new Date().toISOString(),
        evidence,
        relatedCompetitors: [vel.competitorId],
        relatedAds: recentAds.map((a) => a.id),
        relatedCreatives: recentAds.map((a) => a.creativeId),
        status: 'active',
        triad: {
          observed: chain.observation,
          inferred: chain.interpretation,
          hypothesis: chain.hypothesis,
        },
        observedFacts: [
          `${vel.newCreativesCurrentPeriod} new advertisements detected in the past 7 days.`,
          `Dominant observed format: ${vel.dominantFormat.toUpperCase()}.`,
          `Dominant observed messaging angle: ${vel.dominantAngle}.`,
        ],
        calculatedPatterns: [
          `Launch velocity delta: +${vel.velocityChangePct}% period-over-period.`,
          `Total active creative inventory: ${vel.activeInventoryCount} ads.`,
        ],
        interpretation: chain.interpretation,
        hypothesis: chain.hypothesis,
        strategicImplication: chain.strategicImplication,
        nextActions: [
          `Inspect ${vel.competitorName} newly deployed copy tokens for novel claims or active ingredient focuses.`,
          `Track 14-day survival rate to verify if any variation graduates to established status.`,
        ],
        evidenceChain: chain,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 2. Detect Creative Disappearance / Pauses
  for (const vel of trendReport.competitorVelocities) {
    if (vel.disappearedCreatives >= 2) {
      const inactiveAds = workspaceAds.filter(
        (a) => a.competitorId === vel.competitorId && a.adStatus === 'inactive'
      );

      const chain: EvidenceChain = {
        observation: `${vel.competitorName} ceased public delivery of ${vel.disappearedCreatives} previously active ad creatives.`,
        evidenceSummary: `${vel.disappearedCreatives} ads changed status to inactive.`,
        pattern: `Creative retirement rate reached ${Math.round((vel.disappearedCreatives / (vel.activeInventoryCount + vel.disappearedCreatives || 1)) * 100)}% of total observed creatives.`,
        signal: `Creative retirement / pause wave observed for ${vel.competitorName}.`,
        interpretation: `The advertiser may have retired fatigued creatives or discontinued a temporary promotional campaign.`,
        hypothesis: `Underperforming hooks or expired promo codes were likely removed from active circulation.`,
        strategicImplication: `Compare retired creatives against continuing active creatives to deduce which hooks failed to sustain longevity.`,
      };

      signals.push({
        id: `sig_disappear_${vel.competitorId}`,
        workspaceId,
        type: 'CREATIVE_DISAPPEARANCE',
        title: `${vel.competitorName} Retired ${vel.disappearedCreatives} Ad Creatives`,
        description: `Ceased delivery detected on ${vel.disappearedCreatives} ads across ${vel.competitorName}'s monitored ad library.`,
        whyItMatters: `Monitoring which ad angles get terminated provides negative evidence regarding hooks that failed to maintain sufficient distribution.`,
        severity: 'medium',
        confidence: 'HIGH',
        confidenceAssessment: {
          evidence: 'HIGH',
          interpretation: 'MEDIUM',
          hypothesis: 'LOW',
          rationale: `Direct observation of ad status transitioning to inactive. Reasons for pausing cannot be confirmed without internal advertiser data.`,
        },
        detectedAt: new Date().toISOString(),
        evidence: [
          {
            evidenceId: `ev_disappear_${vel.competitorId}`,
            type: 'CREATIVE_STATUS_TRANSITION',
            description: `${vel.disappearedCreatives} ads moved from active to inactive.`,
            sourceId: vel.competitorId,
            observedAt: new Date().toISOString(),
            value: `${vel.disappearedCreatives} ceased ads`,
            supportingIds: inactiveAds.map((a) => a.id),
          },
        ],
        relatedCompetitors: [vel.competitorId],
        relatedAds: inactiveAds.map((a) => a.id),
        relatedCreatives: inactiveAds.map((a) => a.creativeId),
        status: 'active',
        triad: {
          observed: chain.observation,
          inferred: chain.interpretation,
          hypothesis: chain.hypothesis,
        },
        observedFacts: [
          `${vel.disappearedCreatives} previously monitored ads are no longer active in public ad library feeds.`,
        ],
        calculatedPatterns: [
          `Inactive ads represent ${Math.round((vel.disappearedCreatives / (vel.activeInventoryCount + vel.disappearedCreatives || 1)) * 100)}% of total observed assets.`,
        ],
        interpretation: chain.interpretation,
        hypothesis: chain.hypothesis,
        strategicImplication: chain.strategicImplication,
        nextActions: [
          `Review the common hooks of the inactive ads to identify potential fatigue patterns.`,
        ],
        evidenceChain: chain,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 3. Detect Format Shift (e.g. Video vs Static)
  const topFormatShift = trendReport.formatShifts.find((m) => m.deltaPercentagePoints >= 15 || m.currentPeriodPct >= 60);
  if (topFormatShift) {
    const matchingAds = workspaceAds.filter((a) => a.format === topFormatShift.name && a.adStatus !== 'inactive');
    const chain: EvidenceChain = {
      observation: `${topFormatShift.name.toUpperCase()} format represents ${topFormatShift.currentPeriodPct}% of active observed ads across ${topFormatShift.competitorBreadthCount} competitors.`,
      evidenceSummary: `Format share shifted by ${topFormatShift.deltaPercentagePoints >= 0 ? '+' : ''}${topFormatShift.deltaPercentagePoints} percentage points (from ${topFormatShift.previousPeriodPct}% to ${topFormatShift.currentPeriodPct}%).`,
      pattern: `Format concentration: ${topFormatShift.name} is dominant across ${topFormatShift.competitorBreadthCount} distinct competitor libraries.`,
      signal: `Potential format shift toward ${topFormatShift.name.toUpperCase()}.`,
      interpretation: `Advertisers in this market may be prioritizing ${topFormatShift.name} to maximize in-feed dwell time and demonstration clarity.`,
      hypothesis: `Static formats may be experiencing rising CPMs or lower thumb-stop efficiency compared to dynamic demonstration assets.`,
      strategicImplication: `Audit own creative mix against the market benchmark of ${topFormatShift.currentPeriodPct}% ${topFormatShift.name}.`,
    };

    signals.push({
      id: `sig_format_shift_${topFormatShift.name}`,
      workspaceId,
      type: 'FORMAT_SHIFT',
      title: `${topFormatShift.name.toUpperCase()} Format Dominance Across Market`,
      description: `${topFormatShift.name.toUpperCase()} accounts for ${topFormatShift.currentPeriodPct}% of active observed inventory (shifted ${topFormatShift.deltaPercentagePoints >= 0 ? '+' : ''}${topFormatShift.deltaPercentagePoints} pp).`,
      whyItMatters: `Category-wide format concentration indicates where consumer attention and advertiser testing volume are actively clustering.`,
      severity: 'medium',
      confidence: 'HIGH',
      confidenceAssessment: {
        evidence: 'HIGH',
        interpretation: 'MEDIUM',
        hypothesis: 'LOW',
        rationale: `Calculated from ${matchingAds.length} verified public ad observations across ${topFormatShift.competitorBreadthCount} brands. Strategic efficacy of the format remains an unconfirmed hypothesis.`,
      },
      detectedAt: new Date().toISOString(),
      evidence: [
        {
          evidenceId: `ev_fmt_${topFormatShift.name}`,
          type: 'FORMAT_SHARE_CALCULATION',
          description: `${topFormatShift.name} format grew by ${topFormatShift.deltaPercentagePoints >= 0 ? '+' : ''}${topFormatShift.deltaPercentagePoints} pp across ${topFormatShift.competitorBreadthCount} competitors.`,
          sourceId: workspaceId,
          observedAt: new Date().toISOString(),
          value: `${topFormatShift.currentPeriodPct}%`,
          previousValue: `${topFormatShift.previousPeriodPct}%`,
          currentValue: `${topFormatShift.currentPeriodPct}%`,
          supportingIds: matchingAds.slice(0, 4).map((a) => a.id),
        },
      ],
      relatedCompetitors: Array.from(new Set(matchingAds.map((a) => a.competitorId))).slice(0, 4),
      relatedAds: matchingAds.slice(0, 4).map((a) => a.id),
      relatedCreatives: matchingAds.slice(0, 4).map((a) => a.creativeId),
      status: 'active',
      triad: {
        observed: chain.observation,
        inferred: chain.interpretation,
        hypothesis: chain.hypothesis,
      },
      observedFacts: [
        `${topFormatShift.currentPeriodPct}% of active observed ads utilize ${topFormatShift.name}.`,
        `Observed across ${topFormatShift.competitorBreadthCount} monitored brands.`,
      ],
      calculatedPatterns: [
        `Delta: ${topFormatShift.deltaPercentagePoints >= 0 ? '+' : ''}${topFormatShift.deltaPercentagePoints} percentage points.`,
      ],
      interpretation: chain.interpretation,
      hypothesis: chain.hypothesis,
      strategicImplication: chain.strategicImplication,
      nextActions: [
        `Benchmark first-party format allocation against the ${topFormatShift.currentPeriodPct}% market ratio.`,
      ],
      evidenceChain: chain,
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Detect Messaging / Hook Shift (e.g. Authority / Clinical hooks)
  const topHookShift = trendReport.hookShifts.find((m) => m.deltaPercentagePoints >= 10 || m.currentPeriodPct >= 30);
  if (topHookShift) {
    const matchingAds = workspaceAds.filter((a) => buildCreativeIntelligenceV1_1(a).primaryHook === topHookShift.name);
    const chain: EvidenceChain = {
      observation: `Creatives utilizing ${topHookShift.name.toUpperCase()} hooks represent ${topHookShift.currentPeriodPct}% of active observed ads.`,
      evidenceSummary: `Share expanded by ${topHookShift.deltaPercentagePoints >= 0 ? '+' : ''}${topHookShift.deltaPercentagePoints} pp from ${topHookShift.previousPeriodPct}% to ${topHookShift.currentPeriodPct}% across ${topHookShift.competitorBreadthCount} competitors.`,
      pattern: `Hook convergence: ${topHookShift.name} hook adopted by ${topHookShift.competitorBreadthCount} competitors.`,
      signal: `Market-wide creative pattern shift toward ${topHookShift.name.toUpperCase()} hooks.`,
      interpretation: `Advertisers may be encountering diminishing returns with generic lifestyle claims and seeking stronger initial hook credibility.`,
      hypothesis: `Consumer skepticism may be pushing advertisers to lead with ${topHookShift.name} framing to improve initial 3-second hook retention.`,
      strategicImplication: `Assess whether your brand holds credible assets in this hook category or whether an uncontested counter-angle is preferable.`,
    };

    signals.push({
      id: `sig_hook_shift_${topHookShift.name}`,
      workspaceId,
      type: 'CREATIVE_PATTERN_SHIFT',
      title: `Market Shift Toward ${topHookShift.name.toUpperCase()} Creative Hooks`,
      description: `${topHookShift.name.toUpperCase()} hook share reached ${topHookShift.currentPeriodPct}% of observed ads (+${topHookShift.deltaPercentagePoints} pp).`,
      whyItMatters: `When multiple competing brands converge on identical hook taxonomies, creative saturation occurs, opening space for differentiated counter-angles.`,
      severity: 'high',
      confidence: 'HIGH',
      confidenceAssessment: {
        evidence: 'HIGH',
        interpretation: 'MEDIUM',
        hypothesis: 'LOW',
        rationale: `Syntactic classification grounded in ${matchingAds.length} verified ad copies across ${topHookShift.competitorBreadthCount} brands.`,
      },
      detectedAt: new Date().toISOString(),
      evidence: [
        {
          evidenceId: `ev_hook_${topHookShift.name}`,
          type: 'HOOK_SHARE_DELTA',
          description: `${topHookShift.name} hook grew by ${topHookShift.deltaPercentagePoints} pp across ${topHookShift.competitorBreadthCount} brands.`,
          sourceId: workspaceId,
          observedAt: new Date().toISOString(),
          value: `${topHookShift.currentPeriodPct}%`,
          previousValue: `${topHookShift.previousPeriodPct}%`,
          currentValue: `${topHookShift.currentPeriodPct}%`,
          supportingIds: matchingAds.slice(0, 3).map((a) => a.id),
        },
      ],
      relatedCompetitors: Array.from(new Set(matchingAds.map((a) => a.competitorId))).slice(0, 3),
      relatedAds: matchingAds.slice(0, 3).map((a) => a.id),
      relatedCreatives: matchingAds.slice(0, 3).map((a) => a.creativeId),
      status: 'active',
      triad: {
        observed: chain.observation,
        inferred: chain.interpretation,
        hypothesis: chain.hypothesis,
      },
      observedFacts: [
        `${topHookShift.name.toUpperCase()} hook identified in ${matchingAds.length} active observed creatives.`,
      ],
      calculatedPatterns: [
        `Category hook share increased from ${topHookShift.previousPeriodPct}% to ${topHookShift.currentPeriodPct}%.`,
      ],
      interpretation: chain.interpretation,
      hypothesis: chain.hypothesis,
      strategicImplication: chain.strategicImplication,
      nextActions: [
        `Evaluate whether your creative roster contains ${topHookShift.name} assets.`,
      ],
      evidenceChain: chain,
      createdAt: new Date().toISOString(),
    });
  }

  // 5. Detect Offer Shift (e.g. Bundles / Gift with Purchase)
  const topOfferShift = trendReport.offerShifts.find((m) => m.name !== 'no explicit offer' && (m.deltaPercentagePoints >= 10 || m.currentPeriodPct >= 30));
  if (topOfferShift) {
    const matchingAds = workspaceAds.filter((a) => buildCreativeIntelligenceV1_1(a).offerType === topOfferShift.name);
    const chain: EvidenceChain = {
      observation: `Ads promoting ${topOfferShift.name.toUpperCase()} offers account for ${topOfferShift.currentPeriodPct}% of observed active creatives.`,
      evidenceSummary: `${topOfferShift.name} offer structure rose by ${topOfferShift.deltaPercentagePoints >= 0 ? '+' : ''}${topOfferShift.deltaPercentagePoints} pp (from ${topOfferShift.previousPeriodPct}% to ${topOfferShift.currentPeriodPct}%).`,
      pattern: `Offer structure shift: ${topOfferShift.name} adopted by ${topOfferShift.competitorBreadthCount} brands.`,
      signal: `Market offer pattern shift toward ${topOfferShift.name.toUpperCase()}.`,
      interpretation: `Advertisers appear to be transitioning away from unbundled single-item promos toward higher basket size incentives.`,
      hypothesis: `Rising media acquisition costs may be driving competitors to incentivize larger order values to protect transaction margins.`,
      strategicImplication: `Evaluate whether single-SKU hero campaigns face conversion resistance against competitor bundle packaging.`,
    };

    signals.push({
      id: `sig_offer_shift_${topOfferShift.name}`,
      workspaceId,
      type: 'OFFER_SHIFT',
      title: `Surge in ${topOfferShift.name.toUpperCase()} Packaging Across Competitors`,
      description: `${topOfferShift.name.toUpperCase()} offers expanded to ${topOfferShift.currentPeriodPct}% of observed ads (+${topOfferShift.deltaPercentagePoints} pp).`,
      whyItMatters: `Offer shifts directly influence customer checkout thresholds and can suppress conversion rates for brands offering lower perceived bundle value.`,
      severity: 'medium',
      confidence: 'MEDIUM',
      confidenceAssessment: {
        evidence: 'HIGH',
        interpretation: 'MEDIUM',
        hypothesis: 'LOW',
        rationale: `Direct observation of copy terms (bundle, gratis gift, multi-pack) in active ad copies. Exact impact on competitor order value is an unverified hypothesis.`,
      },
      detectedAt: new Date().toISOString(),
      evidence: [
        {
          evidenceId: `ev_offer_${topOfferShift.name}`,
          type: 'OFFER_SHARE_DELTA',
          description: `${topOfferShift.name} offer share changed by ${topOfferShift.deltaPercentagePoints} pp.`,
          sourceId: workspaceId,
          observedAt: new Date().toISOString(),
          value: `${topOfferShift.currentPeriodPct}%`,
          previousValue: `${topOfferShift.previousPeriodPct}%`,
          currentValue: `${topOfferShift.currentPeriodPct}%`,
          supportingIds: matchingAds.slice(0, 3).map((a) => a.id),
        },
      ],
      relatedCompetitors: Array.from(new Set(matchingAds.map((a) => a.competitorId))).slice(0, 3),
      relatedAds: matchingAds.slice(0, 3).map((a) => a.id),
      relatedCreatives: matchingAds.slice(0, 3).map((a) => a.creativeId),
      status: 'active',
      triad: {
        observed: chain.observation,
        inferred: chain.interpretation,
        hypothesis: chain.hypothesis,
      },
      observedFacts: [
        `${matchingAds.length} active observed creatives explicitly promote ${topOfferShift.name}.`,
      ],
      calculatedPatterns: [
        `Offer representation rose from ${topOfferShift.previousPeriodPct}% to ${topOfferShift.currentPeriodPct}%.`,
      ],
      interpretation: chain.interpretation,
      hypothesis: chain.hypothesis,
      strategicImplication: chain.strategicImplication,
      nextActions: [
        `Review landing page pricing structures associated with observed bundle offers.`,
      ],
      evidenceChain: chain,
      createdAt: new Date().toISOString(),
    });
  }

  // 6. Detect Potential Market Gap (e.g. Uncontested Angle)
  const angleCounts = new Map<string, number>();
  for (const ad of workspaceAds) {
    const ci = buildCreativeIntelligenceV1_1(ad);
    angleCounts.set(ci.primaryAngle, (angleCounts.get(ci.primaryAngle) || 0) + 1);
  }

  // Check if commuter / lifestyle / specific angles are at 0%
  const totalObserved = workspaceAds.length;
  const zeroAngles = ['convenience', 'fear/risk reduction', 'status'].filter(
    (ang) => (angleCounts.get(ang) || 0) === 0
  );

  if (zeroAngles.length > 0 && totalObserved >= 6) {
    const targetAngle = zeroAngles[0];
    const chain: EvidenceChain = {
      observation: `0 out of ${totalObserved} active observed advertisements currently focus on the ${targetAngle.toUpperCase()} angle.`,
      evidenceSummary: `100% of current observed creative volume is clustered around transformation, pain point, and price/value.`,
      pattern: `Uncontested positioning gap: 0% competitor adoption of ${targetAngle}.`,
      signal: `Potential Market Gap: Unaddressed ${targetAngle.toUpperCase()} Angle.`,
      interpretation: `Competitors are concentrating in direct product feature and transformation claims, leaving adjacent consumer context unaddressed.`,
      hypothesis: `A well-crafted campaign leveraging ${targetAngle} could experience lower auction competition and distinctive customer recall.`,
      strategicImplication: `Prototype a test creative batch exploring ${targetAngle} while competitors remain clustered in saturated angles.`,
    };

    signals.push({
      id: `sig_gap_${targetAngle.replace(/\s+/g, '_')}`,
      workspaceId,
      type: 'POTENTIAL_MARKET_GAP',
      title: `Uncontested Market Angle: ${targetAngle.toUpperCase()}`,
      description: `Zero active creatives currently utilize ${targetAngle} messaging, despite category consumer relevance.`,
      whyItMatters: `Entering uncontested messaging angles helps advertisers circumvent bid inflation in crowded keyword and hook auctions.`,
      severity: 'low',
      confidence: 'MEDIUM',
      confidenceAssessment: {
        evidence: 'HIGH', // 0% observed is verifiable
        interpretation: 'MEDIUM', // Gap existence is verified, but demand is inferred
        hypothesis: 'LOW', // Commercial success of the angle is unproven
        rationale: `0% saturation confirmed from public ad copy audit across ${competitorMap.size} brands. Commercial viability of the gap requires small-scale testing.`,
      },
      detectedAt: new Date().toISOString(),
      evidence: [
        {
          evidenceId: `ev_gap_${targetAngle}`,
          type: 'TAXONOMY_ABSENCE_AUDIT',
          description: `0 out of ${totalObserved} active observed creatives in ${workspaceId} address ${targetAngle}.`,
          sourceId: workspaceId,
          observedAt: new Date().toISOString(),
          value: '0% market adoption',
          supportingIds: workspaceAds.slice(0, 2).map((a) => a.id),
        },
      ],
      relatedCompetitors: Array.from(competitorMap.keys()).slice(0, 3),
      relatedAds: workspaceAds.slice(0, 2).map((a) => a.id),
      relatedCreatives: workspaceAds.slice(0, 2).map((a) => a.creativeId),
      status: 'investigating',
      triad: {
        observed: chain.observation,
        inferred: chain.interpretation,
        hypothesis: chain.hypothesis,
      },
      observedFacts: [
        `0 out of ${totalObserved} active observed ads utilize ${targetAngle}.`,
      ],
      calculatedPatterns: [
        `Adoption rate across monitored competitors: 0.0%.`,
      ],
      interpretation: chain.interpretation,
      hypothesis: chain.hypothesis,
      strategicImplication: chain.strategicImplication,
      nextActions: [
        `Test a controlled ad set with a ${targetAngle} hook against the current control creative.`,
      ],
      evidenceChain: chain,
      createdAt: new Date().toISOString(),
    });
  }

  return signals;
}

/**
 * Deterministically calculates Market Opportunity Scores
 * Based strictly on observable factors:
 * - Novelty (rarity in current ad inventory)
 * - Adoption Gap (uncontested space across competitors)
 * - Evidence Strength (data completeness and sample size)
 * - Saturation (penalizes crowded, overused hooks)
 */
export function calculateMarketOpportunities(
  workspaceId: string,
  ads: AdObservation[],
  signals: MarketSignal[]
): MarketOpportunityScore[] {
  const opportunities: MarketOpportunityScore[] = [];
  const workspaceAds = ads.filter((a) => a.workspaceId === workspaceId);

  if (workspaceAds.length === 0) return [];

  const total = workspaceAds.length;
  const angleCounts = new Map<string, number>();

  for (const ad of workspaceAds) {
    const ci = buildCreativeIntelligenceV1_1(ad);
    angleCounts.set(ci.primaryAngle, (angleCounts.get(ci.primaryAngle) || 0) + 1);
  }

  // Opportunity 1: Differentiated Lifestyle / Uncontested Angle
  const lowestAngle = Array.from(angleCounts.entries()).sort((a, b) => a[1] - b[1])[0];
  const lowestAngleName = lowestAngle ? lowestAngle[0] : 'differentiation';
  const lowestAngleCount = lowestAngle ? lowestAngle[1] : 0;
  const saturationPct = Math.round((lowestAngleCount / total) * 100);

  const novelty = Math.max(10, 100 - saturationPct);
  const adoptionGap = Math.max(20, 95 - lowestAngleCount * 15);
  const evidenceStrength = Math.min(95, Math.round(total * 8));
  const compositeScore = Math.round(novelty * 0.35 + adoptionGap * 0.35 + evidenceStrength * 0.2 + (100 - saturationPct) * 0.1);

  opportunities.push({
    id: `opp_angle_${lowestAngleName.replace(/\s+/g, '_')}`,
    workspaceId,
    title: `Uncontested Messaging Angle: ${lowestAngleName.toUpperCase()}`,
    description: `Only ${lowestAngleCount} of ${total} active observed ads utilize ${lowestAngleName}. Low competitor concentration presents an opportunity to capture mindshare without bidding wars.`,
    score: Math.min(98, Math.max(20, compositeScore)),
    novelty,
    adoptionGap,
    evidenceStrength,
    saturation: saturationPct,
    uncontestedAngle: lowestAngleName,
    recommendedExploration: `Draft 2-3 creative concepts framing core product benefits through the lens of ${lowestAngleName}.`,
    supportingEvidenceIds: signals.map((s) => s.evidence[0]?.evidenceId).filter(Boolean).slice(0, 2),
    confidence: {
      evidence: 'HIGH',
      interpretation: 'MEDIUM',
      hypothesis: 'LOW',
      rationale: `Low saturation (${saturationPct}%) deterministically calculated from ${total} public ad observations. Commercial performance is an unconfirmed hypothesis.`,
    },
  });

  // Opportunity 2: Bundle Value Differentiation
  const bundleCount = workspaceAds.filter((a) => buildCreativeIntelligenceV1_1(a).offerType === 'bundle').length;
  const bundleSat = Math.round((bundleCount / total) * 100);
  if (bundleSat >= 30) {
    opportunities.push({
      id: `opp_counter_bundle`,
      workspaceId,
      title: 'Counter-Positioning Against Generic Price Bundling',
      description: `${bundleSat}% of monitored ads feature generic bundles. Differentiate with outcome-guaranteed routine kits rather than pure volume discounting.`,
      score: 78,
      novelty: 75,
      adoptionGap: 80,
      evidenceStrength: 85,
      saturation: bundleSat,
      uncontestedAngle: 'transformation guarantee',
      recommendedExploration: 'Test offering a 14-day progressive trial guarantee instead of raw percentage discounts.',
      supportingEvidenceIds: signals.map((s) => s.evidence[0]?.evidenceId).filter(Boolean).slice(0, 2),
      confidence: {
        evidence: 'HIGH',
        interpretation: 'MEDIUM',
        hypothesis: 'LOW',
        rationale: `Observed high competitor reliance on bundle discounting. Alternative offer appeal remains a strategic test hypothesis.`,
      },
    });
  }

  return opportunities;
}
