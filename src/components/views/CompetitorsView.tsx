import React, { useState } from 'react';
import { Competitor, AdObservation, CreativeFamily, MarketSignal } from '../../types/radar';
import { SourceBadge } from '../SourceBadge';
import { formatDateIndonesian } from '../../utils/labels';
import {
  Users,
  Search,
  Plus,
  ExternalLink,
  Tag,
  Clock,
  Layers,
  Activity,
  AlertCircle,
  Eye,
  Shield,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Globe,
} from 'lucide-react';

interface CompetitorsViewProps {
  competitors: Competitor[];
  ads: AdObservation[];
  creativeFamilies: CreativeFamily[];
  signals: MarketSignal[];
  onSelectAd: (ad: AdObservation) => void;
  onAddCompetitor: (competitor: Competitor) => void;
  onOpenSyncForCompetitor?: (competitor: Competitor) => void;
  onOpenAddCompetitorModal?: () => void;
}

export const CompetitorsView: React.FC<CompetitorsViewProps> = ({
  competitors,
  ads,
  creativeFamilies,
  signals,
  onSelectAd,
  onAddCompetitor,
  onOpenSyncForCompetitor,
  onOpenAddCompetitorModal,
}) => {
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCompetitors = competitors.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // If a competitor is selected, show their dedicated Competitor Profile Page
  if (selectedCompetitor) {
    const compAds = ads.filter((a) => a.competitorId === selectedCompetitor.id);
    const compFamilies = creativeFamilies.filter((f) => f.competitorId === selectedCompetitor.id);
    const compSignals = signals.filter((s) => s.relatedCompetitors.includes(selectedCompetitor.id));

    // Distribution calculation
    const formatCounts = compAds.reduce((acc, a) => {
      acc[a.format] = (acc[a.format] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 animate-fadeIn">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedCompetitor(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Direktori Competitor</span>
          </button>

          {onOpenSyncForCompetitor && (
            <button
              onClick={() => onOpenSyncForCompetitor(selectedCompetitor)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronkan Brand Ini</span>
            </button>
          )}
        </div>

        {/* Competitor Profile Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-xl font-bold text-blue-600 shrink-0 shadow-2xs">
              {selectedCompetitor.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{selectedCompetitor.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  selectedCompetitor.status === 'surging' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  selectedCompetitor.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {selectedCompetitor.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 max-w-2xl">{selectedCompetitor.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span>Kategori: <strong className="text-slate-800">{selectedCompetitor.category}</strong></span>
                <span>•</span>
                <span>Terakhir Terpantau: <strong className="text-slate-800">{formatDateIndonesian(selectedCompetitor.lastObserved)}</strong></span>
                {selectedCompetitor.website && (
                  <>
                    <span>•</span>
                    <a
                      href={selectedCompetitor.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      {selectedCompetitor.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {selectedCompetitor.tags.map((tag, i) => (
              <span key={i} className="px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Observasi Iklan</div>
            <div className="text-2xl font-black text-slate-900 font-sans">{compAds.length}</div>
            <div className="text-[10px] text-blue-600 font-medium mt-1">Terverifikasi di Market Memory</div>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Creative Family</div>
            <div className="text-2xl font-black text-slate-900 font-sans">{compFamilies.length}</div>
            <div className="text-[10px] text-purple-600 font-medium mt-1">Kluster konsep pesan</div>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sinyal Pasar Terkait</div>
            <div className="text-2xl font-black text-slate-900 font-sans">{compSignals.length}</div>
            <div className="text-[10px] text-amber-600 font-medium mt-1">Peristiwa terpantau</div>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sebaran Format</div>
            <div className="text-xs font-medium text-slate-800 mt-2 space-y-1">
              {Object.entries(formatCounts).map(([fmt, count]) => (
                <div key={fmt} className="flex justify-between text-[11px]">
                  <span className="capitalize text-slate-600">{fmt}</span>
                  <span className="font-bold text-blue-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Associated Market Signals */}
        {compSignals.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600" />
              Sinyal Pasar Terdeteksi Untuk Brand Ini
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {compSignals.map((sig) => (
                <div key={sig.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{sig.title}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase border border-blue-200">
                      {sig.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{sig.description}</p>
                  <div className="text-[11px] text-amber-900 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200">
                    <strong>Mengapa Penting:</strong> {sig.whyItMatters}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observed Creatives Grid */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            Katalog Creative Terpantau ({compAds.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {compAds.map((ad) => (
              <div
                key={ad.id}
                onClick={() => onSelectAd(ad)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-xs cursor-pointer transition flex flex-col group"
              >
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <img
                    src={ad.thumbnailUrl}
                    alt={ad.headline}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <SourceBadge source={ad.observationSource} verificationLevel={ad.provenance?.verificationLevel} />
                  </div>
                  <div className="absolute top-2 right-2 bg-purple-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    {ad.observedDays}h aktif
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition">
                      {ad.headline}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {ad.primaryText}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize">{ad.CTA}</span>
                    <span className="text-blue-600 font-semibold group-hover:translate-x-1 transition">
                      Periksa Bukti →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Directory View
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Direktori Intelijen Competitor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Profil dan aktivitas kompetitor yang dipantau secara real-time pada workspace ini
          </p>
        </div>

        <button
          onClick={onOpenAddCompetitorModal}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Competitor ke Radar</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kompetitor berdasarkan nama atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1 text-[11px]">Status:</span>
          {['all', 'surging', 'active', 'pausing'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg capitalize transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-500 hover:text-slate-900 bg-slate-50'
              }`}
            >
              {st === 'all' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Competitors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompetitors.map((comp) => {
          const compObservedAds = ads.filter((a) => a.competitorId === comp.id);
          const count = compObservedAds.length;
          const compSignalsCount = signals.filter((s) => s.relatedCompetitors.includes(comp.id)).length;
          const primarySource = compObservedAds[0]?.observationSource || 'PUBLIC_OBSERVATION';

          return (
            <div
              key={comp.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div
                    onClick={() => setSelectedCompetitor(comp)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-600 text-sm shadow-2xs">
                      {comp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {comp.name}
                      </h3>
                      <span className="text-[11px] text-slate-500">{comp.category}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    comp.status === 'surging' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    comp.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {comp.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {comp.description}
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <SourceBadge source={primarySource} />
                  {comp.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 text-[11px]">
                  <strong className="text-slate-800 font-bold">{count}</strong> observasi iklan
                  {compSignalsCount > 0 && (
                    <span className="ml-1 text-amber-600 font-semibold">• {compSignalsCount} sinyal</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onOpenSyncForCompetitor && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSyncForCompetitor(comp);
                      }}
                      title="Sinkronkan data untuk kompetitor ini"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCompetitor(comp)}
                    className="text-blue-600 font-bold flex items-center gap-0.5 hover:underline text-xs"
                  >
                    Profil <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
