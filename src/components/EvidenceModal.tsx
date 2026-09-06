import React, { useState } from 'react';
import { EvidenceItem, MarketSignal, AdObservation } from '../types/radar';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Calendar,
  Database,
  Layers,
  HelpCircle,
  Sparkles,
  Check,
  Activity,
  Zap,
  Info,
} from 'lucide-react';

interface EvidenceModalProps {
  signal: MarketSignal | null;
  allAds: AdObservation[];
  onClose: () => void;
  onSelectAd?: (ad: AdObservation) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  signal,
  allAds,
  onClose,
  onSelectAd,
}) => {
  const [activeTab, setActiveTab] = useState<'chain' | 'evidence' | 'ads' | 'actions'>('chain');

  if (!signal) return null;

  const supportingAds = allAds.filter((ad) =>
    signal.relatedAds.includes(ad.id) ||
    (signal.evidence && signal.evidence.some((e) => e.supportingIds?.includes(ad.id)))
  );

  const chain = signal.evidenceChain;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full p-6 shadow-xl text-slate-900 relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                signal.severity === 'critical' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                signal.severity === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {signal.severity} SEVERITY
              </span>

              <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                {signal.type.replace(/_/g, ' ')}
              </span>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                signal.confidence === 'HIGH' ? 'bg-emerald-100 text-emerald-800' :
                signal.confidence === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                {signal.confidence} CONFIDENCE
              </span>

              <span className="text-[11px] text-slate-400 font-mono">
                Detected: {new Date(signal.detectedAt).toLocaleDateString()}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">{signal.title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{signal.description}</p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 py-2.5 text-xs">
          <button
            onClick={() => setActiveTab('chain')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'chain' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>6-Step Evidence Chain</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'evidence' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Observed Evidence Points ({signal.evidence.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ads' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Linked Creatives ({supportingAds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'actions' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Next Recommended Actions</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-6 pr-1">
          {/* TAB 1: 6-STEP EVIDENCE CHAIN */}
          {activeTab === 'chain' && (
            <div className="space-y-6">
              {/* ALCO Intelligence Triad Distinct Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                    <span>ALCO Intelligence Triad Distinction</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Enforced Epistemic Boundary</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white border border-blue-200 rounded-lg p-3.5 shadow-2xs space-y-1">
                    <div className="text-blue-700 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <Database className="w-3.5 h-3.5 text-blue-600" /> 1. OBSERVED FACT
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{signal.triad.observed}</p>
                    <div className="text-[10px] text-slate-400 italic pt-1">Verifiable public ad events only</div>
                  </div>

                  <div className="bg-white border border-indigo-200 rounded-lg p-3.5 shadow-2xs space-y-1">
                    <div className="text-indigo-700 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> 2. LOGICAL INFERENCE
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{signal.triad.inferred}</p>
                    <div className="text-[10px] text-slate-400 italic pt-1">Deterministic mathematical pattern</div>
                  </div>

                  <div className="bg-white border border-purple-200 rounded-lg p-3.5 shadow-2xs space-y-1">
                    <div className="text-purple-700 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-600" /> 3. STRATEGIC HYPOTHESIS
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{signal.triad.hypothesis}</p>
                    <div className="text-[10px] text-slate-400 italic pt-1">Unproven; requires team verification</div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Chain Flow */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Full End-to-End Traceable Chain
                </h3>

                <div className="space-y-3 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                  {/* Step 1: Observation */}
                  <div className="relative pl-10">
                    <div className="absolute left-2.5 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                      1
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1">
                      <div className="font-bold text-slate-900 text-xs">Step 1: Observation (Public Ad Sighting)</div>
                      <p className="text-slate-600">
                        {chain?.observation || signal.triad.observed}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Evidence */}
                  <div className="relative pl-10">
                    <div className="absolute left-2.5 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                      2
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1">
                      <div className="font-bold text-slate-900 text-xs">Step 2: Measured Evidence</div>
                      <p className="text-slate-600">
                        {chain?.evidence || `Quantified metrics across ${signal.evidence.length} evidence points (${signal.relatedAds.length} linked ads).`}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Pattern */}
                  <div className="relative pl-10">
                    <div className="absolute left-2.5 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                      3
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1">
                      <div className="font-bold text-slate-900 text-xs">Step 3: Pattern Signature</div>
                      <p className="text-slate-600">
                        {chain?.pattern || `Deterministic pattern match: ${signal.type} triggered by threshold rules.`}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Signal */}
                  <div className="relative pl-10">
                    <div className="absolute left-2.5 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                      4
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1">
                      <div className="font-bold text-slate-900 text-xs">Step 4: Emitted Market Signal</div>
                      <p className="text-slate-600">
                        {chain?.signal || `${signal.title} (Severity: ${signal.severity.toUpperCase()}, Status: ${signal.status.toUpperCase()})`}
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Interpretation */}
                  <div className="relative pl-10">
                    <div className="absolute left-2.5 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold">
                      5
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1">
                      <div className="font-bold text-slate-900 text-xs">Step 5: Logical Interpretation</div>
                      <p className="text-slate-600">
                        {chain?.interpretation || signal.triad.inferred}
                      </p>
                    </div>
                  </div>

                  {/* Step 6: Hypothesis */}
                  <div className="relative pl-10">
                    <div className="absolute left-2.5 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold">
                      6
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1">
                      <div className="font-bold text-slate-900 text-xs">Step 6: Strategic Hypothesis & Test Action</div>
                      <p className="text-slate-600">
                        {chain?.hypothesis || signal.triad.hypothesis}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence Breakdown Card */}
              {signal.confidenceAssessment && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    Separated Epistemic Confidence Assessment
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Evidence Confidence</div>
                      <div className="text-base font-bold text-emerald-700 mt-0.5">
                        {signal.confidenceAssessment.evidenceConfidence}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Grounding: Public verified ads</div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Interpretation Confidence</div>
                      <div className="text-base font-bold text-blue-700 mt-0.5">
                        {signal.confidenceAssessment.interpretationConfidence}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Grounding: Mathematical frequency</div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Hypothesis Confidence</div>
                      <div className="text-base font-bold text-purple-700 mt-0.5">
                        {signal.confidenceAssessment.hypothesisConfidence}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Grounding: Speculative intent (untested)</div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                    <strong className="text-slate-800 font-bold">Confidence Rationale: </strong>
                    {signal.confidenceAssessment.rationale}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DETAILED EVIDENCE POINTS */}
          {activeTab === 'evidence' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Verified Quantitative Evidence Points ({signal.evidence.length})
              </h3>

              <div className="space-y-2.5">
                {signal.evidence.map((ev, idx) => (
                  <div
                    key={ev.evidenceId || idx}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-2xs">
                          {ev.type}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(ev.observedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800">{ev.description}</p>
                    </div>

                    <div className="text-right shrink-0 bg-white px-3 py-1.5 rounded border border-slate-200 shadow-2xs">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Observed Value</div>
                      <div className="text-sm font-bold text-blue-600 font-mono">{ev.value}</div>
                      {ev.previousValue && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 justify-end">
                          <span>{ev.previousValue}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span className="text-slate-800 font-semibold">{ev.currentValue}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LINKED ADS */}
          {activeTab === 'ads' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Linked Observed Advertisements ({supportingAds.length})
              </h3>

              {supportingAds.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  No direct ad instances linked. This signal was aggregated at the macro category trend level.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {supportingAds.map((ad) => (
                    <div
                      key={ad.id}
                      onClick={() => onSelectAd?.(ad)}
                      className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-lg p-3 transition flex gap-3 group shadow-2xs"
                    >
                      <img
                        src={ad.thumbnailUrl}
                        alt={ad.headline}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-cover rounded bg-slate-100 shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                          <span className="font-semibold text-slate-800 truncate">{ad.advertiserName}</span>
                          <span className="font-mono text-blue-600 shrink-0 font-medium">{ad.observedDays}d active</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition">
                          {ad.headline}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {ad.primaryText}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RECOMMENDED ACTIONS */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                <div className="font-bold text-blue-900 mb-0.5">Why This Signal Matters Strategically</div>
                <p className="text-slate-700 leading-relaxed">{signal.whyItMatters}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Concrete Verification & Testing Actions
                </h4>

                <div className="space-y-2 text-xs text-slate-700">
                  {signal.nextActions && signal.nextActions.length > 0 ? (
                    signal.nextActions.map((act, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{act}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Audit internal landing pages and offer pages against the competitor shift.</span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Brief creative team on producing 2-3 challenger ad variants addressing this exact angle gap.</span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Inspect Meta Ads Library in 7 days to evaluate if the competitor expands or scales this creative cluster.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
          <div>
            Signal ID: <span className="font-mono text-slate-700">{signal.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
