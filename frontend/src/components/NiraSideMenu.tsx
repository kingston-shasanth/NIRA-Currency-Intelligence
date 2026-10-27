import React from 'react';
import {
  X,
  Home,
  Globe,
  Volume2,
  Accessibility,
  History,
  Wifi,
  HelpCircle,
  Info,
  User,
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (destination: string) => void;
  isConnected: boolean;
}

export const NiraSideMenu: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigate,
  isConnected,
}) => {
  const { settings } = useSettings();

  if (!isOpen) return null;

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'voice', label: 'Voice Settings', icon: Volume2 },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'history', label: 'History', icon: History },
    {
      id: 'server',
      label: 'Server Connection',
      icon: Wifi,
      badge: isConnected ? 'Connected' : 'Offline',
      badgeColor: isConnected
        ? 'bg-[#1B5E3F]/30 text-[#E8DFC8] border border-[#1B5E3F]'
        : 'bg-[#991B1B]/30 text-[#FCA5A5] border border-[#991B1B]',
    },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'about', label: 'About NIRA', icon: Info },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-stretch justify-start animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="relative left-0 top-0 bottom-0 w-4/5 max-w-xs h-full bg-[#181C20] border-r border-[#2D343E] p-6 pt-safe pb-safe pl-safe flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-300 overflow-y-auto">
        <div className="space-y-6">
          {/* Header Profile Row (Screen 8) */}
          <div className="flex items-center justify-between pb-4 border-b border-[#2D343E]">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                onNavigate('profile');
                onClose();
              }}
            >
              <div className="w-12 h-12 rounded-full bg-[#232931] border border-[#D4AF37] flex items-center justify-center font-bold text-lg text-[#E8DFC8]">
                {settings.userName ? settings.userName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F5EFEB] leading-tight">
                  {settings.userName || 'User'}
                </h3>
                <span className="text-xs text-[#A0AAB5] hover:text-[#E8DFC8] transition-colors">
                  View Profile
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="touch-target p-2 text-[#A0AAB5] hover:text-white rounded-lg hover:bg-[#232931] transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Rows */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className="touch-target w-full px-3 py-3 rounded-xl flex items-center justify-between text-left text-sm font-medium text-[#F5EFEB] hover:bg-[#232931] active:bg-[#2A313A] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className="w-5 h-5 text-[#A0AAB5]" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom subtle brand */}
        <div className="pt-4 border-t border-[#2D343E] text-center">
          <p className="text-[11px] text-[#64748B]">NIRA v1.0.0 • Offline Ready</p>
        </div>
      </div>
    </div>
  );
};
