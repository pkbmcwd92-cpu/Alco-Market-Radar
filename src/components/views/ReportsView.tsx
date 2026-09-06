import React, { useState } from 'react';
import { MarketWorkspace, Competitor, AdObservation, MarketSignal, CreativeFamily } from '../../types/radar';
import { FileText, Download, Copy, Printer, Check, Sparkles, Activity, ShieldCheck } from 'lucide-react';

interface ReportsViewProps {
  workspace: MarketWorkspace;
  competitors: Competitor[];
  ads: AdObservation[];
  signals: MarketSignal[];
  creativeFamilies: CreativeFamily[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  workspace,
  competitors,
  ads,
  signals,
  creativeFamilies,
}) => {
  const [reportType, setReportType] = useState<'weekly' | 'competitor' | 'creative'>('weekly');
  const [copied, setCopied] = useState(false);

  const activeSignals = signals.filter((s) => s.status === 'active');
  const highLongevityAds = ads.filter((a) => a.observedDays >= 45);

  const generateMarkdown = () => {
    return `# ALCO MARKET RADAR INTELLIGENCE BRIEF
**Category**: ${workspace.name} (${workspace.category})
**Date**: ${new Date().toLocaleDateString()}
**Generated**: ${new Date().toISOString()}

---

## 1. EXECUTIVE SUMMARY
In the monitored window, ${competitors.length} competitors were tracked across ${ads.length} public advertisements. A total of ${signals.length} market signals were detected, of which ${activeSignals.length} remain active.

## 2. KEY OBSERVED SIGNALS
${activeSignals.map((s, i) => `### ${i + 1}. ${s.title}
- **Severity**: ${s.severity.toUpperCase()}
- **Confidence**: ${s.confidence}
- **Observed**: ${s.triad.observed}
- **Inferred**: ${s.triad.inferred}
- **Strategic Hypothesis**: ${s.triad.hypothesis}
- **Impact**: ${s.whyItMatters}
`).join('\n')}

## 3. CREATIVE LONGEVITY INSIGHTS
${highLongevityAds.map((a) => `- **${a.advertiserName}** ("${a.headline}"): Active for ${a.observedDays} observed days. (Format: ${a.format}, CTA: ${a.CTA})`).join('\n')}

---
*Notice: ALCO Market Radar operates solely on public observation data. Financial metrics and target audiences are never fabricated.*
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Intelligence Briefs & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Exportable executive summaries, audit logs, and strategic market briefings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <button
          onClick={() => setReportType('weekly')}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            reportType === 'weekly' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-2xs'
          }`}
        >
          Weekly Executive Radar Digest
        </button>
        <button
          onClick={() => setReportType('competitor')}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            reportType === 'competitor' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-2xs'
          }`}
        >
          Competitor Velocity Watch
        </button>
        <button
          onClick={() => setReportType('creative')}
          className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            reportType === 'creative' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-2xs'
          }`}
        >
          Creative Longevity & Angle Audit
        </button>
      </div>

      {/* Formatted Printable Report Paper */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 text-slate-800 max-w-4xl mx-auto print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
        {/* Report Header */}
        <div className="border-b border-slate-100 pb-5 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-blue-600 font-mono tracking-wider">ALCO</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                INTELLIGENCE BRIEF
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">{workspace.name}</h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Category: <strong className="text-slate-800">{workspace.category}</strong> • Date: {new Date().toLocaleDateString()}
            </div>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <div>Confidentiality: Tier 1</div>
            <div>Source: Public Meta Inventory</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
            1. Executive Market Summary
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            During the active monitoring window, <strong>{competitors.length} competitors</strong> deployed a total of <strong>{ads.length} unique public ad observations</strong>. The deterministic signal engine emitted <strong>{signals.length} actionable signals</strong>, highlighted by significant format convergence into vertical UGC demonstration and clinical authority endorsements.
          </p>
        </div>

        {/* Active Signals Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
            2. High Priority Market Signals
          </h3>
          <div className="space-y-3">
            {activeSignals.map((sig, i) => (
              <div key={sig.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {i + 1}. {sig.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {sig.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-600">{sig.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-blue-600 font-bold block">Observed:</span>
                    <span className="text-slate-700">{sig.triad.observed}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-indigo-600 font-bold block">Inferred:</span>
                    <span className="text-slate-700">{sig.triad.inferred}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Longevity Audit Table */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
            3. Creative Longevity Benchmarks (45+ Days Observed)
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Advertiser</th>
                  <th className="p-2.5">Headline Concept</th>
                  <th className="p-2.5">Format</th>
                  <th className="p-2.5">Days Active</th>
                  <th className="p-2.5">Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {highLongevityAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-50/60">
                    <td className="p-2.5 font-semibold text-slate-900">{ad.advertiserName}</td>
                    <td className="p-2.5 max-w-xs truncate">{ad.headline}</td>
                    <td className="p-2.5 uppercase font-mono text-[10px] text-slate-600">{ad.format}</td>
                    <td className="p-2.5 font-mono font-bold text-purple-700">{ad.observedDays}d</td>
                    <td className="p-2.5 text-[11px] text-slate-500">Continuous budget hypothesis</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust Principle Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>ALCO Trust Mandate: All facts derived from verifiable public sources.</span>
          </div>
          <div>Report generated via ALCO Market Radar MVP</div>
        </div>
      </div>
    </div>
  );
};
