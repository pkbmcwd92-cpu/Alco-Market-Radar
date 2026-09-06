import React, { useState } from 'react';
import { ProviderVerificationResult } from '../types/provider';
import {
  ShieldCheck,
  X,
  RefreshCw,
  Clock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Eye,
  Key,
  ExternalLink,
} from 'lucide-react';

interface ProviderVerificationModalProps {
  onClose: () => void;
  initialResult?: ProviderVerificationResult | null;
  onRunTest: () => Promise<ProviderVerificationResult>;
}

export const ProviderVerificationModal: React.FC<ProviderVerificationModalProps> = ({
  onClose,
  initialResult,
  onRunTest,
}) => {
  const [result, setResult] = useState<ProviderVerificationResult | null>(initialResult || null);
  const [isTesting, setIsTesting] = useState<boolean>(!initialResult);

  const handleExecuteTest = async () => {
    setIsTesting(true);
    try {
      const res = await onRunTest();
      setResult(res);
    } catch (err: any) {
      setResult({
        verified: false,
        status: 'UNAVAILABLE',
        latencyMs: 0,
        actorId: 'curious_coder~facebook-ads-library-scraper',
        tokenConfigured: false,
        message: err?.message || 'Gagal menghubungi server verifikasi.',
        sampleItemCount: 0,
      });
    } finally {
      setIsTesting(false);
    }
  };

  React.useEffect(() => {
    if (!initialResult) {
      handleExecuteTest();
    }
  }, []);

  const getStatusDisplay = (res: ProviderVerificationResult | null) => {
    if (!res) return { label: 'Memeriksa...', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    switch (res.status) {
      case 'READY':
        return { label: 'TERVERIFIKASI & SIAP', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
      case 'NOT_CONFIGURED':
        return { label: 'BELUM DIKONFIGURASI', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle };
      case 'DEGRADED':
        return { label: 'DEGRADASI LAYANAN', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle };
      default:
        return { label: 'TIDAK TERSEDIA', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle };
    }
  };

  const statusInfo = getStatusDisplay(result);
  const StatusIcon = statusInfo.icon || Clock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Uji Verifikasi Provider Eksternal</h3>
              <p className="text-xs text-slate-500">
                Pemeriksaan konektivitas, otentikasi token, dan latensi scraper publik
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
          {isTesting ? (
            <div className="p-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800">Menjalankan Pengujian Canary Provider...</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Menguji endpoint server proxy, otentikasi token, dan kesiapan dataset Meta Ads Library.
              </p>
            </div>
          ) : result ? (
            <>
              {/* Primary Diagnostic Card */}
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${statusInfo.color}`}>
                <StatusIcon className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider">{statusInfo.label}</span>
                    {result.latencyMs > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-white/70 rounded-full font-bold">
                        {result.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{result.message}</p>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>Detail Konfigurasi & Lingkungan</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-200/60">
                  <span>Actor Scraper Publik:</span>
                  <span className="font-mono font-semibold text-slate-900">{result.actorId}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600 py-1 border-b border-slate-200/60">
                  <span>Token API Terkonfigurasi:</span>
                  <span className={`font-semibold ${result.tokenConfigured ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {result.tokenConfigured ? 'Ya (Server-Side Secret)' : 'Belum Diatur'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600 py-1">
                  <span>Status Verifikasi Ingesti:</span>
                  <span className="font-semibold text-slate-900">
                    {result.verified ? 'Lolos Pengujian' : 'Belum Terverifikasi'}
                  </span>
                </div>
              </div>

              {/* Sample Data Preview if Verified */}
              {result.sampleItemPreview && (
                <div className="border border-emerald-200 bg-emerald-50/40 p-3.5 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pratinjau Sampel Observasi Nyata (Canary Response)</span>
                  </div>
                  <div className="text-[11px] text-slate-700 space-y-1 bg-white p-3 rounded-lg border border-emerald-100 font-sans">
                    <div>
                      <span className="text-slate-400">Page/Brand: </span>
                      <strong className="text-slate-900">{result.sampleItemPreview.pageName}</strong>
                    </div>
                    {result.sampleItemPreview.headline && (
                      <div>
                        <span className="text-slate-400">Headline: </span>
                        <span className="italic text-slate-800">"{result.sampleItemPreview.headline}"</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 font-mono pt-1">
                      ID: {result.sampleItemPreview.id}
                    </div>
                  </div>
                </div>
              )}

              {/* Setup Guide if Not Configured */}
              {!result.tokenConfigured && (
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Petunjuk Menghubungkan Provider Nyata</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Untuk menghubungkan scraper publik Apify/Meta Ads Library, tambahkan variabel lingkungan berikut pada Secrets atau file <code>.env</code>:
                  </p>
                  <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] select-all">
                    EXTERNAL_PROVIDER_API_TOKEN=apify_api_token_anda
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Catatan: Tanpa token API eksternal, Anda tetap dapat menggunakan <strong>Mode Demo</strong> untuk simulasi atau <strong>Import Manual (JSON/CSV)</strong> untuk memuat dataset nyata secara langsung.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {result?.latencyMs ? `Respon: ${result.latencyMs}ms` : ''}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteTest}
              disabled={isTesting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>Uji Ulang</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
