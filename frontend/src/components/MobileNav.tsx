import React from 'react';
import { NavLink } from 'react-router-dom';
import { History, Scan, Settings, LayoutDashboard } from 'lucide-react';

export const MobileNav: React.FC = () => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111417]/95 backdrop-blur-lg border-t border-[#2D343E] pb-safe shadow-xl select-none"
      aria-label="Mobile Navigation"
    >
      <div className="w-full max-w-md mx-auto h-16 grid grid-cols-4 items-center px-2 gap-1.5">
        {/* 1. Scan (Primary Camera Scanner) */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `touch-target w-full flex flex-col items-center justify-center py-1 px-1 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'text-[#D4AF37] font-bold bg-[#232931] shadow-xs'
                : 'text-[#A0AAB5] hover:text-[#F5EFEB] hover:bg-[#181C20] active:scale-95'
            }`
          }
          aria-label="Scan Currency"
        >
          <Scan className="w-5 h-5 mb-0.5 shrink-0 stroke-[2.2]" />
          <span className="text-[11px] leading-tight truncate">Scan</span>
        </NavLink>

        {/* 2. History */}
        <NavLink
          to="/history"
          className={({ isActive }) =>
            `touch-target w-full flex flex-col items-center justify-center py-1 px-1 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'text-[#D4AF37] font-bold bg-[#232931] shadow-xs'
                : 'text-[#A0AAB5] hover:text-[#F5EFEB] hover:bg-[#181C20] active:scale-95'
            }`
          }
          aria-label="Scan History"
        >
          <History className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[11px] leading-tight truncate">History</span>
        </NavLink>

        {/* 3. Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `touch-target w-full flex flex-col items-center justify-center py-1 px-1 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'text-[#D4AF37] font-bold bg-[#232931] shadow-xs'
                : 'text-[#A0AAB5] hover:text-[#F5EFEB] hover:bg-[#181C20] active:scale-95'
            }`
          }
          aria-label="System Dashboard"
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[11px] leading-tight truncate">Dashboard</span>
        </NavLink>

        {/* 4. Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `touch-target w-full flex flex-col items-center justify-center py-1 px-1 rounded-xl text-xs font-semibold transition-all ${
              isActive
                ? 'text-[#D4AF37] font-bold bg-[#232931] shadow-xs'
                : 'text-[#A0AAB5] hover:text-[#F5EFEB] hover:bg-[#181C20] active:scale-95'
            }`
          }
          aria-label="Settings and Language"
        >
          <Settings className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[11px] leading-tight truncate">Settings</span>
        </NavLink>
      </div>
    </nav>
  );
};
