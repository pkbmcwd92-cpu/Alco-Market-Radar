import React, { useState } from 'react';
import { Competitor, MarketWorkspace } from '../types/radar';
import { X, Building2, Globe, Tag, Check, Sparkles } from 'lucide-react';

interface AddCompetitorModalProps {
  workspace: MarketWorkspace;
  onClose: () => void;
  onAddCompetitor: (competitor: Competitor) => void;
}

export const AddCompetitorModal: React.FC<AddCompetitorModalProps> = ({
  workspace,
  onClose,
  onAddCompetitor,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(workspace.category || 'Skincare & Beauty');
  const [website, setWebsite] = useState('');
  const [metaPageId, setMetaPageId] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('active-tracking, direct-competitor');
  const [color, setColor] = useState('#2563EB');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const nowIso = new Date().toISOString();
    const newComp: Competitor = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: workspace.id,
      name: name.trim(),
      category: category.trim(),
      description: notes.trim() || `Competitor ${name.trim()} dipantau pada workspace ${workspace.name}.`,
      website: website.trim() || `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      metaPageId: metaPageId.trim() || undefined,
      instagramHandle: instagramHandle.trim() || undefined,
      status: 'active',
      monitoringStatus: 'monitoring',
      priority,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      notes: notes.trim(),
      firstSeen: nowIso,
      lastObserved: nowIso,
      color,
    };

    onAddCompetitor(newComp);
    onClose();
  };

  const presetColors = ['#2563EB', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Tambah Competitor Baru</h3>
              <p className="text-xs text-slate-500">
                Daftarkan brand untuk mulai memantau observasi iklan publik
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Brand / Competitor <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Skintific, Wardah, Somethinc"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategori Industri
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Skincare & Beauty"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Prioritas Monitoring
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="high">Tinggi (High)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="low">Rendah (Low)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Website / Landing Page
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://brand.com"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Meta Page ID / Username
              </label>
              <input
                type="text"
                value={metaPageId}
                onChange={(e) => setMetaPageId(e.target.value)}
                placeholder="contoh: brand.official"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tag / Label (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="direct-competitor, serum-category"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Warna Aksen Identitas
            </label>
            <div className="flex items-center gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-110 border-slate-900 ring-2 ring-blue-500/20' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Competitor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
