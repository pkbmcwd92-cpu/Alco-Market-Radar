import React, { useState } from 'react';
import { AdObservation, Competitor, FormatType, HookType, MessagingAngle, OfferType, LongevityTier, ObservationSource } from '../../types/radar';
import { filterAds, classifyCreativeDeterministically } from '../../services/radarEngine';
import { SourceBadge } from '../SourceBadge';
import {
  HOOK_LABELS,
  ANGLE_LABELS,
  OFFER_LABELS,
  FORMAT_LABELS,
  LONGEVITY_LABELS,
  OBSERVATION_SOURCE_LABELS,
  formatDateIndonesian,
} from '../../utils/labels';
import {
  Eye,
  Search,
  Filter,
  SlidersHorizontal,
  Clock,
  Target,
  Megaphone,
  Tag,
  ExternalLink,
  ChevronDown,
  Info,
  Database,
} from 'lucide-react';

interface AdsViewProps {
  ads: AdObservation[];
  competitors: Competitor[];
  onSelectAd: (ad: AdObservation) => void;
}

export const AdsView: React.FC<AdsViewProps> = ({ ads, competitors, onSelectAd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<ObservationSource | 'all'>('all');
  const [selectedFormat, setSelectedFormat] = useState<FormatType | 'all'>('all');
  const [selectedHook, setSelectedHook] = useState<HookType | 'all'>('all');
  const [selectedAngle, setSelectedAngle] = useState<MessagingAngle | 'all'>('all');
  const [selectedOffer, setSelectedOffer] = useState<OfferType | 'all'>('all');
  const [selectedLongevity, setSelectedLongevity] = useState<LongevityTier | 'all'>('all');
  const [minDays, setMinDays] = useState<number>(0);

  const filteredAds = ads.filter((ad) => {
    if (selectedSource !== 'all' && ad.observationSource !== selectedSource) return false;
    if (selectedCompetitorId !== 'all' && ad.competitorId !== selectedCompetitorId) return false;
    if (selectedFormat !== 'all' && ad.format !== selectedFormat) return false;

    const ci = classifyCreativeDeterministically(ad);
    if (selectedHook !== 'all' && ci.hookType !== selectedHook) return false;
    if (selectedAngle !== 'all' && ci.messagingAngle !== selectedAngle) return false;
    if (selectedOffer !== 'all' && ci.offerType !== selectedOffer) return false;
    if (selectedLongevity !== 'all' && ci.longevityTier !== selectedLongevity) return false;
    if (minDays > 0 && (ad.observedDays || 0) < minDays) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (ad.headline || '').toLowerCase().includes(q) ||
        (ad.primaryText || '').toLowerCase().includes(q) ||
        (ad.advertiserName || '').toLowerCase().includes(q)
      );
    }

    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCompetitorId('all');
    setSelectedSource('all');
    setSelectedFormat('all');
    setSelectedHook('all');
    setSelectedAngle('all');
    setSelectedOffer('all');
    setSelectedLongevity('all');
    setMinDays(0);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-600" />
            Katalog Intelijen Iklan & Creative
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Observasi creative iklan publik yang dinormalisasi berdasarkan hook, messaging angle, offer, dan durasi aktif
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
          <span>Menampilkan <strong className="text-slate-900">{filteredAds.length}</strong> dari {ads.length} observasi</span>
        </div>
      </div>

      {/* Filter Matrix Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        {/* Search Bar & Primary Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari teks iklan, headline, atau brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={selectedCompetitorId}
              onChange={(e) => setSelectedCompetitorId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="all">Semua Competitor</option>
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="all">Semua Sumber Data</option>
              <option value="PUBLIC_OBSERVATION">Observasi Publik</option>
              <option value="EXTERNAL_PROVIDER">Provider Eksternal</option>
              <option value="MANUAL_IMPORT">Import Manual (JSON/CSV)</option>
              <option value="SYNTHETIC_DEMO">Data Demo Sintetis</option>
            </select>
          </div>

          <div>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="all">Semua Format</option>
              <option value="video">Video Vertikal</option>
              <option value="static image">Gambar Statis</option>
              <option value="carousel">Carousel</option>
              <option value="collection">Koleksi Produk</option>
            </select>
          </div>
        </div>

        {/* Granular Dimension Filters (Hook, Angle, Offer) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Tipe Hook</label>
            <select
              value={selectedHook}
              onChange={(e) => setSelectedHook(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
            >
              <option value="all">Semua Hook</option>
              {Object.entries(HOOK_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Messaging Angle</label>
            <select
              value={selectedAngle}
              onChange={(e) => setSelectedAngle(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
            >
              <option value="all">Semua Angle</option>
              {Object.entries(ANGLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Jenis Penawaran (Offer)</label>
            <select
              value={selectedOffer}
              onChange={(e) => setSelectedOffer(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
            >
              <option value="all">Semua Offer</option>
              {Object.entries(OFFER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Durasi Terpantau (Longevity)</label>
            <select
              value={selectedLongevity}
              onChange={(e) => setSelectedLongevity(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
            >
              <option value="all">Semua Durasi</option>
              {Object.entries(LONGEVITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Reset Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={resetFilters}
            className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition underline cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      </div>

      {/* Trust Notice Banner */}
      <div className="bg-blue-50/60 border border-blue-200 p-3.5 rounded-xl text-xs text-slate-700 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Prinsip Keandalan ALCO V1.2:</strong> Seluruh observasi berasal dari data publik yang terverifikasi. Metrik privat (seperti ROAS aktual, revenue, dan spend eksak) tidak pernah diestimasi atau dipalsukan.
        </span>
      </div>

      {/* Ad Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAds.map((ad) => {
          const ci = classifyCreativeDeterministically(ad);

          return (
            <div
              key={ad.id}
              onClick={() => onSelectAd(ad)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden shadow-xs cursor-pointer transition flex flex-col justify-between group"
            >
              {/* Media Section */}
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={ad.thumbnailUrl}
                  alt={ad.headline}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <SourceBadge source={ad.observationSource} verificationLevel={ad.provenance?.verificationLevel} />
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shadow-xs ${
                    ci.longevityTier === 'high_longevity' ? 'bg-emerald-600 text-white' :
                    ci.longevityTier === 'established' ? 'bg-blue-600 text-white' :
                    ci.longevityTier === 'testing' ? 'bg-amber-500 text-white' :
                    'bg-purple-600 text-white'
                  }`}>
                    {ad.observedDays}H AKTIF
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{ad.advertiserName}</span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateIndonesian(ad.firstSeen)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition">
                    {ad.headline}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ad.primaryText}
                  </p>

                  {/* Classification Chips */}
                  <div className="flex flex-wrap gap-1 pt-1 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      Hook: {HOOK_LABELS[ci.hookType] || ci.hookType}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                      Angle: {ANGLE_LABELS[ci.messagingAngle] || ci.messagingAngle}
                    </span>
                    {ci.offerType !== 'no explicit offer' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        Offer: {OFFER_LABELS[ci.offerType] || ci.offerType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Format: {FORMAT_LABELS[ad.format] || ad.format}
                  </span>
                  <span className="text-blue-600 font-bold group-hover:translate-x-1 transition text-xs">
                    Periksa Bukti →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
