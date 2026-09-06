import React, { useState } from 'react';
import {
  MarketWorkspace,
  Competitor,
  AdObservation,
  CreativeFamily,
  MarketSignal,
  MarketTrendMetric,
  AISignalSynthesisResponse,
  MarketOpportunityScore,
} from '../../types/radar';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Database,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Target,
  Zap,
  Shield,
  Search,
  Check,
  Award,
  Info,
} from 'lucide-react';
import { INITIAL_MARKET_OPPORTUNITIES } from '../../data/mockData';

interface DashboardViewProps {
  workspace: MarketWorkspace;
  competitors: Competitor[];
  ads: AdObservation[];
  signals: MarketSignal[];
  creativeFamilies: CreativeFamily[];
  trends: MarketTrendMetric[];
  onSelectSignal: (signal: MarketSignal) => void;
  onSelectAd: (ad: AdObservation) => void;
  onSelectCompetitor: (competitor: Competitor) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  workspace,
  competitors,
  ads,
  signals,
  creativeFamilies,
  trends,
  onSelectSignal,
  onSelectAd,
  onSelectCompetitor,
  onNavigateToTab,
}) => {
  const [aiSynthesis, setAiSynthesis] = useState<AISignalSynthesisResponse | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const handleRunAiSynthesis = async () => {
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/gemini/synthesize-signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceName: workspace.name,
          marketCategory: workspace.category,
          signals,
          competitorNames: competitors.map((c) => c.name),
        }),
      });
      const data = await res.json();
      if (data.data) {
        setAiSynthesis(data.data);
      }
    } catch (e) {
      console.error('Failed to run AI synthesis:', e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const filteredSignals = signals.filter((s) => {
    if (filterSeverity === 'all') return true;
    return s.severity === filterSeverity;
  });

  // Longest running ads (Longevity highlights)
  const longRunningAds = [...ads].sort((a, b) => b.observedDays - a.observedDays).slice(0, 3);

  // Newest observed ads
  const newestAds = [...ads].sort((a, b) => a.observedDays - b.observedDays).slice(0, 3);

  // Maximum ads observed for progress calculation in Activity Radar
  const maxObserved = Math.max(...competitors.map((c) => c.observedActiveAds), 1);

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* 1. Core Mission Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Active Radar Feed
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {workspace.category}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {workspace.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {workspace.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAiSynthesis}
              disabled={isSynthesizing}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{isSynthesizing ? 'Synthesizing with Gemini...' : 'AI Strategic Synthesis'}</span>
            </button>
          </div>
        </div>

        {/* 4 Core Questions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
            <div className="text-[10px] uppercase font-bold text-blue-600 mb-1 flex items-center gap-1.5 tracking-wider">
              <Activity className="w-3.5 h-3.5" /> 1. What Changed?
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {signals[0]?.title || 'Recent creative pattern shifts detected'}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
            <div className="text-[10px] uppercase font-bold text-indigo-600 mb-1 flex items-center gap-1.5 tracking-wider">
              <Target className="w-3.5 h-3.5" /> 2. What Matters?
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {signals.length} market signals active across {competitors.length} monitored competitors.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
            <div className="text-[10px] uppercase font-bold text-amber-600 mb-1 flex items-center gap-1.5 tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> 3. Why It Matters?
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Pre-holiday routine bundles and clinical authority are dominating customer attention.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
            <div className="text-[10px] uppercase font-bold text-emerald-600 mb-1 flex items-center gap-1.5 tracking-wider">
              <Zap className="w-3.5 h-3.5" /> 4. What To Investigate?
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Uncontested commuter barrier hook gap & creative family longevity.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monitored Brands</div>
          <div className="text-2xl font-bold text-slate-900 font-sans">{competitors.length}</div>
          <div className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1">
            <span>+{competitors.filter((c) => c.status === 'surging').length} Surging this week</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Creatives</div>
          <div className="text-2xl font-bold text-slate-900 font-sans">{ads.length}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Observed across Meta platform</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Market Signals</div>
          <div className="text-2xl font-bold text-slate-900 font-sans">{signals.length}</div>
          <div className="text-[10px] text-blue-600 font-bold mt-1">
            {signals.filter((s) => s.confidence === 'HIGH').length} High Confidence
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">New Ad Velocity</div>
          <div className="text-2xl font-bold text-slate-900 font-sans">
            18.4 <span className="text-sm font-normal text-slate-400">/day</span>
          </div>
          <div className="text-[10px] text-red-500 font-bold mt-1">↑ 12% vs last period</div>
        </div>
      </div>

      {/* 3. AI Strategic Synthesis (Server-Side Gemini Output Contract) */}
      {aiSynthesis && (
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">AI Market Intelligence Synthesis (Gemini)</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                aiSynthesis.confidence === 'HIGH' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {aiSynthesis.confidence} CONFIDENCE
              </span>
            </div>
            <button
              onClick={() => setAiSynthesis(null)}
              className="text-xs text-slate-400 hover:text-slate-700 font-medium"
            >
              Dismiss
            </button>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            {aiSynthesis.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Observed Facts */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="text-blue-600 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                <Database className="w-3.5 h-3.5" /> Observed Facts
              </div>
              <ul className="space-y-1.5 text-slate-600">
                {aiSynthesis.observed.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Inferences */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="text-indigo-600 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5" /> Logical Inferences
              </div>
              <ul className="space-y-1.5 text-slate-600">
                {aiSynthesis.inferred.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hypotheses */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="text-purple-600 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                <HelpCircle className="w-3.5 h-3.5" /> Strategic Hypotheses
              </div>
              <ul className="space-y-1.5 text-slate-600">
                {aiSynthesis.hypotheses.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-purple-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Opportunities vs Market Threats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-emerald-800 font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-600" /> Actionable Opportunities
              </div>
              <ul className="space-y-1 text-slate-700">
                {aiSynthesis.opportunities.map((opp, i) => (
                  <li key={i}>→ {opp}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="text-rose-800 font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Competitive Threats & Saturation
              </div>
              <ul className="space-y-1 text-slate-700">
                {aiSynthesis.threats.map((thr, i) => (
                  <li key={i}>⚠ {thr}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Epistemic Confidence Assessment Breakdown (V1.1 Standard) */}
          {aiSynthesis.confidenceAssessment && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="text-slate-700 font-bold uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Separated Epistemic Confidence Assessment</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Evidence</span>
                  <span className="text-xs font-bold text-emerald-700">
                    {aiSynthesis.confidenceAssessment.evidenceConfidence} CONFIDENCE
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Interpretation</span>
                  <span className="text-xs font-bold text-blue-700">
                    {aiSynthesis.confidenceAssessment.interpretationConfidence} CONFIDENCE
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Hypothesis</span>
                  <span className="text-xs font-bold text-purple-700">
                    {aiSynthesis.confidenceAssessment.hypothesisConfidence} CONFIDENCE
                  </span>
                </div>
              </div>
              <p className="text-slate-600 text-[11px] pt-1 leading-relaxed">
                <strong>Rationale:</strong> {aiSynthesis.confidenceAssessment.rationale}
              </p>
            </div>
          )}

          {/* Next Recommended Human Actions */}
          {aiSynthesis.nextActions && aiSynthesis.nextActions.length > 0 && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2 text-xs">
              <div className="text-blue-900 font-bold uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Recommended Verification Steps (Human Next Actions)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                {aiSynthesis.nextActions.map((action, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded border border-blue-100 flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3b. Deterministic Market Opportunity Scorecard (Phase 8 & 12) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Category Opportunity Scorecards
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quantified, deterministic gap analysis based on competitor saturation and unserved angles
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            DETERMINISTIC EVALUATION
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INITIAL_MARKET_OPPORTUNITIES.map((opp) => (
            <div
              key={opp.id}
              className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-3 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      SCORE {opp.score}/100
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {opp.evidenceStrength}% EVIDENCE STRENGTH
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{opp.title}</h3>
                </div>

                <div className="text-right shrink-0 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Adoption Gap</div>
                  <div className="text-base font-bold text-blue-600 font-mono">{opp.adoptionGap}%</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{opp.description}</p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                <div className="bg-white p-1.5 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase block font-medium">Novelty</span>
                  <span className="font-bold text-slate-800">{opp.novelty}%</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase block font-medium">Saturation</span>
                  <span className="font-bold text-slate-800">{opp.saturation}%</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase block font-medium">Confidence</span>
                  <span className="font-bold text-emerald-700">{opp.confidence?.evidence || 'HIGH'}</span>
                </div>
              </div>

              {opp.recommendedExploration && (
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/80">
                  <strong className="text-slate-800">Recommended Test: </strong>
                  {opp.recommendedExploration}
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-[280px]">
                  Uncontested angle: <strong className="text-slate-700">{opp.uncontestedAngle || 'N/A'}</strong>
                </span>
                <span className="font-mono text-[10px] text-blue-600 font-semibold cursor-pointer" onClick={() => onNavigateToTab('signals')}>
                  Explore Signals →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Sleek Dual-Column: RADAR Critical Market Signals & Competitor Activity Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Critical Market Signals */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col flex-grow">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="text-blue-600 font-black">RADAR</span> Critical Market Signals
              </h2>

              <div className="flex items-center gap-1.5 text-xs">
                {['all', 'critical', 'high', 'medium'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-2.5 py-1 rounded capitalize transition text-[11px] font-medium ${
                      filterSeverity === sev
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 space-y-3 flex-grow">
              {filteredSignals.slice(0, 4).map((signal) => {
                const accentColor =
                  signal.severity === 'critical'
                    ? 'bg-rose-500'
                    : signal.severity === 'high'
                    ? 'bg-amber-400'
                    : 'bg-blue-500';

                return (
                  <div
                    key={signal.id}
                    className="border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-300 rounded-lg p-4 flex gap-4 transition"
                  >
                    <div className={`w-1 ${accentColor} rounded-full shrink-0`} />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded uppercase">
                            {signal.type.replace(/_/g, ' ')}
                          </span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded uppercase">
                            {signal.confidence} Confidence
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(signal.detectedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-800">{signal.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 mb-3 leading-relaxed">
                        {signal.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white p-2.5 border border-slate-200 rounded text-[11px]">
                          <span className="block text-slate-400 font-bold uppercase mb-1 text-[9px] tracking-wider">
                            Observed
                          </span>
                          <span className="text-slate-700">{signal.triad.observed}</span>
                        </div>
                        <div className="bg-white p-2.5 border border-slate-200 rounded text-[11px]">
                          <span className="block text-blue-600 font-bold uppercase mb-1 text-[9px] tracking-wider">
                            Inferred
                          </span>
                          <span className="text-slate-700">{signal.triad.inferred}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400">
                          {signal.evidence.length} evidence points • {signal.relatedAds.length} linked ads
                        </span>
                        <button
                          onClick={() => onSelectSignal(signal)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1"
                        >
                          View Evidence →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Sleek Dark Competitor Activity Radar Card */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg flex flex-col flex-grow justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Competitor Activity Radar
                </h2>
                <span className="text-[10px] text-emerald-400 font-medium">Real-Time</span>
              </div>

              <div className="space-y-4">
                {competitors.slice(0, 5).map((comp, idx) => {
                  const pct = Math.min(100, Math.round((comp.observedActiveAds / maxObserved) * 100));
                  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-blue-500', 'bg-violet-500'];
                  const barColor = colors[idx % colors.length];

                  return (
                    <div key={comp.id} className="space-y-1.5 cursor-pointer" onClick={() => onSelectCompetitor(comp)}>
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-slate-200 hover:text-white transition">
                          {comp.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {comp.observedActiveAds} Ads Observed
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="p-3 bg-slate-800 rounded-lg">
                <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">ALCO Hypothesis</div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {signals[0]?.hypothesis
                    ? signals[0].hypothesis
                    : "Competitor 'Somethinc' may be testing a new 'Result-Led' campaign strategy based on the recent surge in creative longevity of their 12.12 teaser ads."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Two Column Bottom: Top Market Movers vs High Longevity Creatives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Category Trend Movers */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Category Trend Movers
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Frequency shifts measured across active observed creative inventory
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('trends')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All Trends →
            </button>
          </div>

          <div className="space-y-2.5">
            {trends.slice(0, 4).map((trend, i) => (
              <div
                key={i}
                className="bg-slate-50 border border-slate-200/80 p-3 rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800">{trend.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Used by {trend.competitorBreadthCount} competitors ({trend.dimension.toUpperCase()})
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-mono font-bold text-sm ${
                    trend.deltaPercentagePoints > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {trend.deltaPercentagePoints > 0 ? `+${trend.deltaPercentagePoints} pp` : `${trend.deltaPercentagePoints} pp`}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {trend.previousPeriodPct}% → {trend.currentPeriodPct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: High Longevity Creatives (Strategic Hypothesis) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Observed Creative Longevity
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Long-running public ads (Hypothesis: battle-tested concept)
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('creatives')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All Creatives →
            </button>
          </div>

          <div className="space-y-2.5">
            {longRunningAds.map((ad) => (
              <div
                key={ad.id}
                onClick={() => onSelectAd(ad)}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 hover:border-slate-300 p-3 rounded-lg flex items-center gap-3 cursor-pointer transition group"
              >
                <img
                  src={ad.thumbnailUrl}
                  alt={ad.headline}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 object-cover rounded-md bg-white border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-semibold text-slate-800">{ad.advertiserName}</span>
                    <span className="font-mono text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                      {ad.observedDays} Days Observed
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition">
                    {ad.headline}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    {ad.primaryText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
