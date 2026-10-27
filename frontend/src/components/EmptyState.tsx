import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-2xl border border-[#1E352F] bg-[#162320] shadow-xs ${
        compact ? 'p-6' : 'p-8 sm:p-12'
      }`}
    >
      <div className="w-13 h-13 rounded-2xl bg-[#0B1F1A] border border-[#1E352F] flex items-center justify-center text-[#00C853] mb-3.5 shadow-xs">
        <Icon className="w-6 h-6 text-[#00C853]" aria-hidden="true" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 font-['Outfit']">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#9EABA7] max-w-md leading-relaxed mb-5">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="touch-target inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00C853] hover:bg-[#00B048] text-black text-xs sm:text-sm font-bold transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C853]"
        >
          {action.icon && <action.icon className="w-4 h-4" aria-hidden="true" />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
