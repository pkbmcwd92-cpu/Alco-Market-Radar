import React, { useState, useEffect } from 'react';
import { MarketWorkspace, AdObservation } from '../../types/radar';
import { DataSourceStatus, IngestionJob, MarketDataProvider, ProviderVerificationResult } from '../../types/provider';
import { providerRegistry } from '../../services/providers/ProviderRegistry';
import { defaultObservationRepository } from '../../services/storage/observationRepository';
import { PROVIDER_HEALTH_LABELS, formatDateIndonesian } from '../../utils/labels';
import { ProviderVerificationModal } from '../ProviderVerificationModal';
import {
  Database,
  Globe,
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Layers,
  FileSpreadsheet,
  Cpu,
  Clock,
  ExternalLink,
  ShieldAlert,
  Sliders,
} from 'lucide-react';

interface DataSourcesViewProps {
  workspace: MarketWorkspace;
  allAds: AdObservation[];
  onOpenSyncModal: () => void;
  onOpenManualImport: () => void;
}

export const DataSourcesView: React.FC<DataSourcesViewProps> = ({
  workspace,
  allAds,
  onOpenSyncModal,
  onOpenManualImport,
}) => {
  const [providers, setProviders] = useState<MarketDataProvider[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<Record<string, { status: string; message: string }>>({});
  const [recentJobs, setRecentJobs] = useState<IngestionJob[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<ProviderVerificationResult | null>(null);

  const loadData = async () => {
    setIsRefreshing(true);
    const list = providerRegistry.list();
    setProviders(list);

    const statuses: Record<string, { status: string; message: string }> = {};
    for (const p of list) {
      try {
        const h = await p.healthCheck();
        statuses[p.id] = { status: h.status, message: h.message };
      } catch {
        statuses[p.id] = { status: 'UNAVAILABLE', message: 'Gagal terhubung' };
      }
    }
    setProviderStatuses(statuses);

    const jobs = await defaultObservationRepository.listIngestionJobs(workspace.id);
    setRecentJobs(jobs);
    setIsRefreshing(false);
  };

  const handleRunVerification = async (): Promise<ProviderVerificationResult> => {
    const extProvider = providerRegistry.get('external_market_provider');
    if (extProvider && extProvider.verifyConnection) {
      const res = await extProvider.verifyConnection();
      setVerificationResult(res);
      // Also refresh statuses
      await loadData();
      return res;
    }

    // Direct fallback
    const res = await fetch('/api/providers/external/verify', { method: 'POST' });
    const data = await res.json();
    setVerificationResult(data);
    await loadData();
    return data;
  };

  useEffect(() => {
    loadData();
  }, [workspace.id]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Server className="w-3.5 h-3.5" />
            <span>Fondasi Data Pasar (V1.2.1)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sumber Data & Status Provider
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Arsitektur ingest multi-provider independen untuk mengumpulkan, menormalisasi, memvalidasi,
            dan merekam observasi iklan publik ke Market Memory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setIsVerificationModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Uji Provider Eksternal</span>
          </button>
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Perbarui Status</span>
          </button>
          <button
            onClick={onOpenManualImport}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
            <span>Import JSON / CSV</span>
          </button>
          <button
            onClick={onOpenSyncModal}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkronkan Data</span>
          </button>
        </div>
      </div>

      {/* Provider Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {providers.map((p) => {
          const health = providerStatuses[p.id] || { status: 'READY', message: '' };
          const healthBadge = PROVIDER_HEALTH_LABELS[health.status] || PROVIDER_HEALTH_LABELS.READY;
          const caps = p.capabilities();
          const isExternal = p.id === 'external_market_provider';

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    {p.id.includes('demo') ? (
                      <Database className="w-5 h-5 text-purple-600" />
                    ) : p.id.includes('manual') ? (
                      <UploadCloud className="w-5 h-5 text-amber-600" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${healthBadge.color}`}>
                    {healthBadge.label}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                  {p.id.includes('demo')
                    ? 'Menghasilkan observasi sintetis terkendali untuk pengujian, onboarding, dan demonstrasi tanpa token eksternal.'
                    : p.id.includes('manual')
                    ? 'Mengimpor dataset publik dari file JSON atau CSV dengan validasi dan pemetaan otomatis ke Market Memory.'
                    : 'Mengambil data publik langsung dari Meta Ads Library melalui proxy server aman (mendukung Apify actor).'}
                </p>

                {/* Capabilities list */}
                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Pencarian Advertiser:</span>
                    <span className="font-semibold text-slate-900">{caps.searchByAdvertiser ? 'Ya' : 'Tidak'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Pencarian Kata Kunci:</span>
                    <span className="font-semibold text-slate-900">{caps.searchByKeyword ? 'Ya' : 'Tidak'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Aset Media Creative:</span>
                    <span className="font-semibold text-slate-900">{caps.fetchMedia ? 'Tersedia' : 'Tidak'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Data Historis & Snapshot:</span>
                    <span className="font-semibold text-slate-900">{caps.supportsHistoricalData ? 'Ya' : 'Tidak'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">{p.sourceType}</span>
                <div className="flex items-center gap-2">
                  {isExternal && (
                    <button
                      onClick={() => {
                        setIsVerificationModalOpen(true);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md"
                    >
                      Uji Provider
                    </button>
                  )}
                  {p.id.includes('manual') ? (
                    <button
                      onClick={onOpenManualImport}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800"
                    >
                      Buka Import →
                    </button>
                  ) : (
                    <button
                      onClick={onOpenSyncModal}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Sinkronkan →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ingestion History Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Riwayat Ingesti & Sinkronisasi Pasar</h3>
            <p className="text-xs text-slate-500">
              Catatan eksekusi pipeline observasi, deduplikasi, dan pembuatan snapshot
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {recentJobs.length} Aktivitas
          </span>
        </div>

        {recentJobs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Belum ada catatan pekerjaan ingesti untuk workspace ini. Klik "Sinkronkan Data" atau "Import JSON / CSV" untuk memulai.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentJobs.map((job) => {
              const res = job.result;
              const isCompleted = job.status === 'COMPLETED';
              const isPartial = job.status === 'PARTIAL';

              return (
                <div key={job.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : isPartial
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {job.targetCompetitorName ? `Sinkronisasi: ${job.targetCompetitorName}` : 'Sinkronisasi Workspace'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                          {job.providerId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateIndonesian(job.startedAt)} • ID: {job.id}
                      </div>
                    </div>
                  </div>

                  {res && (
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                      <div>
                        <span className="text-slate-400">Diambil: </span>
                        <span className="font-bold text-slate-900">{res.fetched}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Baru: </span>
                        <span className="font-bold text-blue-600">{res.created}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Diperbarui: </span>
                        <span className="font-bold text-indigo-600">{res.updated}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Duplikat: </span>
                        <span className="font-bold text-slate-700">{res.duplicates}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Snapshots: </span>
                        <span className="font-bold text-purple-600">{res.snapshotsCreated}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isPartial
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {isVerificationModalOpen && (
        <ProviderVerificationModal
          onClose={() => setIsVerificationModalOpen(false)}
          initialResult={verificationResult}
          onRunTest={handleRunVerification}
        />
      )}
    </div>
  );
};
