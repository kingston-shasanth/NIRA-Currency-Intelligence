import React from 'react';

interface StatusBadgeProps {
  label: string;
  status: 'online' | 'offline' | 'warning' | 'neutral' | 'active' | 'error';
  pulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  status,
  pulse = true,
}) => {
  const normalizedStatus =
    status === 'active' ? 'online' : status === 'error' ? 'offline' : status;

  const colors = {
    online: {
      bg: 'bg-[#E8F5E9] border-[#C8E6C9] text-[#1B5E3F] font-semibold',
      dot: 'bg-[#1B5E3F]',
    },
    offline: {
      bg: 'bg-red-50 border-red-200 text-red-600 font-semibold',
      dot: 'bg-red-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700 font-semibold',
      dot: 'bg-amber-500',
    },
    neutral: {
      bg: 'bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B] font-medium',
      dot: 'bg-[#94A3B8]',
    },
  }[normalizedStatus] || {
    bg: 'bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B]',
    dot: 'bg-[#94A3B8]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${colors.bg}`}
      role="status"
      aria-label={`Status: ${label}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && normalizedStatus === 'online' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`} />
      </span>
      <span>{label}</span>
    </span>
  );
};
