import React from 'react';
import { EvidenceItem, MarketSignal, AdObservation } from '../types/radar';
import { X, ShieldAlert, CheckCircle2, ArrowRight, ExternalLink, Calendar, Database } from 'lucide-react';

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
  if (!signal) return null;

  const supportingAds = allAds.filter((ad) => 
    signal.relatedAds.includes(ad.id) || 
    (signal.evidence && signal.evidence.some(e => e.supportingIds?.includes(ad.id)))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full p-6 shadow-xl text-slate-900 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Evidence Audit Trail
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                signal.confidence === 'HIGH' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                signal.confidence === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {signal.confidence} CONFIDENCE
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{signal.title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{signal.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-6 pr-1">
          {/* Core Triad Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              ALCO Intelligence Triad Distinction
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white border border-blue-200 rounded-lg p-3 shadow-2xs">
                <div className="text-blue-700 font-bold mb-1 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> OBSERVED
                </div>
                <p className="text-slate-700 leading-relaxed">{signal.triad.observed}</p>
                <div className="mt-2 text-[10px] text-slate-400 italic">Verifiable public ad events</div>
              </div>

              <div className="bg-white border border-indigo-200 rounded-lg p-3 shadow-2xs">
                <div className="text-indigo-700 font-bold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> INFERRED
                </div>
                <p className="text-slate-700 leading-relaxed">{signal.triad.inferred}</p>
                <div className="mt-2 text-[10px] text-slate-400 italic">Logical pattern deduction</div>
              </div>

              <div className="bg-white border border-purple-200 rounded-lg p-3 shadow-2xs">
                <div className="text-purple-700 font-bold mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> HYPOTHESIS
                </div>
                <p className="text-slate-700 leading-relaxed">{signal.triad.hypothesis}</p>
                <div className="mt-2 text-[10px] text-slate-400 italic">Strategic interpretation (unproven)</div>
              </div>
            </div>
          </div>

          {/* Concrete Evidence Points */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span>Verified Evidence Records</span>
              <span className="text-xs font-normal text-slate-500">({signal.evidence.length} points)</span>
            </h3>

            <div className="space-y-2.5">
              {signal.evidence.map((ev, idx) => (
                <div
                  key={ev.evidenceId || idx}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
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

          {/* Supporting Observed Ads */}
          {supportingAds.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Supporting Observed Advertisements ({supportingAds.length})
              </h3>
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
            </div>
          )}

          {/* Strategic Action Notice */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
            <div className="font-bold text-blue-900 mb-0.5">Why This Signal Matters</div>
            <p className="text-slate-700">{signal.whyItMatters}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
          <div>Signal ID: <span className="font-mono text-slate-700">{signal.id}</span></div>
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
