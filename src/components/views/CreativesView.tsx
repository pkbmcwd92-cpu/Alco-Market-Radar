import React, { useState } from 'react';
import { CreativeFamily, AdObservation, Competitor } from '../../types/radar';
import { classifyCreativeDeterministically } from '../../services/radarEngine';
import {
  Layers,
  Clock,
  Sparkles,
  Target,
  Megaphone,
  Tag,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ChevronRight,
  Send,
} from 'lucide-react';

interface CreativesViewProps {
  families: CreativeFamily[];
  ads: AdObservation[];
  competitors: Competitor[];
  onSelectAd: (ad: AdObservation) => void;
}

export const CreativesView: React.FC<CreativesViewProps> = ({
  families,
  ads,
  competitors,
  onSelectAd,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<CreativeFamily | null>(null);
  const [activeTab, setActiveTab] = useState<'families' | 'longevity' | 'deconstruct'>('families');

  // Deconstruct Studio State
  const [inputHeadline, setInputHeadline] = useState('');
  const [inputCopy, setInputCopy] = useState('');
  const [inputCta, setInputCta] = useState('shop now');
  const [isDeconstructing, setIsDeconstructing] = useState(false);
  const [deconstructResult, setDeconstructResult] = useState<any | null>(null);

  const competitorMap = new Map(competitors.map((c) => [c.id, c.name]));

  // Longevity Buckets
  const newAds = ads.filter((a) => (a.observedDays || 1) <= 7);
  const testingAds = ads.filter((a) => (a.observedDays || 1) > 7 && (a.observedDays || 1) <= 21);
  const establishedAds = ads.filter((a) => (a.observedDays || 1) > 21 && (a.observedDays || 1) <= 60);
  const highLongevityAds = ads.filter((a) => (a.observedDays || 1) > 60);

  const handleRunDeconstruct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCopy.trim()) return;

    setIsDeconstructing(true);
    try {
      const res = await fetch('/api/gemini/deconstruct-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: inputHeadline.trim() || 'Untitled Creative',
          primaryText: inputCopy.trim(),
          cta: inputCta,
          format: 'video',
        }),
      });
      const data = await res.json();
      if (data.data) {
        setDeconstructResult(data.data);
      }
    } catch (err) {
      console.error('Failed to deconstruct creative:', err);
    } finally {
      setIsDeconstructing(false);
    }
  };

  const handleFillPreset = (presetType: 'skincare' | 'coffee' | 'edtech') => {
    if (presetType === 'skincare') {
      setInputHeadline('Flek Hitam Menahun Pudar Dalam 14 Hari Tanpa Pengelupasan Kasar');
      setInputCopy('Formula biomimetik pertama di Indonesia yang diuji langsung oleh 15 dermatologist independen. Mengunci kelembapan dan menenangkan barrier kulit yang rusak akibat produk abal-abal.');
      setInputCta('shop now');
    } else if (presetType === 'coffee') {
      setInputHeadline('Sensasi Specialty Coffee Shop di Rumah: Hemat 80% Pengeluaran Kafe');
      setInputCopy('Biji kopi arabika Flores single origin grade 1 dengan roasting profil medium. Fresh roast setiap Selasa dan Kamis.');
      setInputCta('order now');
    } else {
      setInputHeadline('Ditolak 40 Kali Kerja? Kuasai Data Analytics Praktis Dalam 12 Minggu');
      setInputCopy('Bukan sekadar teori. Pelajari SQL, Python, dan Tableau langsung dari Senior Data Lead Unicorn dengan garansi review portfolio hingga tembus interview.');
      setInputCta('learn more');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            Creative Families & Longevity Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Clustered concept variations, duration analysis, and semantic angle deconstruction
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('families')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'families' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Creative Families ({families.length})
          </button>
          <button
            onClick={() => setActiveTab('longevity')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'longevity' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Longevity Tiers ({ads.length})
          </button>
          <button
            onClick={() => setActiveTab('deconstruct')}
            className={`px-3 py-1.5 rounded-md font-semibold transition flex items-center gap-1 ${
              activeTab === 'deconstruct' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Deconstruct
          </button>
        </div>
      </div>

      {/* TAB 1: CREATIVE FAMILIES */}
      {activeTab === 'families' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {families.map((fam) => {
              const repAd = ads.find((a) => a.id === fam.representativeCreativeId) || ads.find((a) => fam.memberAdIds.includes(a.id));
              const compName = competitorMap.get(fam.competitorId) || 'Competitor';

              return (
                <div
                  key={fam.familyId}
                  onClick={() => setSelectedFamily(fam)}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-xs cursor-pointer transition flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">
                          {compName}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition mt-0.5">
                          {fam.name}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {fam.memberAdIds.length} Variations
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {fam.description}
                    </p>

                    {/* Shared Dimensions */}
                    <div className="grid grid-cols-3 gap-1.5 text-[11px] pt-1">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Hook</span>
                        <span className="font-semibold text-slate-800 capitalize truncate block">{fam.commonHook}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Angle</span>
                        <span className="font-semibold text-slate-800 capitalize truncate block">{fam.commonAngle}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Offer</span>
                        <span className="font-semibold text-slate-800 capitalize truncate block">{fam.commonOffer}</span>
                      </div>
                    </div>

                    {/* Representative Creative Thumbnail preview */}
                    {repAd && (
                      <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <img
                          src={repAd.thumbnailUrl}
                          alt={repAd.headline}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover rounded bg-white border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1 text-xs">
                          <div className="text-slate-400 text-[10px]">Representative variation:</div>
                          <div className="text-slate-900 font-medium truncate">{repAd.headline}</div>
                          <div className="text-purple-600 text-[10px] font-bold">
                            {repAd.observedDays} days observed
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Avg Longevity: <strong className="text-slate-900">{fam.averageLongevityDays}d</strong></span>
                    <span className="text-blue-600 font-semibold group-hover:translate-x-1 transition flex items-center gap-1">
                      Inspect Variations <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Family Details Modal / Drawer */}
          {selectedFamily && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full p-6 shadow-xl text-slate-900 max-h-[90vh] flex flex-col">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs uppercase text-blue-600 font-bold">
                      Creative Family Variations
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">{selectedFamily.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedFamily.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFamily(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 py-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-700">
                    Observed Variations in this Cluster ({selectedFamily.memberAdIds.length})
                  </div>

                  <div className="space-y-2">
                    {ads
                      .filter((a) => selectedFamily.memberAdIds.includes(a.id))
                      .map((ad) => (
                        <div
                          key={ad.id}
                          onClick={() => {
                            setSelectedFamily(null);
                            onSelectAd(ad);
                          }}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-3 flex items-center justify-between gap-3 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={ad.thumbnailUrl}
                              alt={ad.headline}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{ad.headline}</h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{ad.primaryText}</p>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                CTA: {ad.CTA} • Format: {ad.format}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                              {ad.observedDays}d active
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setSelectedFamily(null)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LONGEVITY TIERS */}
      {activeTab === 'longevity' && (
        <div className="space-y-6">
          {/* Longevity Principle Box */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <strong className="text-blue-900 font-bold block">
                ALCO Longevity Intelligence Methodology
              </strong>
              <p>
                When a competitor keeps an ad running for 60+ days, it represents a strong <em>strategic importance hypothesis</em>: the advertiser continuously funds delivery. However, public observation cannot verify conversion volume, target audience sizes, or return on ad spend (ROAS).
              </p>
            </div>
          </div>

          {/* 4 Longevity Columns / Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. High Longevity */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-emerald-700">High Longevity</h3>
                  <span className="text-[10px] text-slate-400 font-medium">60+ Days Active</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  {highLongevityAds.length}
                </span>
              </div>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {highLongevityAds.map((ad) => (
                  <div
                    key={ad.id}
                    onClick={() => onSelectAd(ad)}
                    className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800">{ad.advertiserName}</span>
                      <span className="text-emerald-700 font-bold">{ad.observedDays}d</span>
                    </div>
                    <div className="text-xs font-medium text-slate-900 line-clamp-1">{ad.headline}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Established */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-blue-700">Established</h3>
                  <span className="text-[10px] text-slate-400 font-medium">22 - 60 Days</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                  {establishedAds.length}
                </span>
              </div>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {establishedAds.map((ad) => (
                  <div
                    key={ad.id}
                    onClick={() => onSelectAd(ad)}
                    className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800">{ad.advertiserName}</span>
                      <span className="text-blue-700 font-bold">{ad.observedDays}d</span>
                    </div>
                    <div className="text-xs font-medium text-slate-900 line-clamp-1">{ad.headline}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Testing */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-amber-700">Testing</h3>
                  <span className="text-[10px] text-slate-400 font-medium">8 - 21 Days</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                  {testingAds.length}
                </span>
              </div>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {testingAds.map((ad) => (
                  <div
                    key={ad.id}
                    onClick={() => onSelectAd(ad)}
                    className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:border-amber-300 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800">{ad.advertiserName}</span>
                      <span className="text-amber-700 font-bold">{ad.observedDays}d</span>
                    </div>
                    <div className="text-xs font-medium text-slate-900 line-clamp-1">{ad.headline}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Newly Detected */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-purple-700">New Detected</h3>
                  <span className="text-[10px] text-slate-400 font-medium">≤ 7 Days</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                  {newAds.length}
                </span>
              </div>
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {newAds.map((ad) => (
                  <div
                    key={ad.id}
                    onClick={() => onSelectAd(ad)}
                    className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 hover:border-purple-300 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800">{ad.advertiserName}</span>
                      <span className="text-purple-700 font-bold">{ad.observedDays}d</span>
                    </div>
                    <div className="text-xs font-medium text-slate-900 line-clamp-1">{ad.headline}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE AI DECONSTRUCT STUDIO */}
      {activeTab === 'deconstruct' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Creative Angle Deconstruction Engine
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit an observed ad copy to have the Gemini API deconstruct the psychological hook, messaging angle, and offer structure.
              </p>
            </div>

            {/* Quick Sample Fillers */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 text-[11px]">Load Sample:</span>
              <button
                type="button"
                onClick={() => handleFillPreset('skincare')}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
              >
                Skincare
              </button>
              <button
                type="button"
                onClick={() => handleFillPreset('coffee')}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
              >
                Coffee
              </button>
              <button
                type="button"
                onClick={() => handleFillPreset('edtech')}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium"
              >
                EdTech
              </button>
            </div>

            <form onSubmit={handleRunDeconstruct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Stop Coba-coba! 14 Hari Skin Barrier Pulih"
                  value={inputHeadline}
                  onChange={(e) => setInputHeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Primary Ad Copy</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste ad copy..."
                  value={inputCopy}
                  onChange={(e) => setInputCopy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Call To Action</label>
                <input
                  type="text"
                  value={inputCta}
                  onChange={(e) => setInputCta(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isDeconstructing}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>{isDeconstructing ? 'Analyzing with Gemini...' : 'Deconstruct Creative'}</span>
              </button>
            </form>
          </div>

          {/* Right: Deconstructed Output Display */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Deconstruction Analysis Output</h3>
                {deconstructResult && (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {deconstructResult.hookConfidence} Confidence
                  </span>
                )}
              </div>

              {!deconstructResult ? (
                <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Submit copy on the left or load a sample to inspect semantic hooks and psychological angles.</p>
                </div>
              ) : (
                <div className="py-4 space-y-4 text-xs">
                  {/* Detected Dimensions Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Detected Hook</div>
                      <div className="text-base font-bold text-blue-700 capitalize mt-0.5">
                        {deconstructResult.detectedHook}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Messaging Angle</div>
                      <div className="text-base font-bold text-indigo-700 capitalize mt-0.5">
                        {deconstructResult.detectedAngle}
                      </div>
                    </div>
                  </div>

                  {/* Observable Summary */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Observable Summary</div>
                    <p className="text-slate-800 leading-relaxed">
                      {deconstructResult.observableSummary}
                    </p>
                  </div>

                  {/* AI Reasoning / Mechanism */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">
                      Psychological Mechanism & Reasoning
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {deconstructResult.reasoning}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400">
              ALCO Gemini Service • Model: gemini-2.5-flash
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
