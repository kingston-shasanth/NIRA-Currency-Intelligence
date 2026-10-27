import React from 'react';
import { Search, Bell, AlertCircle } from 'lucide-react';
import { NiraLogo } from './NiraLogo';
import { useServerConnection } from '../hooks/useServerConnection';
import { useSettings } from '../hooks/useSettings';

export const Header: React.FC = () => {
  const { status, isRecognitionReady, openModal } = useServerConnection();
  const isConnected = status === 'connected';
  const { settings } = useSettings();

  const userName = settings.userName?.trim() || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E9E7] bg-white text-[#0F1E28]">
      <div className="w-full px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Minimal Geometric NIRA Wordmark (Desktop Reference) */}
        <div className="flex items-center gap-3 shrink-0">
          <NiraLogo variant="light" size="md" showSubtitle={true} />
        </div>

        {/* Center: Search Bar (Desktop Reference) */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scans, denominations, or files..."
              className="w-full pl-10 pr-16 py-2 rounded-xl bg-[#F8FAF9] border border-[#E2E8F0] text-xs font-medium text-[#0F1E28] placeholder-[#94A3B8] focus:outline-none focus:border-[#1B5E3F] focus:ring-1 focus:ring-[#1B5E3F] transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] text-[10px] font-semibold text-[#64748B] shadow-2xs">
                Ctrl K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: Status Pill, Notifications, User Profile (Desktop Reference) */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Backend Online / Model Ready Pill */}
          <button
            onClick={openModal}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all ${
              isConnected
                ? 'bg-[#E8F5E9] text-[#1B5E3F] border-[#C8E6C9]'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
            title="Server Connection Details"
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#1B5E3F] animate-pulse" />
                <span>Backend Online</span>
                <span className="text-[#64748B] font-normal hidden lg:inline">
                  • Model Ready ({isRecognitionReady ? '99.25%' : 'Loading'})
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Backend Disconnected</span>
              </>
            )}
          </button>

          {/* Notification Bell */}
          <button
            className="relative p-2 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F1E28] transition-colors"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0]">
            <div className="w-8 h-8 rounded-full bg-[#1B5E3F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {userInitial}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-[#0F1E28]">{userName}</span>
              <span className="text-[10px] text-[#64748B] font-medium">Administrator</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
