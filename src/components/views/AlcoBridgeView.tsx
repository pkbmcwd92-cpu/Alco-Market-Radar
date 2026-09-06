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
  Target,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import { INITIAL_INTEGRATION_CONTRACT, INITIAL_MARKET_OPPORTUNITIES } from '../../data/mockData';

interface AlcoBridgeViewProps {
  workspaceName: string;
}

export const AlcoBridgeView: React.FC<AlcoBridgeViewProps> = ({ workspaceName }) => {
  const [showJsonSchema, setShowJsonSchema] = useState(false);
  const sampleContract = INITIAL_INTEGRATION_CONTRACT;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Ecosystem Architecture
            </span>
            <span className="text-xs text-slate-500 font-mono">Bridge Contract V1.1</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-blue-600" />
            Alco Bridge: Market Radar ↔ Meta Ads Integration
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Alco Market Radar connects external market intelligence to first-party advertising execution without code entanglement or brittle repository coupling.
          </p>
        </div>

        <button
          onClick={() => setShowJsonSchema(!showJsonSchema)}
          className="px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Code2 className="w-4 h-4 text-blue-600" />
          <span>{showJsonSchema ? 'Hide Contract JSON' : 'Inspect Contract JSON'}</span>
        </button>
      </div>

      {/* Conceptual Distinction: 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: ALCO ADS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">
            Sibling Product
          </div>
          <h2 className="text-base font-bold text-slate-900">Alco Meta Ads Analysis</h2>
          <div className="text-xs font-semibold text-blue-700 bg-blue-50 p-2.5 rounded border border-blue-100">
            «What is happening to MY advertising?»
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
            <li className="flex items-center gap-2"><span className="text-blue-600 font-bold">✓</span> First-party ad spend & ROAS</li>
            <li className="flex items-center gap-2"><span className="text-blue-600 font-bold">✓</span> Internal creative fatigue detection</li>
            <li className="flex items-center gap-2"><span className="text-blue-600 font-bold">✓</span> Funnel leak diagnosis</li>
            <li className="flex items-center gap-2"><span className="text-blue-600 font-bold">✓</span> First-party checkout conversion</li>
          </ul>
        </div>

        {/* Pillar 2: ALCO RADAR */}
        <div className="bg-white border border-blue-300 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="text-blue-600 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Current Product</span>
            <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded text-blue-800 font-bold">ACTIVE RADAR</span>
          </div>
          <h2 className="text-base font-bold text-slate-900">Alco Market Radar</h2>
          <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 p-2.5 rounded border border-indigo-100">
            «What is happening in MY market?»
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
            <li className="flex items-center gap-2"><span className="text-indigo-600 font-bold">✓</span> Competitor launch velocity & surges</li>
            <li className="flex items-center gap-2"><span className="text-indigo-600 font-bold">✓</span> Public creative longevity tracking</li>
            <li className="flex items-center gap-2"><span className="text-indigo-600 font-bold">✓</span> Macro format & hook pattern shifts</li>
            <li className="flex items-center gap-2"><span className="text-indigo-600 font-bold">✓</span> Market gaps & unserved angles</li>
          </ul>
        </div>

        {/* Pillar 3: THE SYNTHESIS */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="text-purple-600 text-[10px] font-bold uppercase tracking-wider">
            Unified Ecosystem Value
          </div>
          <h2 className="text-base font-bold text-slate-900">Alco Intelligence</h2>
          <div className="text-xs font-semibold text-purple-700 bg-purple-50 p-2.5 rounded border border-purple-100">
            «What should I do next?»
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            Combines internal performance constraints with external market movements to formulate high-conviction creative hypotheses and pricing defense.
          </p>
        </div>
      </div>

      {/* JSON Contract Drawer */}
      {showJsonSchema && (
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto max-h-80 shadow-md">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-sans font-bold">
            Standard JSON Exchange Contract:
          </div>
          <pre>{JSON.stringify(sampleContract, null, 2)}</pre>
        </div>
      )}

      {/* Cross-Product Synthesized Opportunities */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Cross-Product Diagnostic Synthesis ({workspaceName})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Contextualizes internal performance fatigue against macro competitor shifts
          </p>
        </div>

        <div className="space-y-4">
          {sampleContract.synthesizedOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                <h4 className="text-sm font-bold text-slate-900">{opp.opportunityTitle}</h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto ${
                  opp.confidence === 'HIGH' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {opp.confidence} CONFIDENCE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* First Party Context */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="text-rose-700 font-bold text-[10px] uppercase tracking-wider">
                    First-Party Account Diagnosis (Alco Ads)
                  </div>
                  <p className="text-slate-700 leading-relaxed">{opp.firstPartyAdDiagnosis}</p>
                </div>

                {/* Radar Market Evidence */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="text-blue-700 font-bold text-[10px] uppercase tracking-wider">
                    Market Radar Evidence (Competitor Benchmarking)
                  </div>
                  <p className="text-slate-700 leading-relaxed">{opp.radarEvidence}</p>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs">
                <div className="font-bold text-blue-900 text-[11px] mb-0.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Recommended Ecosystem Action
                </div>
                <p className="text-slate-700 leading-relaxed">{opp.recommendedAction}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
