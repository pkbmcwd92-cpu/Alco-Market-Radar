import React, { useState } from 'react';
import { Competitor, MarketWorkspace, AdObservation, MarketSignal } from '../types/radar';
import { ManualImportProvider } from '../services/providers/ManualImportProvider';
import { runIngestionPipeline } from '../services/ingestion/ingestionOrchestrator';
import { IngestionResult } from '../types/provider';
import {
  UploadCloud,
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';

interface ManualImportModalProps {
  workspace: MarketWorkspace;
  competitors: Competitor[];
  onClose: () => void;
  onImportComplete: (updatedAds: AdObservation[], signals: MarketSignal[], result: IngestionResult) => void;
}

const EXAMPLE_JSON_TEMPLATE = `[
  {
    "advertiserName": "ElsheSkin",
    "externalAdId": "meta_public_obs_001",
    "adStatus": "active",
    "firstSeen": "2026-09-01T00:00:00Z",
    "format": "video",
    "headline": "Kuis Cek Jenis Masalah Kulit: Rekomendasi Rutin Personal 60 Detik",
    "primaryText": "Masih bingung kenapa skincare kamu belum ada hasil? Dokter spesialis kami rancang kuis evaluasi skin barrier gratis.",
    "CTA": "learn more",
    "destinationUrl": "https://example.com/quiz-skin-barrier",
    "mediaUrl": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80"
  },
  {
    "advertiserName": "Somethinc",
    "externalAdId": "meta_public_obs_002",
    "adStatus": "active",
    "firstSeen": "2026-09-03T00:00:00Z",
    "format": "static image",
    "headline": "Bundle Niacinamide + Ceramide: Diskon 30% Terbatas",
    "primaryText": "Formula pH seimbang 5.5 untuk perbaikan skin barrier dalam 14 hari.",
    "CTA": "shop now",
    "destinationUrl": "https://example.com/bundle-barrier",
    "mediaUrl": "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80"
  }
]`;

const EXAMPLE_CSV_TEMPLATE = `advertiserName,externalAdId,adStatus,firstSeen,format,headline,primaryText,CTA,destinationUrl
"ElsheSkin","meta_public_001","active","2026-09-01T00:00:00Z","video","Kuis Evaluasi Skin Barrier 60 Detik","Masih bingung kenapa skincare belum ada hasil? Ikuti kuis evaluasi dokter.","learn more","https://example.com/quiz"
"Somethinc","meta_public_002","active","2026-09-03T00:00:00Z","static image","Paket Bundle Serum 3-in-1 Diskon 30%","Formulasi pH seimbang 5.5 perbaiki barrier dalam 14 hari.","shop now","https://example.com/bundle"`;

export const ManualImportModal: React.FC<ManualImportModalProps> = ({
  workspace,
  competitors,
  onClose,
  onImportComplete,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>('AUTO');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);

  const handleCopyTemplate = () => {
    const template = selectedFormat === 'json' ? EXAMPLE_JSON_TEMPLATE : EXAMPLE_CSV_TEMPLATE;
    navigator.clipboard.writeText(template);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleApplyTemplate = () => {
    setInputText(selectedFormat === 'json' ? EXAMPLE_JSON_TEMPLATE : EXAMPLE_CSV_TEMPLATE);
    setValidationErrors([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
      if (file.name.endsWith('.csv')) {
        setSelectedFormat('csv');
      } else if (file.name.endsWith('.json')) {
        setSelectedFormat('json');
      }
      setValidationErrors([]);
    };
    reader.readAsText(file);
  };

  const handleRunImport = async () => {
    if (!inputText.trim()) {
      setValidationErrors(['Silakan masukkan teks JSON/CSV atau upload file data observasi.']);
      return;
    }

    setIsLoading(true);
    setValidationErrors([]);
    setIngestionResult(null);

    try {
      const provider = new ManualImportProvider();
      const stageRes = provider.stageImport({
        data: inputText,
        format: selectedFormat,
        sourceTag: 'USER_IMPORT',
      });

      if (stageRes.errors.length > 0) {
        setValidationErrors(stageRes.errors);
        setIsLoading(false);
        return;
      }

      if (stageRes.count === 0) {
        setValidationErrors(['Tidak ada data yang dapat dibaca dari input. Periksa format JSON/CSV Anda.']);
        setIsLoading(false);
        return;
      }

      const comp = competitors.find((c) => c.id === selectedCompetitorId);

      const { result, updatedAds, generatedSignals } = await runIngestionPipeline(
        provider,
        {
          workspaceId: workspace.id,
          competitorId: comp?.id,
          advertiserName: comp?.name,
        },
        {
          competitorsMap: new Map(competitors.map((c) => [c.id, c.name])),
          targetCompetitorId: comp?.id,
          targetCompetitorName: comp?.name,
        }
      );

      setIngestionResult(result);
      if (result.status !== 'FAILED') {
        onImportComplete(updatedAds, generatedSignals, result);
      }
    } catch (err: any) {
      setValidationErrors([err?.message || 'Gagal memproses import data.']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Import Observasi Manual (JSON / CSV)</h3>
              <p className="text-xs text-slate-500">
                Masukkan data observasi publik tanpa memerlukan integrasi API eksternal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!ingestionResult ? (
            <>
              {/* Format selection and Template tools */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Format:</span>
                  <div className="flex bg-slate-200/80 p-0.5 rounded-lg">
                    <button
                      onClick={() => setSelectedFormat('json')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        selectedFormat === 'json' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => setSelectedFormat('csv')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        selectedFormat === 'csv' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      CSV
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApplyTemplate}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
                  >
                    Gunakan Contoh Format
                  </button>
                  <button
                    onClick={handleCopyTemplate}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Tersalin' : 'Salin Template'}</span>
                  </button>
                </div>
              </div>

              {/* Target Competitor mapping */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tautkan ke Competitor (Opsional)
                </label>
                <select
                  value={selectedCompetitorId}
                  onChange={(e) => setSelectedCompetitorId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                >
                  <option value="AUTO">Otomatis deteksi dari kolom "advertiserName"</option>
                  {competitors.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Textarea or File input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Data Input ({selectedFormat.toUpperCase()})
                  </label>
                  <label className="text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Pilih File (.json, .csv)</span>
                    <input
                      type="file"
                      accept=".json,.csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={8}
                  placeholder={`Tempelkan data ${selectedFormat.toUpperCase()} di sini atau klik 'Gunakan Contoh Format'...`}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 selection:bg-amber-600"
                />
              </div>

              {/* Errors notice */}
              {validationErrors.length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Terdeteksi Kesalahan Validasi:</span>
                  </div>
                  {validationErrors.map((err, idx) => (
                    <div key={idx} className="pl-5 text-rose-700">• {err}</div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Results View */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-900">
                    Import Data Berhasil Dimasukkan
                  </div>
                  <div className="text-xs text-emerald-700">
                    Data telah melewati normalisasi, validasi, dan deduplikasi ke Market Memory.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-xl font-black text-slate-900">{ingestionResult.fetched}</div>
                  <div className="text-[11px] font-medium text-slate-500">Diimpor</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <div className="text-xl font-black text-emerald-700">{ingestionResult.accepted}</div>
                  <div className="text-[11px] font-medium text-emerald-600">Diterima</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <div className="text-xl font-black text-blue-700">{ingestionResult.created}</div>
                  <div className="text-[11px] font-medium text-blue-600">Observasi Baru</div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                  <div className="text-xl font-black text-indigo-700">{ingestionResult.updated}</div>
                  <div className="text-[11px] font-medium text-indigo-600">Diperbarui</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-xl font-black text-slate-700">{ingestionResult.duplicates}</div>
                  <div className="text-[11px] font-medium text-slate-500">Duplikat</div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                  <div className="text-xl font-black text-purple-700">{ingestionResult.snapshotsCreated}</div>
                  <div className="text-[11px] font-medium text-purple-600">Snapshots</div>
                </div>
              </div>

              {ingestionResult.errors.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-800">Catatan Baris ({ingestionResult.errors.length}):</div>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-slate-600 text-[11px]">
                    {ingestionResult.errors.map((e, idx) => (
                      <div key={idx}>• {e.message}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
          {!ingestionResult ? (
            <>
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRunImport}
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses Ingesti...</span>
                  </>
                ) : (
                  <>
                    <span>Proses Import & Ingesti</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors"
            >
              Selesai & Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
