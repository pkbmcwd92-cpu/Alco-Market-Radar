import React, { useState } from 'react';
import { AdObservation, CreativeFamily } from '../types/radar';
import { classifyCreativeDeterministically } from '../services/radarEngine';
import { X, ExternalLink, Sparkles, Clock, Tag, Target, Megaphone, ShieldCheck, AlertCircle, Layers } from 'lucide-react';

interface AdDetailModalProps {
  ad: AdObservation | null;
  creativeFamily?: CreativeFamily;
  onClose: () => void;
  onSelectFamily?: (family: CreativeFamily) => void;
}

export const AdDetailModal: React.FC<AdDetailModalProps> = ({
  ad,
  creativeFamily,
  onClose,
  onSelectFamily,
}) => {
  const [isDeconstructing, setIsDeconstructing] = useState(false);
  const [aiDeconstructResult, setAiDeconstructResult] = useState<any | null>(null);

  if (!ad) return null;

  const ci = classifyCreativeDeterministically(ad);

  const handleRunAiDeconstruct = async () => {
    setIsDeconstructing(true);
    try {
      const res = await fetch('/api/gemini/deconstruct-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: ad.headline,
          primaryText: ad.primaryText,
          cta: ad.CTA,
          format: ad.format,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setAiDeconstructResult(json.data);
      }
    } catch (e) {
      console.error('AI Deconstruct error:', e);
    } finally {
      setIsDeconstructing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full p-6 shadow-xl text-slate-900 relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-slate-100 text-blue-700 border border-slate-200">
                {ad.platform.toUpperCase()} OBSERVATION
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                ci.longevityTier === 'high_longevity' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                ci.longevityTier === 'established' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                ci.longevityTier === 'testing' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                {ci.longevityTier.replace('_', ' ').toUpperCase()} ({ad.observedDays} DAYS)
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{ad.headline || 'Ad Observation Detail'}</h2>
            <div className="text-sm text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Advertiser: <strong className="text-slate-800">{ad.advertiserName}</strong></span>
              <span>•</span>
              <span className="font-mono text-xs text-slate-400">ID: {ad.externalAdId}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto flex-1 py-4 space-y-6 pr-1">
          {/* Main 2-column layout: Creative Preview + Detected Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Media & Raw Copy */}
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-[4/3] flex items-center justify-center">
                <img
                  src={ad.mediaUrl || ad.thumbnailUrl}
                  alt={ad.headline}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs px-2 py-1 rounded text-xs font-mono text-white font-semibold shadow-xs">
                  {ad.format.toUpperCase()}
                </div>
              </div>

              {/* Raw Copy Container */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Primary Ad Copy
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {ad.primaryText}
                </p>
                {ad.description && (
                  <div className="text-xs text-slate-500 italic pt-1 border-t border-slate-200">
                    {ad.description}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-500">CTA Button:</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold uppercase border border-blue-200">
                    {ad.CTA}
                  </span>
                </div>
              </div>

              {/* Destination URL */}
              {ad.destinationUrl && (
                <a
                  href={ad.destinationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-blue-600 hover:text-blue-700 transition"
                >
                  <span className="truncate pr-2">{ad.destinationUrl}</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              )}
            </div>

            {/* Right: Detected Dimensions & Longevity Analysis */}
            <div className="space-y-4">
              {/* Classified Dimensions */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Detected Creative Dimensions
                  </h3>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    Deterministic Classifier
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-2xs">
                    <div className="text-slate-500 text-[10px] flex items-center gap-1 uppercase mb-0.5 font-medium">
                      <Target className="w-3 h-3 text-blue-600" /> Hook Type
                    </div>
                    <div className="text-slate-900 font-semibold capitalize">{ci.hookType}</div>
                  </div>

                  <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-2xs">
                    <div className="text-slate-500 text-[10px] flex items-center gap-1 uppercase mb-0.5 font-medium">
                      <Megaphone className="w-3 h-3 text-indigo-600" /> Messaging Angle
                    </div>
                    <div className="text-slate-900 font-semibold capitalize">{ci.messagingAngle}</div>
                  </div>

                  <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-2xs">
                    <div className="text-slate-500 text-[10px] flex items-center gap-1 uppercase mb-0.5 font-medium">
                      <Tag className="w-3 h-3 text-amber-600" /> Offer Type
                    </div>
                    <div className="text-slate-900 font-semibold capitalize">{ci.offerType}</div>
                  </div>

                  <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-2xs">
                    <div className="text-slate-500 text-[10px] flex items-center gap-1 uppercase mb-0.5 font-medium">
                      <Clock className="w-3 h-3 text-teal-600" /> Observed Longevity
                    </div>
                    <div className="text-slate-900 font-semibold">{ad.observedDays} Days Active</div>
                  </div>
                </div>

                {/* Creative Longevity Discipline Box */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Observed Longevity Interpretation
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {ci.strategicImportanceHypothesis}
                  </p>
                  <p className="text-[10px] text-slate-500 italic">
                    *ALCO Trust Principle: Public observation alone cannot confirm ROAS or profitability.
                  </p>
                </div>
              </div>

              {/* Creative Family Link if available */}
              {creativeFamily && (
                <div
                  onClick={() => onSelectFamily?.(creativeFamily)}
                  className="cursor-pointer bg-blue-50/40 hover:bg-blue-50 border border-blue-200 rounded-lg p-3.5 transition flex items-center justify-between group shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <div className="text-[10px] uppercase font-semibold text-blue-700 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Creative Family Cluster
                    </div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {creativeFamily.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {creativeFamily.memberAdIds.length} Variations • Avg Longevity: {creativeFamily.averageLongevityDays}d
                    </div>
                  </div>
                  <span className="text-xs text-blue-600 font-semibold group-hover:translate-x-1 transition">
                    View Family →
                  </span>
                </div>
              )}

              {/* AI Deconstruct Trigger */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      AI Creative Deconstruction (Gemini)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Semantic decomposition of copy, subtext, and psychology
                    </p>
                  </div>
                  <button
                    onClick={handleRunAiDeconstruct}
                    disabled={isDeconstructing}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-xs font-semibold text-white shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {isDeconstructing ? 'Analyzing...' : 'Run Deconstruct'}
                  </button>
                </div>

                {aiDeconstructResult && (
                  <div className="bg-white border border-blue-200 rounded-lg p-3 text-xs space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Detected Hook: <strong className="text-slate-900">{aiDeconstructResult.detectedHook}</strong></span>
                      <span className="text-slate-500">Confidence: <strong className="text-emerald-700">{aiDeconstructResult.hookConfidence}</strong></span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {aiDeconstructResult.observableSummary}
                    </p>
                    <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                      <strong className="text-slate-800">AI Reasoning:</strong> {aiDeconstructResult.reasoning}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>First Seen: <strong className="text-slate-800">{new Date(ad.firstSeen).toLocaleDateString()}</strong></span>
            <span>Last Seen: <strong className="text-slate-800">{new Date(ad.lastSeen).toLocaleDateString()}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
