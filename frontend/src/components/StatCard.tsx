import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  subtext?: string;
  icon: LucideIcon;
  trendText?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  accentColor?: 'green' | 'blue' | 'red' | 'gold' | 'default';
  available?: boolean;
  unavailableReason?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  trendText,
  trendType = 'positive',
  accentColor = 'green',
  available = true,
  unavailableReason = 'Awaiting data',
}) => {
  const iconColorStyles = {
    green: 'bg-[#E8F5E9] text-[#1B5E3F] border-[#C8E6C9]',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gold: 'bg-amber-50 text-amber-700 border-amber-200',
    default: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  }[accentColor];

  const trendColorStyles = {
    positive: 'text-[#1B5E3F] font-semibold',
    negative: 'text-[#DC2626] font-semibold',
    neutral: 'text-[#64748B]',
  }[trendType];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E5E9E7] bg-white p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs font-bold ${iconColorStyles}`}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
        <span className="text-xs font-semibold text-[#64748B]">
          {label}
        </span>
      </div>

      <div className="my-1">
        {available && value !== null && value !== undefined ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0F1E28] tracking-tight">
              {value}
            </span>
            {unit && <span className="text-xs font-semibold text-[#64748B]">{unit}</span>}
          </div>
        ) : (
          <div className="flex items-center gap-2 py-1 text-[#94A3B8]">
            <span className="text-2xl font-bold tracking-tight">--</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#F8FAF9] text-[#64748B] border border-[#E2E8F0]">
              {unavailableReason}
            </span>
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between text-xs">
        <span className="text-[#64748B] text-[11px] truncate">
          {subtext || 'Telemetry'}
        </span>
        {trendText && (
          <span className={`text-[11px] ${trendColorStyles}`}>
            {trendText}
          </span>
        )}
      </div>
    </div>
  );
};
