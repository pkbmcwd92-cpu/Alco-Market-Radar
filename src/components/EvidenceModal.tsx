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
import {
  SIGNAL_LABELS,
  CONFIDENCE_LABELS,
  SEVERITY_LABELS,
  formatDateIndonesian,
} from '../utils/labels';

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

  const evidenceConf = signal.confidenceAssessment?.evidence || (signal.confidenceAssessment as any)?.evidenceConfidence || signal.confidence;
  const interpConf = signal.confidenceAssessment?.interpretation || (signal.confidenceAssessment as any)?.interpretationConfidence || 'MEDIUM';
  const hypConf = signal.confidenceAssessment?.hypothesis || (signal.confidenceAssessment as any)?.hypothesisConfidence || 'LOW';

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
                {SEVERITY_LABELS[signal.severity] || signal.severity}
              </span>

              <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {SIGNAL_LABELS[signal.type] || signal.type.replace(/_/g, ' ')}
              </span>

              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                signal.confidence === 'HIGH' ? 'bg-emerald-100 text-emerald-800' :
                signal.confidence === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                KEYAKINAN: {CONFIDENCE_LABELS[signal.confidence] || signal.confidence}
              </span>

              <span className="text-[11px] text-slate-400 font-mono">
                Terdeteksi: {formatDateIndonesian(signal.detectedAt)}
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
            <span>Rantai Bukti 6-Tahap</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'evidence' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Poin Bukti Teramati ({signal.evidence.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ads' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Creative Terkait ({supportingAds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'actions' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Langkah Tindakan Rekomendasi</span>
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
                    <span>Pemisahan Epistemik Triad Kecerdasan ALCO</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Batasan Epistemik Ditegakkan</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white border border-blue-200 rounded-lg p-3.5 shadow-2xs space-y-1">
                    <div className="text-blue-700 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <Database className="w-3.5 h-3.5 text-blue-600" /> 1. FAKTA TERAMATI (OBSERVED)
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{signal.triad.observed}</p>
                    <div className="text-[10px] text-slate-400 italic pt-1">Hanya peristiwa iklan publik terverifikasi</div>
                  </div>

                  <div className="bg-white border border-indigo-200 rounded-lg p-3.5 shadow-2xs space-y-1">
                    <div className="text-indigo-700 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> 2. INFERENSI LOGIS (INFERRED)
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{signal.triad.inferred}</p>
                    <div className="text-[10px] text-slate-400 italic pt-1">Pola matematis terhitung deterministik</div>
                  </div>

                  <div className="bg-white border border-purple-200 rounded-lg p-3.5 shadow-2xs space-y-1">
                    <div className="text-purple-700 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-600" /> 3. HIPOTESIS STRATEGIS (HYPOTHESIS)
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{signal.triad.hypothesis}</p>
                    <div className="text-[10px] text-slate-400 italic pt-1">Belum terbukti; butuh verifikasi tim</div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Chain Flow */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Rantai Bukti Lengkap (End-to-End Traceable Chain)
                </h3>

                <div className="space-y-3 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                  {/* Step 1: Observation */}
                  <div className="relative pl-10">
                    <div className="absolute left-2.5 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                      1
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1">
                      <div className="font-bold text-slate-900 text-xs">Tahap 1: Observasi (Kemunculan Iklan Publik)</div>
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
                      <div className="font-bold text-slate-900 text-xs">Tahap 2: Bukti Terukur Kuantitatif</div>
                      <p className="text-slate-600">
                        {chain?.evidenceSummary || `Metrik terhitung dari ${signal.evidence.length} poin bukti (${signal.relatedAds.length} iklan terkait).`}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Pattern */}
                  <div className="relative pl-10">
                    <div className="absolute left-2.5 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                      3
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1">
                      <div className="font-bold text-slate-900 text-xs">Tahap 3: Pola Terdeteksi</div>
                      <p className="text-slate-600">
                        {chain?.pattern || `Pola deterministik terpicu oleh aturan ambang batas (${SIGNAL_LABELS[signal.type] || signal.type}).`}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Signal */}
                  <div className="relative pl-10">
                    <div className="absolute left-2.5 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                      4
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1">
                      <div className="font-bold text-slate-900 text-xs">Tahap 4: Sinyal Pasar yang Dikeluarkan</div>
                      <p className="text-slate-600">
                        {chain?.signal || `${signal.title} (Tingkat: ${SEVERITY_LABELS[signal.severity] || signal.severity}, Status: ${signal.status})`}
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Interpretation */}
                  <div className="relative pl-10">
                    <div className="absolute left-2.5 top-2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold">
                      5
                    </div>
                    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs text-xs space-y-1">
                      <div className="font-bold text-slate-900 text-xs">Tahap 5: Interpretasi Logis</div>
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
                      <div className="font-bold text-slate-900 text-xs">Tahap 6: Hipotesis Strategis & Rencana Pengujian</div>
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
                    Penilaian Tingkat Keyakinan Epistemik Terpisah
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Keyakinan Bukti (Teramati)</div>
                      <div className="text-base font-bold text-emerald-700 mt-0.5">
                        {CONFIDENCE_LABELS[evidenceConf as keyof typeof CONFIDENCE_LABELS] || evidenceConf}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Dasar: Iklan publik terverifikasi</div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Keyakinan Interpretasi</div>
                      <div className="text-base font-bold text-blue-700 mt-0.5">
                        {CONFIDENCE_LABELS[interpConf as keyof typeof CONFIDENCE_LABELS] || interpConf}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Dasar: Frekuensi matematis terukur</div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Keyakinan Hipotesis</div>
                      <div className="text-base font-bold text-purple-700 mt-0.5">
                        {CONFIDENCE_LABELS[hypConf as keyof typeof CONFIDENCE_LABELS] || hypConf}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Dasar: Eksplorasi spekulatif (belum diuji)</div>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
                    <strong className="text-slate-800 font-bold">Penjelasan Keyakinan: </strong>
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
                Poin Bukti Kuantitatif Terverifikasi ({signal.evidence.length})
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
                          {formatDateIndonesian(ev.observedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800">{ev.description}</p>
                    </div>

                    <div className="text-right shrink-0 bg-white px-3 py-1.5 rounded border border-slate-200 shadow-2xs">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Nilai Teramati</div>
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
                Materi Iklan Terkait yang Diamati ({supportingAds.length})
              </h3>

              {supportingAds.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  Tidak ada materi iklan langsung yang ditautkan. Sinyal ini diagregasi pada tingkat tren makro kategori.
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
                          <span className="font-mono text-blue-600 shrink-0 font-medium">{ad.observedDays} hari aktif</span>
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
                <div className="font-bold text-blue-900 mb-0.5">Mengapa Sinyal Ini Penting Secara Strategis</div>
                <p className="text-slate-700 leading-relaxed">{signal.whyItMatters}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tindakan Verifikasi & Pengujian Konkret
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
                        <span>Audit landing page dan pesan promosi brand Anda terhadap pergeseran competitor ini.</span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Siapkan 2–3 variasi materi baru untuk menguji celah sudut pandang ini secara terukur.</span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Tinjau kembali pustaka iklan publik dalam 7 hari untuk memantau apakah competitor melanjutkan materi ini.</span>
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
            ID Sinyal: <span className="font-mono text-slate-700">{signal.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition cursor-pointer"
          >
            Tutup Peninjau
          </button>
        </div>
      </div>
    </div>
  );
};
