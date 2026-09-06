import React from 'react';
import {
  Radar,
  Users,
  Eye,
  Layers,
  Activity,
  TrendingUp,
  Globe,
  Share2,
  FileText,
  Settings,
  ShieldCheck,
  Database,
} from 'lucide-react';

export type TabType = 
  | 'dashboard'
  | 'competitors'
  | 'ads'
  | 'creatives'
  | 'signals'
  | 'trends'
  | 'data-sources'
  | 'landing-pages'
  | 'alco-bridge'
  | 'reports'
  | 'workspaces';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeSignalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeSignalsCount,
}) => {
  const menuItems = [
    { id: 'dashboard' as TabType, label: 'Radar Dashboard', icon: Radar },
    { id: 'signals' as TabType, label: 'Market Signals', icon: Activity, badge: activeSignalsCount },
    { id: 'competitors' as TabType, label: 'Competitor Directory', icon: Users },
    { id: 'ads' as TabType, label: 'Ad Intelligence', icon: Eye },
    { id: 'creatives' as TabType, label: 'Creative Families & Longevity', icon: Layers },
    { id: 'trends' as TabType, label: 'Market Trend Engine', icon: TrendingUp },
    { id: 'data-sources' as TabType, label: 'Sumber Data & Sync', icon: Database, highlight: true },
    { id: 'landing-pages' as TabType, label: 'Landing Page Audit', icon: Globe },
    { id: 'alco-bridge' as TabType, label: 'ALCO Ads Bridge', icon: Share2 },
    { id: 'reports' as TabType, label: 'Intelligence Reports', icon: FileText },
    { id: 'workspaces' as TabType, label: 'Workspaces & Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-64px)]">
      <nav className="p-3 space-y-1 flex-grow">
        <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1.5 tracking-wider">
          Market Intelligence
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : item.highlight
                  ? 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50/60 font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isActive
                      ? 'bg-blue-600 ring-2 ring-blue-100'
                      : item.highlight
                      ? 'bg-indigo-400'
                      : 'bg-slate-300'
                  }`}
                />
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-blue-600' : item.highlight ? 'text-indigo-500' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                    isActive
                      ? 'bg-red-100 text-red-600'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {item.highlight && !isActive && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sleek Profile & Trust Mandate */}
      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/80 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            AR
          </div>
          <div className="flex-grow min-w-0">
            <div className="text-xs font-bold text-slate-800 truncate">ALCO Analyst</div>
            <div className="text-[10px] text-slate-500">Market Intelligence Pro</div>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 text-[10px] text-slate-500 space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            ALCO Trust Mandate
          </div>
          <p className="leading-relaxed">
            Public ad observation only. Never estimates unverified competitor ROAS or private targeting.
          </p>
        </div>
      </div>
    </aside>
  );
};
