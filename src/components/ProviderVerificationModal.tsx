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
  Database,
  Layers,
  FileCheck2,
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
        providerId: 'external_market_provider',
        verified: false,
        status: 'FAILED_VERIFICATION',
        checkedAt: new Date().toISOString(),
        latencyMs: 0,
        reachable: false,
        authenticated: false,
        rawItemsReceived: 0,
        normalizedItems: 0,
        validItems: 0,
        rejectedItems: 0,
        tokenConfigured: false,
        message: err?.message || 'Gagal menghubungi server verifikasi.',
        warnings: [],
        errors: ['NETWORK_ERROR'],
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
    if (!res) return { label: 'Memeriksa...', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock };
    switch (res.status) {
      case 'VERIFIED':
        return { label: 'TERVERIFIKASI', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
      case 'UNVERIFIED':
        return { label: 'BELUM TERVERIFIKASI', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: AlertTriangle };
      case 'NOT_CONFIGURED':
        return { label: 'BELUM DIKONFIGURASI', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Key };
      case 'DEGRADED':
        return { label: 'DEGRADASI LAYANAN (TIMEOUT)', color: 'bg-orange-50 text-orange-800 border-orange-200', icon: AlertTriangle };
      case 'FAILED_VERIFICATION':
      default:
        return { label: 'VERIFIKASI GAGAL', color: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle };
    }
  };

  const statusInfo = getStatusDisplay(result);
  const StatusIcon = statusInfo.icon;

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
              <h3 className="text-base font-bold text-slate-900">Uji Verifikasi Integritas Data Provider</h3>
              <p className="text-xs text-slate-500">
                Pemeriksaan koneksi, normalisasi, dan validasi observasi nyata
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
        <div className="p-6 overflow-y-auto space-y-4">
          {isTesting ? (
            <div className="p-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800">Menjalankan Jalur Verifikasi Data...</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Menguji koneksi server, otentikasi token, mengambil data canary, lalu memproses melalui pipeline normalisasi dan validasi domain Radar.
              </p>
            </div>
          ) : result ? (
            <>
              {/* Primary Diagnostic Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${statusInfo.color}`}>
                <StatusIcon className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">{statusInfo.label}</span>
                    {result.latencyMs > 0 && (
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-white/80 rounded-full font-bold shadow-2xs">
                        {result.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed opacity-95">{result.message}</p>
                </div>
              </div>

              {/* Status Provider Matrix */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>Status Provider & Konektivitas</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 pb-2 border-b border-slate-200/60 text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 font-medium">Konfigurasi</div>
                    <div className={`font-bold text-xs ${result.tokenConfigured ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {result.tokenConfigured ? 'SIAP' : 'BELUM DIATUR'}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 font-medium">Koneksi API</div>
                    <div className={`font-bold text-xs ${result.reachable ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {result.reachable ? 'BERHASIL' : 'GAGAL'}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 font-medium">Autentikasi</div>
                    <div className={`font-bold text-xs ${result.authenticated ? 'text-emerald-700' : result.reachable ? 'text-rose-700' : 'text-slate-400'}`}>
                      {result.authenticated ? 'BERHASIL' : result.reachable ? 'GAGAL' : 'BELUM DIUJI'}
                    </div>
                  </div>
                </div>

                <div className="pt-1 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Actor Scraper:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {result.actorId || 'Default'}
                    </span>
                  </div>
                  {!result.isActorConfigured && (
                    <div className="text-[10px] text-amber-700 bg-amber-50/70 px-2 py-1 rounded border border-amber-200/50">
                      Actor default — belum diverifikasi pada environment ini.
                    </div>
                  )}
                </div>
              </div>

              {/* Data Pipeline Diagnostics */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Jalur Pipa Data Radar (Canary Probe)</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400">Diterima</div>
                    <div className="font-bold text-sm text-slate-800 font-mono">{result.rawItemsReceived}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400">Dinormalisasi</div>
                    <div className="font-bold text-sm text-blue-700 font-mono">{result.normalizedItems}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400">Valid</div>
                    <div className={`font-bold text-sm font-mono ${result.validItems > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {result.validItems}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                    <div className="text-[10px] text-slate-400">Ditolak</div>
                    <div className={`font-bold text-sm font-mono ${result.rejectedItems > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {result.rejectedItems}
                    </div>
                  </div>
                </div>
              </div>

              {/* Errors / Warnings if any */}
              {result.errors && result.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Rincian Kegagalan Verifikasi</span>
                  </div>
                  <ul className="space-y-1 text-rose-800 text-[11px] list-disc list-inside">
                    {result.errors.map((err, idx) => (
                      <li key={idx} className="font-mono">{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sample Data Preview ONLY if validItems > 0 */}
              {result.validItems > 0 && result.sample && (
                <div className="border border-emerald-200 bg-emerald-50/40 p-3.5 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Pratinjau Observasi Tervalidasi (Sample)</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                      Radar Domain Model
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 space-y-1 bg-white p-3 rounded-lg border border-emerald-100 font-sans">
                    <div>
                      <span className="text-slate-400">Advertiser / Brand: </span>
                      <strong className="text-slate-900">{result.sample.advertiserName || 'Tidak tersedia'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Headline: </span>
                      <span className="italic text-slate-800">
                        {result.sample.headline ? `"${result.sample.headline}"` : 'Tidak tersedia'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                      <span>Format: <strong>{result.sample.format || 'Tidak tersedia'}</strong></span>
                      <span>External ID: <strong className="font-mono">{result.sample.externalAdId || 'Tidak tersedia'}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Setup Guide if Not Configured */}
              {!result.tokenConfigured && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Petunjuk Pengaturan Token Eksternal</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Untuk menghubungkan scraper publik Apify/Meta Ads Library, tambahkan variabel lingkungan berikut pada Settings atau file <code>.env</code>:
                  </p>
                  <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] select-all">
                    EXTERNAL_PROVIDER_API_TOKEN=token_anda_disini
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Mode Demo dan Import Manual (JSON/CSV) tetap dapat digunakan tanpa token eksternal.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {result?.checkedAt ? `Diperiksa: ${new Date(result.checkedAt).toLocaleTimeString('id-ID')}` : ''}
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

