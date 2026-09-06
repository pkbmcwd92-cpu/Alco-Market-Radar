import React, { useState } from 'react';
import { MarketWorkspace } from '../../types/radar';
import { Settings, Plus, Layers, ShieldCheck, Database, RefreshCw, CheckCircle2 } from 'lucide-react';

interface WorkspacesViewProps {
  workspaces: MarketWorkspace[];
  currentWorkspace: MarketWorkspace;
  onSelectWorkspace: (ws: MarketWorkspace) => void;
  onAddWorkspace: (ws: MarketWorkspace) => void;
  onResetData: () => void;
}

export const WorkspacesView: React.FC<WorkspacesViewProps> = ({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onAddWorkspace,
  onResetData,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newWs: MarketWorkspace = {
      id: `ws_custom_${Date.now()}`,
      name: name.trim(),
      category: category.trim() || 'Consumer Goods',
      description: description.trim() || 'Custom monitored category workspace',
      keywords: ['social ads', 'brand', 'competitors'],
      isDemo: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onAddWorkspace(newWs);
    onSelectWorkspace(newWs);
    setIsCreating(false);
    setName('');
    setCategory('');
    setDescription('');
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Workspaces & Market Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage monitored industry verticals, tracking parameters, and ingestion settings
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Workspace</span>
        </button>
      </div>

      {/* Workspaces Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Available Workspaces ({workspaces.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workspaces.map((ws) => {
            const isSelected = ws.id === currentWorkspace.id;

            return (
              <div
                key={ws.id}
                onClick={() => onSelectWorkspace(ws)}
                className={`p-5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs shadow-2xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-blue-700 font-semibold border border-slate-200">
                      {ws.category}
                    </span>
                    {ws.isDemo && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                        DEMO SEED
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{ws.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ws.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] font-mono">
                    Keywords: {ws.keywords.slice(0, 2).join(', ')}
                  </span>
                  {isSelected ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    <span className="text-blue-600 hover:text-blue-700 font-semibold text-[11px]">
                      Switch →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Ingestion Settings & Diagnostics */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600" />
          Ingestion Engine & Observation Sources
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Public Meta Ad Library Connector</span>
              <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">CONNECTED (LIVE POLLING)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Pulls active creative records using advertiser page IDs. Normalizes copy, format, media URL, and observed first/last seen timestamps.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Deterministic Classification & Normalizer</span>
              <span className="text-blue-700 font-mono text-[10px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">ACTIVE (PASS-THROUGH)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Rules-based hook extractor, angle classifier, and offer detector running prior to any AI explanation steps.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Reset simulation cache to initial factory demo seed state
          </div>
          <button
            onClick={onResetData}
            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl text-slate-900 text-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create Market Workspace</h2>
            <p className="text-slate-500 mb-4">Define a new industry vertical or niche category</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Workspace Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fitness & Supplement Brands"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Category / Vertical</label>
                <input
                  type="text"
                  placeholder="e.g. Health & Wellness"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the target audience, key competitors, or product types..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
