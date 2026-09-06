import React, { useState } from 'react';
import { AdObservation, Competitor, FormatType, HookType, MessagingAngle, OfferType, LongevityTier } from '../../types/radar';
import { filterAds, classifyCreativeDeterministically } from '../../services/radarEngine';
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
} from 'lucide-react';

interface AdsViewProps {
  ads: AdObservation[];
  competitors: Competitor[];
  onSelectAd: (ad: AdObservation) => void;
}

export const AdsView: React.FC<AdsViewProps> = ({ ads, competitors, onSelectAd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<FormatType | 'all'>('all');
  const [selectedHook, setSelectedHook] = useState<HookType | 'all'>('all');
  const [selectedAngle, setSelectedAngle] = useState<MessagingAngle | 'all'>('all');
  const [selectedOffer, setSelectedOffer] = useState<OfferType | 'all'>('all');
  const [selectedLongevity, setSelectedLongevity] = useState<LongevityTier | 'all'>('all');
  const [minDays, setMinDays] = useState<number>(0);

  const filteredAds = filterAds(ads, {
    searchQuery,
    competitorId: selectedCompetitorId,
    format: selectedFormat,
    hookType: selectedHook,
    messagingAngle: selectedAngle,
    offerType: selectedOffer,
    longevityTier: selectedLongevity,
    minDays: minDays > 0 ? minDays : undefined,
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCompetitorId('all');
    setSelectedFormat('all');
    setSelectedHook('all');
    setSelectedAngle('all');
    setSelectedOffer('all');
    setSelectedLongevity('all');
    setMinDays(0);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-600" />
            Ad Intelligence Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Public creative observations normalized across hooks, messaging angles, offers, and longevity
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span>Showing <strong className="text-slate-900">{filteredAds.length}</strong> of {ads.length} ads</span>
        </div>
      </div>

      {/* Filter Matrix Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
        {/* Search Bar & Primary Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search copy, hook, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <select
              value={selectedCompetitorId}
              onChange={(e) => setSelectedCompetitorId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="all">All Competitors</option>
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="all">All Formats</option>
              <option value="video">Vertical Video</option>
              <option value="static image">Static Image</option>
              <option value="carousel">Carousel</option>
            </select>
          </div>

          <div>
            <select
              value={selectedLongevity}
              onChange={(e) => setSelectedLongevity(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="all">All Longevity Tiers</option>
              <option value="new_detected">New Detected (≤7 days)</option>
              <option value="testing">Testing (8-21 days)</option>
              <option value="established">Established (22-60 days)</option>
              <option value="high_longevity">High Longevity (60+ days)</option>
            </select>
          </div>
        </div>

        {/* Granular Dimension Filters (Hook, Angle, Offer) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Hook Type</label>
            <select
              value={selectedHook}
              onChange={(e) => setSelectedHook(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
            >
              <option value="all">Any Hook</option>
              <option value="problem">Problem</option>
              <option value="authority">Authority</option>
              <option value="result">Result / Proof</option>
              <option value="testimonial">Testimonial</option>
              <option value="curiosity">Curiosity</option>
              <option value="educational">Educational</option>
              <option value="offer-led">Offer-Led</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Messaging Angle</label>
            <select
              value={selectedAngle}
              onChange={(e) => setSelectedAngle(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
            >
              <option value="all">Any Angle</option>
              <option value="pain point">Pain Point</option>
              <option value="transformation">Transformation</option>
              <option value="price/value">Price / Value</option>
              <option value="social proof">Social Proof</option>
              <option value="trust">Trust / Safety</option>
              <option value="quality">Quality / Origin</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Offer Type</label>
            <select
              value={selectedOffer}
              onChange={(e) => setSelectedOffer(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:bg-white"
            >
              <option value="all">Any Offer</option>
              <option value="bundle">Bundle / Package</option>
              <option value="discount">Direct Discount</option>
              <option value="free shipping">Free Shipping</option>
              <option value="bonus">Bonus / Free Gift</option>
              <option value="no explicit offer">No Explicit Offer</option>
            </select>
          </div>
        </div>

        {/* Filter Reset Button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={resetFilters}
            className="text-[11px] text-slate-500 hover:text-blue-600 transition underline cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Trust Notice Banner */}
      <div className="bg-blue-50/60 border border-blue-200 p-3 rounded-lg text-[11px] text-slate-600 flex items-center gap-2">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>ALCO Public Intelligence Notice:</strong> All metrics represent verifiable public observation days. Spend, ROAS, and audience targeting remain strictly unknown and are never fabricated.
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
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-xs cursor-pointer transition flex flex-col justify-between group"
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
                  <span className="bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white uppercase font-semibold">
                    {ad.format}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shadow-xs ${
                    ci.longevityTier === 'high_longevity' ? 'bg-emerald-600 text-white' :
                    ci.longevityTier === 'established' ? 'bg-blue-600 text-white' :
                    ci.longevityTier === 'testing' ? 'bg-amber-500 text-white' :
                    'bg-purple-600 text-white'
                  }`}>
                    {ad.observedDays}D ACTIVE
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{ad.advertiserName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ad.firstSeen).toLocaleDateString()}
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
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      Hook: {ci.hookType}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                      Angle: {ci.messagingAngle}
                    </span>
                    {ci.offerType !== 'no explicit offer' && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        Offer: {ci.offerType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="uppercase text-[10px] font-semibold tracking-wider text-slate-500">
                    CTA: {ad.CTA}
                  </span>
                  <span className="text-blue-600 font-semibold group-hover:translate-x-1 transition text-xs">
                    Inspect Ad Details →
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
