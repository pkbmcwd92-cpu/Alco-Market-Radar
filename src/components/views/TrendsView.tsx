import React, { useState } from 'react';
import { MarketTrendMetric } from '../../types/radar';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, BarChart3, Activity, PieChart } from 'lucide-react';

interface TrendsViewProps {
  trends: MarketTrendMetric[];
}

const DIMENSION_LABELS: Record<string, string> = {
  all: 'Semua Dimensi',
  format: 'Format',
  hook: 'Hook',
  angle: 'Angle',
  offer: 'Offer',
};

export const TrendsView: React.FC<TrendsViewProps> = ({ trends }) => {
  const [selectedDimension, setSelectedDimension] = useState<string>('all');

  const filteredTrends = trends.filter((t) => {
    if (selectedDimension === 'all') return true;
    return t.dimension === selectedDimension;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Mesin Tren Pasar (Market Trend Engine)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pergeseran makro, adopsi format, saturasi hook, dan transisi penawaran di seluruh kategori pasar
          </p>
        </div>

        {/* Dimension Filter */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs text-xs">
          {['all', 'format', 'hook', 'angle', 'offer'].map((dim) => (
            <button
              key={dim}
              onClick={() => setSelectedDimension(dim)}
              className={`px-3 py-1.5 rounded-md uppercase font-semibold transition cursor-pointer ${
                selectedDimension === dim ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {DIMENSION_LABELS[dim] || dim}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-medium">Pola Naik Tercepat</div>
          <div className="text-lg font-bold text-emerald-700 mt-1">Video Demo Singkat (Short-Form)</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-mono font-bold text-emerald-700">+25 pp</span>
            <span>pertumbuhan dibanding 30 hari sebelumnya</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-medium">Strategi Offer Paling Dominan</div>
          <div className="text-lg font-bold text-blue-700 mt-1">Bundling Solusi Lengkap</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-mono font-bold text-blue-700">+19 pp</span>
            <span>diadopsi oleh 4 dari 5 competitor</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-slate-500 text-xs font-medium">Angle yang Menurun</div>
          <div className="text-lg font-bold text-rose-700 mt-1">Diskon Langsung Tanpa Nilai Tambah</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-mono font-bold text-rose-700">-12 pp</span>
            <span>bergeser ke bonus uji coba / konsultasi</span>
          </div>
        </div>
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTrends.map((trend, idx) => {
          const isPositive = trend.deltaPercentagePoints > 0;
          const isNegative = trend.deltaPercentagePoints < 0;

          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {DIMENSION_LABELS[trend.dimension] || trend.dimension}
                    </span>
                    <span className="text-xs text-slate-500">
                      {trend.competitorBreadthCount} Competitor Aktif
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{trend.name}</h3>
                </div>

                <div className="text-right">
                  <div className={`font-mono text-lg font-bold flex items-center justify-end gap-1 ${
                    isPositive ? 'text-emerald-700' : isNegative ? 'text-rose-700' : 'text-slate-600'
                  }`}>
                    {isPositive ? <ArrowUpRight className="w-5 h-5" /> : isNegative ? <ArrowDownRight className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    <span>{isPositive ? `+${trend.deltaPercentagePoints}` : trend.deltaPercentagePoints} pp</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Perubahan 30 hari</div>
                </div>
              </div>

              {/* Progress Bar / Comparative visualizer */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Periode Sebelumnya: <strong className="text-slate-700">{trend.previousPeriodPct}%</strong></span>
                  <span>Periode Saat Ini: <strong className="text-slate-900 font-bold">{trend.currentPeriodPct}%</strong></span>
                </div>

                {/* Dual bar */}
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 flex gap-1 border border-slate-200">
                  <div
                    className="h-full bg-slate-300 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, trend.previousPeriodPct)}%` }}
                    title={`Sebelumnya: ${trend.previousPeriodPct}%`}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isPositive ? 'bg-emerald-600' : 'bg-rose-600'}`}
                    style={{ width: `${Math.min(100, trend.currentPeriodPct)}%` }}
                    title={`Saat ini: ${trend.currentPeriodPct}%`}
                  />
                </div>
              </div>

              {trend.interpretation && (
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <p className="leading-relaxed">{trend.interpretation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
