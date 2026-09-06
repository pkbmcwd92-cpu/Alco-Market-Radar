import React, { useState, useEffect } from 'react';
import { Competitor, MarketWorkspace, AdObservation, MarketSignal } from '../types/radar';
import { providerRegistry } from '../services/providers/ProviderRegistry';
import { runIngestionPipeline } from '../services/ingestion/ingestionOrchestrator';
import { IngestionResult, MarketDataProvider } from '../types/provider';
import { PROVIDER_HEALTH_LABELS, formatDateIndonesian } from '../utils/labels';
import {
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  ShieldCheck,
  UploadCloud,
  FileCheck,
  ArrowRight,
} from 'lucide-react';

interface SyncDataModalProps {
  workspace: MarketWorkspace;
  competitors: Competitor[];
  targetCompetitor?: Competitor | null;
  onClose: () => void;
  onSyncComplete: (updatedAds: AdObservation[], signals: MarketSignal[], result: IngestionResult) => void;
  onOpenManualImport: () => void;
}

export const SyncDataModal: React.FC<SyncDataModalProps> = ({
  workspace,
  competitors,
  targetCompetitor,
  onClose,
  onSyncComplete,
  onOpenManualImport,
}) => {
  const [providers, setProviders] = useState<MarketDataProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('demo_synthetic_provider');
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>(targetCompetitor?.id || 'ALL');
  const [providerStatuses, setProviderStatuses] = useState<Record<string, { status: string; message: string }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncStep, setSyncStep] = useState<string>('');
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const list = providerRegistry.list();
    setProviders(list);

    // Check health of all providers
    const checkAll = async () => {
      const statuses: Record<string, { status: string; message: string }> = {};
      for (const p of list) {
        try {
          const h = await p.healthCheck();
          statuses[p.id] = { status: h.status, message: h.message };
        } catch {
          statuses[p.id] = { status: 'UNAVAILABLE', message: 'Gagal terhubung ke provider' };
        }
      }
      setProviderStatuses(statuses);
    };

    checkAll();
  }, []);

  const handleStartSync = async () => {
    const provider = providerRegistry.get(selectedProviderId);
    if (!provider) return;

    if (selectedProviderId === 'manual_import_provider') {
      onClose();
      onOpenManualImport();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIngestionResult(null);
    setSyncStep('Menghubungi provider...');

    try {
      const comp = competitors.find((c) => c.id === selectedCompetitorId);
      const advertiserName = comp ? comp.name : undefined;

      setSyncStep('Mengambil data observasi publik...');
      const { result, updatedAds, generatedSignals } = await runIngestionPipeline(
        provider,
        {
          workspaceId: workspace.id,
          competitorId: comp?.id,
          advertiserName,
          limit: 30,
        },
        {
          competitorsMap: new Map(competitors.map((c) => [c.id, c.name])),
          targetCompetitorId: comp?.id,
          targetCompetitorName: comp?.name,
        }
      );

      setSyncStep('Menyimpan ke Market Memory & memperbarui Radar...');
      setIngestionResult(result);

      if (result.status === 'FAILED' && result.errors.length > 0) {
        setErrorMessage(result.errors[0].message || 'Sinkronisasi gagal dilakukan.');
      } else {
        onSyncComplete(updatedAds, generatedSignals, result);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat sinkronisasi.');
    } finally {
      setIsLoading(false);
      setSyncStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Sinkronkan Data Observasi Pasar</h3>
              <p className="text-xs text-slate-500">
                Ambil dan perbarui data creative ke dalam Market Memory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!ingestionResult ? (
            <>
              {/* Target Competitor Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Competitor
                </label>
                <select
                  value={selectedCompetitorId}
                  onChange={(e) => setSelectedCompetitorId(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="ALL">Semua Competitor dalam Workspace ({competitors.length})</option>
                  {competitors.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name} {comp.metaPageId ? `(${comp.metaPageId})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Pilih Sumber Data (Provider)
                </label>
                <div className="space-y-2.5">
                  {providers.map((p) => {
                    const health = providerStatuses[p.id] || { status: 'READY', message: '' };
                    const isSelected = selectedProviderId === p.id;
                    const healthBadge = PROVIDER_HEALTH_LABELS[health.status] || PROVIDER_HEALTH_LABELS.READY;

                    return (
                      <div
                        key={p.id}
                        onClick={() => !isLoading && setSelectedProviderId(p.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/10'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {p.id.includes('demo') ? (
                                <Database className="w-4 h-4" />
                              ) : p.id.includes('manual') ? (
                                <UploadCloud className="w-4 h-4" />
                              ) : (
                                <ShieldCheck className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{p.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {p.id.includes('demo')
                                  ? 'Data sintetis untuk simulasi dan evaluasi tanpa token API'
                                  : p.id.includes('manual')
                                  ? 'Upload file JSON / CSV langsung dari komputer Anda'
                                  : 'Mengambil observasi publik Meta Ads Library via server proxy'}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${healthBadge.color}`}
                          >
                            {healthBadge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status or warning box */}
              {selectedProviderId === 'external_market_provider' &&
                providerStatuses[selectedProviderId]?.status === 'NOT_CONFIGURED' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Provider Eksternal Belum Dikonfigurasi:</span> Token
                      API (<code>EXTERNAL_PROVIDER_API_TOKEN</code>) belum diisi. Anda dapat menggunakan{' '}
                      <strong>Mode Demo</strong> atau <strong>Import Manual (JSON/CSV)</strong> untuk
                      memasukkan data observasi.
                    </div>
                  </div>
                )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Sinkronisasi Belum Berhasil:</span> {errorMessage}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                  <div className="text-xs font-semibold text-blue-900">{syncStep}</div>
                </div>
              )}
            </>
          ) : (
            /* Ingestion Result Summary */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-900">
                    Sinkronisasi Berhasil Diselesaikan
                  </div>
                  <div className="text-xs text-emerald-700">
                    Data telah dinormalisasi, divalidasi, dan dicatat ke dalam Market Memory.
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-xl font-black text-slate-900">{ingestionResult.fetched}</div>
                  <div className="text-[11px] font-medium text-slate-500">Total Diambil</div>
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
                  <div className="text-[11px] font-medium text-slate-500">Duplikat Tercatat</div>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                  <div className="text-xl font-black text-purple-700">
                    {ingestionResult.snapshotsCreated}
                  </div>
                  <div className="text-[11px] font-medium text-purple-600">Snapshot Historis</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <div className="text-xl font-black text-amber-700">{ingestionResult.rejected}</div>
                  <div className="text-[11px] font-medium text-amber-600">Ditolak</div>
                </div>
              </div>

              {ingestionResult.errors.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                  <div className="font-bold text-slate-800">Catatan Validasi ({ingestionResult.errors.length}):</div>
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
                onClick={handleStartSync}
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sinkronisasi...</span>
                  </>
                ) : (
                  <>
                    <span>Mulai Sinkronisasi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              Selesai & Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
