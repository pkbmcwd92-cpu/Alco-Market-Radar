import React, { useState } from 'react';
import { MarketSignal, SignalSeverity, SignalType, AdObservation } from '../../types/radar';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Filter,
  Search,
  Shield,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface SignalsViewProps {
  signals: MarketSignal[];
  allAds: AdObservation[];
  onSelectSignal: (signal: MarketSignal) => void;
  onUpdateSignalStatus: (signalId: string, status: 'active' | 'investigating' | 'acknowledged') => void;
}

export const SignalsView: React.FC<SignalsViewProps> = ({
  signals,
  allAds,
  onSelectSignal,
  onUpdateSignalStatus,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSignals = signals.filter((sig) => {
    if (selectedSeverity !== 'all' && sig.severity !== selectedSeverity) return false;
    if (selectedType !== 'all' && sig.type !== selectedType) return false;
    if (selectedStatus !== 'all' && sig.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        sig.title.toLowerCase().includes(q) ||
        sig.description.toLowerCase().includes(q) ||
        sig.triad.observed.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Market Signals & Evidence Repository
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Traceable market anomalies, creative surges, format shifts, and competitive gap opportunities
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="font-semibold text-blue-600">{signals.filter((s) => s.status === 'active').length}</span>
          <span>Active Signals</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search signals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="all">All Signal Types</option>
              <option value="CREATIVE_SURGE">Creative Surge</option>
              <option value="PATTERN_SHIFT">Pattern Shift</option>
              <option value="FORMAT_SHIFT">Format Shift</option>
              <option value="OFFER_SHIFT">Offer Shift</option>
              <option value="MARKET_GAP">Market Gap</option>
              <option value="LONGEVITY_CLUSTER">Longevity Cluster</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="investigating">Investigating</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-4">
        {filteredSignals.map((signal) => (
          <div
            key={signal.id}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-xs transition space-y-4"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  signal.severity === 'critical' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                  signal.severity === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {signal.severity}
                </span>

                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold uppercase">
                  {signal.type.replace(/_/g, ' ')}
                </span>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  signal.confidence === 'HIGH' ? 'text-emerald-700 bg-emerald-100' :
                  signal.confidence === 'MEDIUM' ? 'text-amber-700 bg-amber-100' :
                  'text-slate-600 bg-slate-100'
                }`}>
                  {signal.confidence} CONFIDENCE
                </span>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={signal.status}
                  onChange={(e) => onUpdateSignalStatus(signal.id, e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="investigating">Investigating</option>
                  <option value="acknowledged">Acknowledged</option>
                </select>
                <span className="text-slate-400 font-mono text-[11px] ml-1">
                  {new Date(signal.detectedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-base font-bold text-slate-900">{signal.title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {signal.description}
              </p>
            </div>

            {/* ALCO Triad Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-blue-600 font-bold mb-1 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <Database className="w-3.5 h-3.5" /> Observed Fact
                </div>
                <p className="text-slate-700 leading-relaxed">{signal.triad.observed}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-indigo-600 font-bold mb-1 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Logical Inference
                </div>
                <p className="text-slate-700 leading-relaxed">{signal.triad.inferred}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="text-purple-600 font-bold mb-1 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5" /> Strategic Hypothesis
                </div>
                <p className="text-slate-700 leading-relaxed">{signal.triad.hypothesis}</p>
              </div>
            </div>

            {/* Why It Matters Callout */}
            <div className="bg-amber-50/80 border border-amber-200/90 p-3 rounded-lg text-xs text-amber-900">
              <strong className="text-amber-950 font-bold">Strategic Impact:</strong> {signal.whyItMatters}
            </div>

            {/* Evidence & Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>{signal.evidence.length} Verified Evidence Points</span>
                <span>•</span>
                <span>{signal.relatedAds.length} Linked Advertisements</span>
              </div>

              <button
                onClick={() => onSelectSignal(signal)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 self-end sm:self-auto"
              >
                <span>Inspect Evidence Trail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
