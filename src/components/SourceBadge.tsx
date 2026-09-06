import React from 'react';
import { ObservationSource, VerificationLevel } from '../types/radar';
import { OBSERVATION_SOURCE_LABELS } from '../utils/labels';
import { Database, Globe, UploadCloud, Cpu, ShieldCheck } from 'lucide-react';

interface SourceBadgeProps {
  source: ObservationSource;
  verificationLevel?: VerificationLevel;
  className?: string;
  showVerification?: boolean;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  source,
  verificationLevel,
  className = '',
  showVerification = false,
}) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Database;

  switch (source) {
    case 'META_ADS_LIBRARY':
    case 'PUBLIC_OBSERVATION':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      Icon = Globe;
      break;
    case 'EXTERNAL_PROVIDER':
      badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      Icon = ShieldCheck;
      break;
    case 'MANUAL_IMPORT':
    case 'USER_PROVIDED':
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
      Icon = UploadCloud;
      break;
    case 'SYNTHETIC_DEMO':
      badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
      Icon = Cpu;
      break;
  }

  const label = OBSERVATION_SOURCE_LABELS[source] || source;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeStyle} ${className}`}
      title={`Sumber: ${label}${verificationLevel ? ` (${verificationLevel})` : ''}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}</span>
      {showVerification && verificationLevel && (
        <span className="opacity-75 text-[10px] ml-0.5">• {verificationLevel}</span>
      )}
    </span>
  );
};
