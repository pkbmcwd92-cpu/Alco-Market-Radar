import React, { useState } from 'react';
import { LandingPageObservation, Competitor } from '../../types/radar';
import { Globe, ExternalLink, Tag, DollarSign, Plus, CheckCircle2, ShieldCheck } from 'lucide-react';

interface LandingPagesViewProps {
  landingPages: LandingPageObservation[];
  competitors: Competitor[];
  onAddLandingPage: (lp: LandingPageObservation) => void;
}

export const LandingPagesView: React.FC<LandingPagesViewProps> = ({
  landingPages,
  competitors,
  onAddLandingPage,
}) => {
  const [selectedLp, setSelectedLp] = useState<LandingPageObservation | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Form state
  const [url, setUrl] = useState('');
  const [competitorId, setCompetitorId] = useState(competitors[0]?.id || '');
  const [headline, setHeadline] = useState('');
  const [offer, setOffer] = useState('');
  const [price, setPrice] = useState('');

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let parsedDomain = 'domain.com';
    try {
      parsedDomain = new URL(url.trim()).hostname;
    } catch {
      parsedDomain = url.trim().replace(/^https?:\/\//, '').split('/')[0];
    }

    const newLp: LandingPageObservation = {
      landingPageId: `lp_custom_${Date.now()}`,
      workspaceId: 'ws_id_skincare',
      competitorId,
      url: url.trim(),
      domain: parsedDomain,
      title: headline.trim() || 'Custom Observed Landing Page',
      metaDescription: 'Publicly indexed landing page destination for social ad traffic.',
      firstObserved: new Date().toISOString(),
      lastObserved: new Date().toISOString(),
      headline: headline.trim() || 'Custom Observed Landing Page',
      subheadline: 'Publicly indexed landing page destination for social ad traffic.',
      ctaText: 'Beli Sekarang',
      detectedPrice: price.trim() || null,
      detectedOffer: offer.trim() || null,
      hasSocialProof: true,
      hasGuarantee: true,
      hasUrgency: false,
      pageSections: ['Hero Banner', 'Clinical Proof Grid', 'Video Testimonials', 'Pricing Bundles', 'FAQ Accordion'],
    };

    onAddLandingPage(newLp);
    setIsAuditing(false);
    setUrl('');
    setHeadline('');
    setOffer('');
    setPrice('');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            Landing Page & Offer Observation Audit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Destination audits tracking competitor pricing, bundle structures, social proof, and post-click guarantees
          </p>
        </div>

        <button
          onClick={() => setIsAuditing(true)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Audit New Landing Page</span>
        </button>
      </div>

      {/* Grid of Observed Pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {landingPages.map((lp) => {
          const comp = competitors.find((c) => c.id === lp.competitorId);

          return (
            <div
              key={lp.landingPageId}
              onClick={() => setSelectedLp(lp)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-xs cursor-pointer transition flex flex-col justify-between group"
            >
              {/* Header Badge */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 truncate max-w-[180px]">
                  {comp?.name || lp.domain}
                </span>
                <span className="text-[10px] text-slate-500 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                  {lp.domain}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2">
                    {lp.headline}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {lp.subheadline}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs pt-1">
                    {lp.detectedPrice && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <DollarSign className="w-3 h-3" /> {lp.detectedPrice}
                      </span>
                    )}
                    {lp.detectedOffer && (
                      <span className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <Tag className="w-3 h-3" /> {lp.detectedOffer}
                      </span>
                    )}
                    {lp.hasGuarantee && (
                      <span className="flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        <ShieldCheck className="w-3 h-3" /> Guarantee
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    {lp.pageSections.length} Sections Audited
                  </span>
                  <a
                    href={lp.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs font-semibold"
                  >
                    <span>Visit Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit Detail Modal */}
      {selectedLp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-xl text-slate-900 max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs uppercase font-mono text-blue-600 font-bold">
                  Landing Page Audit Inspector
                </span>
                <h2 className="text-xl font-bold text-slate-900">{selectedLp.headline}</h2>
                <a
                  href={selectedLp.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                >
                  {selectedLp.url} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <button
                onClick={() => setSelectedLp(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Sub-headline / Value Hook</span>
                <p className="text-slate-700 text-sm">{selectedLp.subheadline}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Observed Price</span>
                  <div className="text-sm font-bold text-emerald-700 mt-1">{selectedLp.detectedPrice || 'None detected'}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Detected Offer Type</span>
                  <div className="text-sm font-bold text-blue-600 mt-1">{selectedLp.detectedOffer || 'Direct Product Purchase'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Primary Call to Action</span>
                  <div className="text-sm font-semibold text-slate-800 mt-1">{selectedLp.ctaText}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Trust Indicators</span>
                  <div className="text-xs text-slate-700 mt-1 flex items-center gap-2 font-medium">
                    {selectedLp.hasSocialProof && <span className="text-emerald-700">✓ Social Proof</span>}
                    {selectedLp.hasGuarantee && <span className="text-purple-700">✓ Guarantee</span>}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-2">Audited Page Flow Sections</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedLp.pageSections.map((sec, i) => (
                    <div key={i} className="bg-slate-50 p-2 rounded border border-slate-200 text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{sec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLp(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-medium cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Audit Modal */}
      {isAuditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl text-slate-900 text-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Audit Competitor Landing Page</h2>
            <p className="text-slate-500 mb-4">Input destination URL and primary offers observed</p>

            <form onSubmit={handleAuditSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Target Competitor</label>
                <select
                  value={competitorId}
                  onChange={(e) => setCompetitorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  {competitors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Landing Page URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://brand.com/promo"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Observed Main Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Dapatkan Kulit Glowing Dalam 14 Hari"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Offer Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Beli 2 Gratis 1"
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Price</label>
                  <input
                    type="text"
                    placeholder="e.g. Rp 149.000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  Save Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
