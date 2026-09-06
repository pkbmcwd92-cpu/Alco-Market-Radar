import React from 'react';
import { MarketWorkspace } from '../types/radar';
import { Radio, Plus, Layers, Zap, Shield, Sparkles, ChevronDown, RefreshCw, UploadCloud } from 'lucide-react';

interface NavbarProps {
  workspaces: MarketWorkspace[];
  currentWorkspace: MarketWorkspace;
  onSelectWorkspace: (ws: MarketWorkspace) => void;
  onOpenNewAdModal: () => void;
  onTriggerSurgeSimulation: () => void;
  onOpenSyncModal?: () => void;
  onOpenManualImport?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onOpenNewAdModal,
  onTriggerSurgeSimulation,
  onOpenSyncModal,
  onOpenManualImport,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-40">
      {/* Brand & Workspace Title */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-xs">
            A
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 leading-none">
                ALCO <span className="text-blue-600">RADAR</span>
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                V1.2
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
              Real Data Foundation
            </p>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Workspace Dropdown */}
        <div className="relative group">
          <div className="bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-3 cursor-pointer transition">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none hidden xs:inline">
              Workspace
            </span>
            <span className="text-sm font-semibold text-slate-800 truncate max-w-[130px] sm:max-w-[200px]">
              {currentWorkspace.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </div>

          {/* Dropdown Menu */}
          <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 hidden group-hover:block z-50">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-2.5 py-1 tracking-wider">
              Pilih Workspace Terpantau
            </div>
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => onSelectWorkspace(ws)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                  ws.id === currentWorkspace.id
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div>
                  <div>{ws.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{ws.category}</div>
                </div>
                {ws.isDemo && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                    DEMO
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center / Right: Status Pills & Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Sync Data Button */}
        {onOpenSyncModal && (
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-700 text-xs font-semibold transition shadow-2xs"
            title="Sinkronkan observasi iklan kompetitor"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sinkronkan Data</span>
          </button>
        )}

        {/* Quick Manual Import */}
        {onOpenManualImport && (
          <button
            onClick={onOpenManualImport}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-2xs"
            title="Import JSON atau CSV observasi publik"
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
            <span>Import Data</span>
          </button>
        )}

        {/* Live Simulation Trigger */}
        <button
          onClick={onTriggerSurgeSimulation}
          title="Simulasikan lonjakan peluncuran kreatif kompetitor untuk menguji deteksi radar & sintesis AI"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium transition shadow-2xs"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Simulasi Lonjakan</span>
        </button>

        {/* Ingest Ad Button */}
        <button
          onClick={onOpenNewAdModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Catat Observasi</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>
    </header>
  );
};
