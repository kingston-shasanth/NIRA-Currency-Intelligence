import React from 'react';
import {
  Globe,
  Volume2,
  Accessibility,
  Wifi,
  HelpCircle,
  Info,
  ShieldCheck,
  ChevronRight,
  X,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (
    action:
      | 'language'
      | 'voice'
      | 'accessibility'
      | 'server'
      | 'help'
      | 'about'
      | 'privacy'
  ) => void;
}

export const NiraThreeDotMenu: React.FC<Props> = ({ isOpen, onClose, onSelectAction }) => {
  if (!isOpen) return null;

  const menuItems = [
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'voice', label: 'Voice Settings', icon: Volume2 },
    { id: 'accessibility', label: 'Accessibility', icon: Accessibility },
    { id: 'server', label: 'Server Connection', icon: Wifi },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'about', label: 'About NIRA', icon: Info },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
  ] as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/70 backdrop-blur-sm p-4 pt-14 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[270px] bg-[#181C20] border border-[#2D343E] rounded-3xl p-3 shadow-2xl text-[#F5EFEB] space-y-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#2D343E] mb-1">
          <span className="font-bold text-xs uppercase tracking-wider text-[#A0AAB5]">
            Menu
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#A0AAB5] hover:text-white hover:bg-[#232931] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                onClose();
                onSelectAction(item.id);
              }}
              className="touch-target w-full px-3.5 py-3 rounded-2xl flex items-center justify-between hover:bg-[#232931] text-[#F5EFEB] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#A0AAB5]" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
