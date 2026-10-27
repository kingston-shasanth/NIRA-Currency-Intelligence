import React, { useState } from 'react';
import {
  ArrowLeft,
  Globe,
  Volume2,
  Accessibility,
  Wifi,
  Sliders,
  HelpCircle,
  Info,
  ChevronRight,
  Edit2,
  Check,
  Smartphone,
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useServerConnection } from '../hooks/useServerConnection';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: 'language' | 'voice' | 'accessibility' | 'server' | 'help' | 'about') => void;
}

export const NiraProfileModal: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
  const { settings, updateSetting } = useSettings();
  const { status, isRecognitionReady } = useServerConnection();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(settings.userName || '');
  const [deviceNameValue, setDeviceNameValue] = useState(settings.deviceName || '');
  const [deviceSaved, setDeviceSaved] = useState(false);

  if (!isOpen) return null;

  const initial = settings.userName?.trim() ? settings.userName.trim()[0].toUpperCase() : 'N';
  const displayName = settings.userName?.trim() || 'NIRA User';

  const handleSaveName = () => {
    updateSetting('userName', nameValue.trim());
    setIsEditingName(false);
  };

  const handleSaveDeviceName = () => {
    updateSetting('deviceName', deviceNameValue.trim());
    setDeviceSaved(true);
    setTimeout(() => setDeviceSaved(false), 2000);
  };

  const getLanguageLabel = () => {
    if (settings.speechLanguage === 'ta') return 'தமிழ் (Tamil)';
    if (settings.speechLanguage === 'hi') return 'हिन्दी (Hindi)';
    return 'English';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-[#111417] text-[#F5EFEB] animate-in slide-in-from-right duration-200"
    >
      {/* Top Header Bar */}
      <div className="h-16 border-b border-[#2D343E] px-4 flex items-center gap-3 pt-safe">
        <button
          onClick={onClose}
          className="touch-target p-2 rounded-xl text-[#A0AAB5] hover:text-white hover:bg-[#181C20] transition-colors"
          aria-label="Back to Camera"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-['Outfit'] font-black text-lg text-[#F5EFEB]">
          Profile & Settings
        </h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 w-full max-w-md sm:mx-auto">
        {/* User Card */}
        <div className="p-4 rounded-3xl bg-[#181C20] border border-[#2D343E] flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#232931] border-2 border-[#D4AF37] text-[#E8DFC8] font-['Outfit'] font-black text-2xl flex items-center justify-center shadow-md shrink-0">
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#111417] border border-[#D4AF37] text-sm font-bold text-[#F5EFEB] focus:outline-none"
                  autoFocus
                  maxLength={25}
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 rounded-lg bg-[#1B5E3F] hover:bg-[#2E7D32] text-white"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div>
                <h3 className="font-['Outfit'] font-bold text-lg text-[#F5EFEB] truncate">
                  {displayName}
                </h3>
                <button
                  onClick={() => {
                    setNameValue(settings.userName || '');
                    setIsEditingName(true);
                  }}
                  className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Device Identity Card */}
        <div className="p-4 rounded-3xl bg-[#181C20] border border-[#2D343E] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#A0AAB5]">Device Name</span>
            </div>
            <span className="text-[10px] text-[#E8DFC8] font-semibold bg-[#111417] px-2 py-0.5 rounded-full border border-[#2D343E]">
              Client Identity
            </span>
          </div>
          <p className="text-[11px] text-[#A0AAB5]">
            Name displayed in the NIRA desktop dashboard when connected over LAN Wi-Fi or hotspot.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={deviceNameValue}
              onChange={(e) => setDeviceNameValue(e.target.value)}
              placeholder="e.g. Karthik's Phone (or Unnamed)"
              className="flex-1 px-3 py-2 rounded-xl bg-[#111417] border border-[#2D343E] text-xs font-semibold text-[#F5EFEB] focus:outline-none focus:border-[#D4AF37]"
              maxLength={30}
            />
            <button
              onClick={handleSaveDeviceName}
              className="touch-target px-4 py-2 rounded-xl bg-[#1B5E3F] hover:bg-[#2E7D32] text-white text-xs font-bold transition-all shadow-xs"
            >
              Save
            </button>
          </div>
          {deviceSaved && (
            <p className="text-[11px] text-[#34D399] font-semibold">✓ Device name saved</p>
          )}
        </div>

        {/* Settings Navigation List (Screen 9) */}
        <div className="space-y-2">
          {/* Language */}
          <button
            onClick={() => onNavigate('language')}
            className="touch-target w-full p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] hover:border-[#D4AF37]/40 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Globe className="w-5 h-5 text-[#D4AF37]" />
              <div className="text-left">
                <div className="text-sm font-bold text-[#F5EFEB]">Language</div>
                <div className="text-xs text-[#A0AAB5]">{getLanguageLabel()}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A0AAB5]" />
          </button>

          {/* Voice Settings */}
          <button
            onClick={() => onNavigate('voice')}
            className="touch-target w-full p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] hover:border-[#D4AF37]/40 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Volume2 className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm font-bold text-[#F5EFEB]">Voice Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A0AAB5]" />
          </button>

          {/* Accessibility */}
          <button
            onClick={() => onNavigate('accessibility')}
            className="touch-target w-full p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] hover:border-[#D4AF37]/40 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Accessibility className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm font-bold text-[#F5EFEB]">Accessibility</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A0AAB5]" />
          </button>

          {/* Server Connection */}
          <button
            onClick={() => onNavigate('server')}
            className="touch-target w-full p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] hover:border-[#D4AF37]/40 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Wifi className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm font-bold text-[#F5EFEB]">Server Connection</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  status === 'connected' && isRecognitionReady
                    ? 'bg-[#1B5E3F]/40 text-[#E8DFC8] border border-[#1B5E3F]'
                    : 'bg-amber-950/40 text-amber-300 border border-amber-800'
                }`}
              >
                {status === 'connected' && isRecognitionReady ? 'Connected' : 'Offline'}
              </span>
              <ChevronRight className="w-4 h-4 text-[#A0AAB5]" />
            </div>
          </button>

          {/* App Settings */}
          <button
            onClick={() => onNavigate('accessibility')}
            className="touch-target w-full p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] hover:border-[#D4AF37]/40 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Sliders className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm font-bold text-[#F5EFEB]">App Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A0AAB5]" />
          </button>

          {/* Help & Support */}
          <button
            onClick={() => onNavigate('help')}
            className="touch-target w-full p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] hover:border-[#D4AF37]/40 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <HelpCircle className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm font-bold text-[#F5EFEB]">Help & Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A0AAB5]" />
          </button>

          {/* About NIRA */}
          <button
            onClick={() => onNavigate('about')}
            className="touch-target w-full p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] hover:border-[#D4AF37]/40 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <Info className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-sm font-bold text-[#F5EFEB]">About NIRA</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A0AAB5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
