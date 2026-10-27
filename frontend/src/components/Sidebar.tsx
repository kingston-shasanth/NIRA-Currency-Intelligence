import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  History,
  Database,
  Coins,
  Cpu,
  Server,
  Smartphone,
  Activity,
  Settings,
  Smartphone as PhoneIcon,
  Wifi,
} from 'lucide-react';
import { useServerConnection } from '../hooks/useServerConnection';

export interface NavItemDef {
  to: string;
  label: string;
  icon: React.ElementType;
}

export const DESKTOP_NAV_ITEMS: NavItemDef[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/analytics', label: 'Scan Analytics', icon: BarChart3 },
  { to: '/history', label: 'Recognition History', icon: History },
  { to: '/dashboard/dataset', label: 'Dataset Explorer', icon: Database },
  { to: '/dashboard/classes', label: 'Currency Classes', icon: Coins },
  { to: '/dashboard/model', label: 'Model & Training', icon: Server },
  { to: '/workbench', label: 'Model Workbench', icon: Cpu },
  { to: '/dashboard/devices', label: 'Connected Devices', icon: Smartphone },
  { to: '/dashboard/system-health', label: 'System Health', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { status, isRecognitionReady } = useServerConnection();
  const isConnected = status === 'connected';
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#E5E9E7] bg-white p-4 shrink-0 min-h-[calc(100vh-4rem)] justify-between select-none">
      {/* 10 Navigation Items (Desktop Reference Image 2) */}
      <nav className="space-y-1" aria-label="Desktop Navigation">
        {DESKTOP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1B5E3F] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0F1E28] hover:bg-[#F1F5F9]'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Telemetry Card & Mobile App CTA (Desktop Reference Image 2) */}
      <div className="pt-4 space-y-3">
        {/* Backend Status Box */}
        <div className="rounded-2xl bg-[#F8FAF9] p-3.5 border border-[#E5E9E7] text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-[#0F1E28]">
            <span className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-[#1B5E3F]" />
              <span>Backend Status</span>
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-semibold ${isConnected ? 'text-[#1B5E3F]' : 'text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#1B5E3F] animate-pulse' : 'bg-red-500'}`} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-[#64748B] pt-1 border-t border-[#E5E9E7]/80">
            <div className="flex justify-between">
              <span>API:</span>
              <span className="font-mono text-[#0F1E28]">192.168.137.1:8000</span>
            </div>
            <div className="flex justify-between">
              <span>Dashboard:</span>
              <span className="font-mono text-[#0F1E28]">localhost:5173</span>
            </div>
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="font-semibold text-[#1B5E3F]">
                ResNet-18 ({isRecognitionReady ? 'Loaded' : 'Ready'})
              </span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="font-mono text-[#0F1E28]">drishti.db (SQLite)</span>
            </div>
          </div>
        </div>

        {/* Green "Open Mobile App" CTA Button */}
        <button
          onClick={() => navigate('/')}
          className="touch-target w-full py-2.5 rounded-xl bg-[#1B5E3F] hover:bg-[#2E7D32] text-white font-bold text-xs shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <PhoneIcon className="w-4 h-4" />
          <span>Open Mobile App</span>
        </button>
      </div>
    </aside>
  );
};
