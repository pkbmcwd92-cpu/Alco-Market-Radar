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
import {
  SIGNAL_LABELS,
  CONFIDENCE_LABELS,
  SEVERITY_LABELS,
  formatDateIndonesian,
  formatDeltaPercentagePoints,
} from '../../utils/labels';

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
                Feed Radar Aktif
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
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{isSynthesizing ? 'Menganalisis dengan Gemini...' : 'Sintesis Kecerdasan Pasar (AI)'}</span>
            </button>
          </div>
        </div>

        {/* 4 Core Questions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
            <div className="text-[10px] uppercase font-bold text-blue-600 mb-1 flex items-center gap-1.5 tracking-wider">
              <Activity className="w-3.5 h-3.5" /> 1. Apa yang Berubah?
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {signals[0]?.title || 'Terdeteksi pergeseran pola creative dan format terbaru'}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
            <div className="text-[10px] uppercase font-bold text-indigo-600 mb-1 flex items-center gap-1.5 tracking-wider">
              <Target className="w-3.5 h-3.5" /> 2. Apa yang Terdeteksi?
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {signals.length} sinyal pasar aktif di antara {competitors.length} competitor yang dipantau.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
            <div className="text-[10px] uppercase font-bold text-amber-600 mb-1 flex items-center gap-1.5 tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" /> 3. Mengapa Ini Penting?
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Pergeseran proporsi format video dan pesan garansi mendominasi observasi periode terkini.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
            <div className="text-[10px] uppercase font-bold text-emerald-600 mb-1 flex items-center gap-1.5 tracking-wider">
              <Zap className="w-3.5 h-3.5" /> 4. Apa yang Perlu Diuji?
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Peluang pengujian angle minim persaingan & pengamatan retensi creative competitor.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Competitor Dipantau</div>
          <div className="text-2xl font-bold text-slate-900 font-sans">{competitors.length}</div>
          <div className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1">
            <span>+{competitors.filter((c) => c.status === 'surging').length} melonjak pekan ini</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Creative Aktif</div>
          <div className="text-2xl font-bold text-slate-900 font-sans">{ads.length}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Teramati di pustaka iklan publik</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sinyal Pasar</div>
          <div className="text-2xl font-bold text-slate-900 font-sans">{signals.length}</div>
          <div className="text-[10px] text-blue-600 font-bold mt-1">
            {signals.filter((s) => s.confidence === 'HIGH').length} Keyakinan Tinggi
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Laju Creative Baru</div>
          <div className="text-2xl font-bold text-slate-900 font-sans">
            18.4 <span className="text-sm font-normal text-slate-400">/hari</span>
          </div>
          <div className="text-[10px] text-blue-600 font-bold mt-1">Rata-rata 7 hari terakhir</div>
        </div>
      </div>

      {/* 3. AI Strategic Synthesis (Server-Side Gemini Output Contract) */}
      {aiSynthesis && (
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Sintesis Kecerdasan Pasar AI (Gemini)</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                aiSynthesis.confidence === 'HIGH' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                KEYAKINAN: {CONFIDENCE_LABELS[aiSynthesis.confidence as keyof typeof CONFIDENCE_LABELS] || aiSynthesis.confidence}
              </span>
            </div>
            <button
              onClick={() => setAiSynthesis(null)}
              className="text-xs text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
            >
              Tutup
            </button>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            {aiSynthesis.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Fakta Teramati */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="text-blue-600 font-bold flex items-center gap-1.5 uppercase tracking-wide">
                <Database className="w-3.5 h-3.5" /> Fakta Teramati
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
                <CheckCircle2 className="w-3.5 h-3.5" /> Interpretasi Logis
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
                <HelpCircle className="w-3.5 h-3.5" /> Hipotesis Strategis
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
                <Zap className="w-3.5 h-3.5 text-emerald-600" /> Potensi Peluang yang Dapat Diuji
              </div>
              <ul className="space-y-1 text-slate-700">
                {aiSynthesis.opportunities.map((opp, i) => (
                  <li key={i}>→ {opp}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="text-rose-800 font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Potensi Ancaman & Kejenuhan
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
                <span>Penilaian Tingkat Keyakinan Terpisah</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Keyakinan Bukti</span>
                  <span className="text-xs font-bold text-emerald-700">
                    {CONFIDENCE_LABELS[aiSynthesis.confidenceAssessment.evidenceConfidence as keyof typeof CONFIDENCE_LABELS] || aiSynthesis.confidenceAssessment.evidenceConfidence}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Keyakinan Interpretasi</span>
                  <span className="text-xs font-bold text-blue-700">
                    {CONFIDENCE_LABELS[aiSynthesis.confidenceAssessment.interpretationConfidence as keyof typeof CONFIDENCE_LABELS] || aiSynthesis.confidenceAssessment.interpretationConfidence}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Keyakinan Hipotesis</span>
                  <span className="text-xs font-bold text-purple-700">
                    {CONFIDENCE_LABELS[aiSynthesis.confidenceAssessment.hypothesisConfidence as keyof typeof CONFIDENCE_LABELS] || aiSynthesis.confidenceAssessment.hypothesisConfidence}
                  </span>
                </div>
              </div>
              <p className="text-slate-600 text-[11px] pt-1 leading-relaxed">
                <strong>Alasan Keyakinan:</strong> {aiSynthesis.confidenceAssessment.rationale}
              </p>
            </div>
          )}

          {/* Next Recommended Human Actions */}
          {aiSynthesis.nextActions && aiSynthesis.nextActions.length > 0 && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2 text-xs">
              <div className="text-blue-900 font-bold uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Langkah Pemantauan & Verifikasi Berikutnya</span>
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

      {/* 3b. Deterministic Market Opportunity Scorecard */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Kartu Skor Peluang Kategori
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisis celah pasar berbasis saturasi competitor dan angle yang relatif minim tergarap
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            EVALUASI DETERMINISTIK
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
                      SKOR {opp.score}/100
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {opp.evidenceStrength}% KEKUATAN BUKTI
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{opp.title}</h3>
                </div>

                <div className="text-right shrink-0 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Celah Adopsi</div>
                  <div className="text-base font-bold text-blue-600 font-mono">{opp.adoptionGap}%</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{opp.description}</p>

              <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                <div className="bg-white p-1.5 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase block font-medium">Kebaruan</span>
                  <span className="font-bold text-slate-800">{opp.novelty}%</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase block font-medium">Saturasi</span>
                  <span className="font-bold text-slate-800">{opp.saturation}%</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase block font-medium">Keyakinan</span>
                  <span className="font-bold text-emerald-700">{CONFIDENCE_LABELS[opp.confidence?.evidence as keyof typeof CONFIDENCE_LABELS] || 'TINGGI'}</span>
                </div>
              </div>

              {opp.recommendedExploration && (
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/80">
                  <strong className="text-slate-800">Rekomendasi Pengujian: </strong>
                  {opp.recommendedExploration}
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-[280px]">
                  Angle minim persaingan: <strong className="text-slate-700">{opp.uncontestedAngle || 'N/A'}</strong>
                </span>
                <span className="font-mono text-[10px] text-blue-600 font-semibold cursor-pointer" onClick={() => onNavigateToTab('signals')}>
                  Eksplorasi Sinyal →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Dual-Column: Sinyal Pasar Penting & Radar Aktivitas Competitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Critical Market Signals */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col flex-grow">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span className="text-blue-600 font-black">RADAR</span> Sinyal Pasar Penting
              </h2>

              <div className="flex items-center gap-1.5 text-xs">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'critical', label: 'Kritis' },
                  { id: 'high', label: 'Tinggi' },
                  { id: 'medium', label: 'Sedang' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilterSeverity(item.id)}
                    className={`px-2.5 py-1 rounded transition text-[11px] font-medium cursor-pointer ${
                      filterSeverity === item.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded uppercase">
                            {SIGNAL_LABELS[signal.type] || signal.type.replace(/_/g, ' ')}
                          </span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded uppercase">
                            KEYAKINAN: {CONFIDENCE_LABELS[signal.confidence] || signal.confidence}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDateIndonesian(signal.detectedAt)}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-800">{signal.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 mb-3 leading-relaxed">
                        {signal.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white p-2.5 border border-slate-200 rounded text-[11px]">
                          <span className="block text-slate-400 font-bold uppercase mb-1 text-[9px] tracking-wider">
                            Fakta Teramati
                          </span>
                          <span className="text-slate-700">{signal.triad.observed}</span>
                        </div>
                        <div className="bg-white p-2.5 border border-slate-200 rounded text-[11px]">
                          <span className="block text-blue-600 font-bold uppercase mb-1 text-[9px] tracking-wider">
                            Interpretasi Logis
                          </span>
                          <span className="text-slate-700">{signal.triad.inferred}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400">
                          {signal.evidence.length} titik bukti • {signal.relatedAds.length} iklan terkait
                        </span>
                        <button
                          onClick={() => onSelectSignal(signal)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          Periksa Rantai Bukti →
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
                  Radar Aktivitas Competitor
                </h2>
                <span className="text-[10px] text-emerald-400 font-medium">Data Terkini</span>
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
                          {comp.observedActiveAds} Creative Diamati
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
                <div className="text-[10px] text-blue-400 font-bold uppercase mb-1">Hipotesis Pengamatan ALCO</div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {signals[0]?.hypothesis
                    ? signals[0].hypothesis
                    : "Peningkatan volume materi iklan baru mungkin konsisten dengan pengujian variasi berkala, namun performa conversion atau strategi internal advertiser tidak dapat dipastikan tanpa data privat."}
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
                Pergerakan Tren Kategori
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pergeseran frekuensi terukur dari inventori creative aktif
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('trends')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Lihat Semua Tren →
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
                    Digunakan oleh {trend.competitorBreadthCount} competitor ({trend.dimension.toUpperCase()})
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-mono font-bold text-sm ${
                    trend.deltaPercentagePoints > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {formatDeltaPercentagePoints(trend.deltaPercentagePoints)}
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
                Durasi Tayang Creative Teramati
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Creative dengan durasi tayang publik terpanjang (Catatan: durasi tidak membuktikan profitabilitas)
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('creatives')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Lihat Semua Creative →
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
                      {ad.observedDays} Hari Teramati
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
