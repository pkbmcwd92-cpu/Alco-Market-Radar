import React, { useState } from 'react';
import { Competitor, FormatType, CtaType, AdObservation } from '../types/radar';
import { X, Plus, Sparkles, Upload } from 'lucide-react';

interface NewAdModalProps {
  competitors: Competitor[];
  workspaceId: string;
  onClose: () => void;
  onAddAd: (newAd: AdObservation) => void;
}

export const NewAdModal: React.FC<NewAdModalProps> = ({
  competitors,
  workspaceId,
  onClose,
  onAddAd,
}) => {
  const [competitorId, setCompetitorId] = useState(competitors[0]?.id || '');
  const [headline, setHeadline] = useState('');
  const [primaryText, setPrimaryText] = useState('');
  const [format, setFormat] = useState<FormatType>('video');
  const [cta, setCta] = useState<CtaType>('shop now');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [observedDays, setObservedDays] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorId || !primaryText.trim()) return;

    const comp = competitors.find((c) => c.id === competitorId);
    const now = new Date().toISOString();

    const newAd: AdObservation = {
      id: `ad_user_${Date.now()}`,
      workspaceId,
      competitorId,
      externalAdId: `meta_ad_live_${Math.floor(Math.random() * 900000 + 100000)}`,
      platform: 'meta',
      advertiserName: comp?.name || 'Monitored Competitor',
      pageName: comp?.metaPageId || comp?.name || 'Brand Page',
      adStatus: 'active',
      firstSeen: now,
      lastSeen: now,
      detectedAt: now,
      format,
      primaryText: primaryText.trim(),
      headline: headline.trim() || 'New Observed Promotional Angle',
      description: 'Public observation recorded by user',
      CTA: cta,
      destinationUrl: destinationUrl.trim() || comp?.website || 'https://example.com',
      landingPageId: null,
      mediaUrl: mediaUrl.trim() || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
      thumbnailUrl: mediaUrl.trim() || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
      creativeId: `cr_live_${Date.now()}`,
      observationSource: 'USER_PROVIDED',
      observedDays: Number(observedDays) || 1,
    };

    onAddAd(newAd);
    onClose();
  };

  const handleFillSample = () => {
    setHeadline('Uji Klinis 7 Hari: Niacinamide Booster pudarkan flek hitam');
    setPrimaryText('Review jujur dr. Reza SpKK: Kenapa formulasi bio-fermentasi lebih efektif meresap ke lapisan epidermis tanpa bikin purging.');
    setFormat('video');
    setCta('learn more');
    setDestinationUrl('https://example.com/clinical-trial');
    setObservedDays(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 shadow-xl text-slate-900 relative">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                Data Ingestion Service
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Ingest Ad Observation</h2>
            <p className="text-xs text-slate-500">
              Input publicly observed creative data to trigger deterministic classification & signal evaluation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Competitor / Advertiser</label>
            <select
              value={competitorId}
              onChange={(e) => setCompetitorId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              {competitors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">Headline</label>
              <button
                type="button"
                onClick={handleFillSample}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Auto-fill Sample
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. Stop Coba-coba! Perbaiki Skin Barrier Rusak"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Primary Ad Copy</label>
            <textarea
              required
              rows={3}
              placeholder="Paste the publicly observed ad copy text here..."
              value={primaryText}
              onChange={(e) => setPrimaryText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as FormatType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="video">Video</option>
                <option value="static image">Static Image</option>
                <option value="carousel">Carousel</option>
                <option value="collection">Collection</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Call To Action (CTA)</label>
              <select
                value={cta}
                onChange={(e) => setCta(e.target.value as CtaType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="shop now">Shop Now</option>
                <option value="learn more">Learn More</option>
                <option value="get offer">Get Offer</option>
                <option value="sign up">Sign Up</option>
                <option value="order now">Order Now</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Observed Days Active</label>
              <input
                type="number"
                min={1}
                max={365}
                value={observedDays}
                onChange={(e) => setObservedDays(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Destination URL</label>
              <input
                type="url"
                placeholder="https://brand.com/product"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Ingest & Analyze Ad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
