import React, { useState } from 'react';
import { AlcoAdsIntegrationContract } from '../../types/radar';
import {
  Share2,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Zap,
  Code2,
  ExternalLink,
} from 'lucide-react';

interface AlcoBridgeViewProps {
  workspaceName: string;
}

export const AlcoBridgeView: React.FC<AlcoBridgeViewProps> = ({ workspaceName }) => {
  const [showJsonSchema, setShowJsonSchema] = useState(false);

  // Sample contract data illustrating real cross-product communication
  const sampleContract: AlcoAdsIntegrationContract = {
    firstPartyContext: {
      connectedAccountId: 'act_alco_demo_101',
      accountName: 'Lumina Derma First-Party Brand',
      activeCreativesCount: 14,
      topFirstPartyAngles: ['discount', 'general transformation'],
      topFirstPartyHooks: ['offer-led', 'curiosity'],
      topFirstPartyOffers: ['15% off coupon', 'free shipping'],
      flaggedFatiguedCreativeCount: 4,
    },
    marketRadarContext: {
      workspaceId: 'ws_id_skincare',
      workspaceName: workspaceName,
      monitoredCompetitorsCount: 5,
      activeSignalsCount: 3,
      dominantSurgingAngles: ['clinical authority', 'barrier protection'],
      dominantSurgingHooks: ['doctor review', 'problem-first'],
    },
    synthesizedOpportunities: [
      {
        id: 'opp_1',
        opportunityTitle: 'Counter Fatigue with Clinical Authority Proof',
        radarEvidence: 'Competitors shifted 65% of ads to doctor endorsements and bio-fermentation with 45+ observed days active.',
        firstPartyAdDiagnosis: 'Internal 3-second retention dropped -32% on lifestyle discount images.',
        recommendedAction: 'Deploy 3 vertical UGC video hooks featuring dermatologist formulation breakdown.',
        confidence: 'HIGH',
      },
      {
        id: 'opp_2',
        opportunityTitle: 'Protect Margin via Routine Bundling',
        radarEvidence: '4 of 5 monitored competitors moved away from single item discounts to 3-step routine bundles (Rp 189k-249k).',
        firstPartyAdDiagnosis: 'Single-SKU discount ads are eroding blended contribution margin and AOV.',
        recommendedAction: 'Package Barrier Repair Serum + Cleanser into "Skin Rescue Kit" to anchor AOV at Rp 199k+.',
        confidence: 'HIGH',
      },
    ],
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Ecosystem Architecture
          </span>
          <span className="text-xs text-slate-400 font-mono">Clean Integration Boundary</span>
        </div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Share2 className="w-6 h-6 text-indigo-400" />
          ALCO Cross-Product Integration Bridge
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          Alco Market Radar connects external market intelligence to First-Party advertising execution without code entanglement or brittle repository coupling.
        </p>
      </div>

      {/* Conceptual Distinction: 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: ALCO ADS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="text-blue-400 text-xs font-bold uppercase tracking-wider">
            Product I: Sibling Product
          </div>
          <h2 className="text-base font-extrabold text-white">ALCO META ADS ANALYSIS</h2>
          <div className="text-xs font-semibold text-blue-300 bg-blue-950/40 p-2.5 rounded border border-blue-800/40">
            "WHAT IS HAPPENING TO MY ADVERTISING?"
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
            <li className="flex items-center gap-2">✓ First-party ad spend & ROAS</li>
            <li className="flex items-center gap-2">✓ Internal creative fatigue detection</li>
            <li className="flex items-center gap-2">✓ Funnel leak diagnosis</li>
            <li className="flex items-center gap-2">✓ First-party landing page conversion</li>
          </ul>
        </div>

        {/* Pillar 2: ALCO RADAR */}
        <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-5 space-y-3 shadow-lg">
          <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Product II: Current MVP</span>
            <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300">ACTIVE</span>
          </div>
          <h2 className="text-base font-extrabold text-white">ALCO MARKET RADAR</h2>
          <div className="text-xs font-semibold text-indigo-300 bg-indigo-950/40 p-2.5 rounded border border-indigo-800/40">
            "WHAT IS HAPPENING IN MY MARKET?"
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-1">
            <li className="flex items-center gap-2">✓ Competitor launch velocity & surges</li>
            <li className="flex items-center gap-2">✓ Public creative longevity tracking</li>
            <li className="flex items-center gap-2">✓ Macro format & hook pattern shifts</li>
            <li className="flex items-center gap-2">✓ Market gaps & unserved angles</li>
          </ul>
        </div>

        {/* Pillar 3: THE SYNTHESIS */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-xl p-5 space-y-3">
          <div className="text-purple-400 text-xs font-bold uppercase tracking-wider">
            Unified Ecosystem Value
          </div>
          <h2 className="text-base font-extrabold text-white">ALCO INTELLIGENCE</h2>
          <div className="text-xs font-semibold text-purple-300 bg-purple-950/40 p-2.5 rounded border border-purple-800/40">
            "WHAT SHOULD I DO NEXT?"
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            Combines internal performance constraints with external market movements to formulate high-conviction creative hypotheses and pricing defense.
          </p>
        </div>
      </div>

      {/* Live Interactive Cross-Product Diagnosis Simulation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Cross-Product Diagnostic Synthesis ({workspaceName})
            </h3>
            <p className="text-xs text-slate-400">
              Live simulation of how ALCO RADAR market observations contextualize ALCO ADS performance metrics
            </p>
          </div>

          <button
            onClick={() => setShowJsonSchema(!showJsonSchema)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>{showJsonSchema ? 'Hide Contract JSON' : 'Inspect Contract JSON'}</span>
          </button>
        </div>

        {/* JSON Contract Drawer */}
        {showJsonSchema && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-72">
            <pre>{JSON.stringify(sampleContract, null, 2)}</pre>
          </div>
        )}

        {/* Visual Diagnostic Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: First-Party Problem (from Alco Ads) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>ALCO ADS (First-Party Observation)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-medium text-[11px]">Observed Symptom:</div>
                <div className="text-white font-bold mt-0.5">3-Second Hook Retention dropped -32% across Main Ad Set</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-medium text-[11px]">First-Party Setup:</div>
                <div className="text-slate-300 mt-0.5">Static banner creatives running standard 15% discount for 45 days.</div>
              </div>
            </div>
          </div>

          {/* Right: Market Context (from Alco Radar) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>ALCO RADAR (Market Signal Context)</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-medium text-[11px]">Market Fact:</div>
                <div className="text-white font-bold mt-0.5">65% of competitor volume shifted to Doctor-Verified Vertical UGC</div>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-medium text-[11px]">Longevity Proof:</div>
                <div className="text-slate-300 mt-0.5">Clinical authority creatives by Dermalux active for 58+ consecutive days.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Synthesis Action Result */}
        <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-5 space-y-3">
          <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Recommended Ecosystem Action Hypothesis
          </div>
          <p className="text-sm font-semibold text-white">
            "Your creative fatigue is not just internal; user attention has migrated to clinical authority video proof. Pivot 20% of testing budget immediately to vertical UGC testimonials addressing ingredient bio-fermentation."
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-200/80 pt-1">
            <span>Priority: <strong className="text-white font-bold">IMMEDIATE</strong></span>
            <span>•</span>
            <span>Confidence: <strong className="text-emerald-400 font-bold">HIGH</strong></span>
            <span>•</span>
            <span>Traceable Evidence: <strong className="text-white">4 Competitor Ads</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
