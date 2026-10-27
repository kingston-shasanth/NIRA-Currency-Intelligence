import React, { useState } from 'react';
import { ArrowLeft, Play, Square } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { SUPPORTED_LANGUAGES, getPhrases } from '../utils/i18n';
import type { SpeechLanguage } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGE_BADGES: Record<string, string> = {
  en: 'A',
  ta: 'அ',
  hi: 'अ',
  te: 'తె',
  kn: 'ಕ',
  ml: 'മ',
  bn: 'বা',
  mr: 'म',
  gu: 'ગુ',
  pa: 'ਪੰ',
  or: 'ଓ',
  ur: 'اردو',
  as: 'অ',
};

export const NiraLanguageModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { settings, updateSetting, speak, stopSpeaking } = useSettings();
  const [selectedLang, setSelectedLang] = useState<SpeechLanguage>(settings.speechLanguage || 'en');
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  if (!isOpen) return null;

  const currentPhrases = getPhrases(selectedLang);

  const handlePlaySample = () => {
    if (isPlayingSample) {
      stopSpeaking();
      setIsPlayingSample(false);
      return;
    }

    setIsPlayingSample(true);
    speak(currentPhrases.languageSelectedConfirm, selectedLang, () => {
      setIsPlayingSample(false);
    });
  };

  const handleSave = () => {
    stopSpeaking();
    updateSetting('speechLanguage', selectedLang);
    const phrases = getPhrases(selectedLang);
    speak(phrases.languageSelectedConfirm, selectedLang);
    onClose();
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
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg text-[#F5EFEB]">
          Select Language
        </h2>
      </div>

      {/* Main Content Area (Screen 10) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-md mx-auto w-full flex flex-col justify-between">
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AAB5] block">
              Primary Indian Languages
            </span>
            {SUPPORTED_LANGUAGES.filter((l) => l.isPrimary).map((l) => {
              const isSelected = selectedLang === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setSelectedLang(l.code as SpeechLanguage)}
                  className={`touch-target w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'border-[#D4AF37] bg-[#181C20] shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                      : 'border-[#2D343E] bg-[#181C20]/60 hover:bg-[#181C20]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#111417] border border-[#2D343E] flex items-center justify-center font-bold text-sm text-[#E8DFC8]">
                      {LANGUAGE_BADGES[l.code] || l.name[0]}
                    </div>
                    <div className="text-left">
                      <div className="text-base font-bold text-[#F5EFEB]">{l.nativeName}</div>
                      <div className="text-xs text-[#A0AAB5]">({l.name})</div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? 'border-[#D4AF37]' : 'border-stone-600'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AAB5] block">
              Extended Indian Languages
            </span>
            <div className="grid grid-cols-1 gap-2">
              {SUPPORTED_LANGUAGES.filter((l) => !l.isPrimary).map((l) => {
                const isSelected = selectedLang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => setSelectedLang(l.code as SpeechLanguage)}
                    className={`touch-target w-full p-3 rounded-2xl flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#181C20] shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                        : 'border-[#2D343E] bg-[#181C20]/60 hover:bg-[#181C20]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#111417] border border-[#2D343E] flex items-center justify-center font-bold text-xs text-[#E8DFC8]">
                        {LANGUAGE_BADGES[l.code] || l.name[0]}
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-bold text-[#F5EFEB]">{l.nativeName}</span>
                        <span className="text-xs text-[#A0AAB5] ml-1.5">({l.name})</span>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#D4AF37]' : 'border-stone-600'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sample Voice Container */}
          <div className="p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] flex items-center justify-between gap-3 mt-4">
            <div className="space-y-1 pr-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AAB5] block">
                Sample Voice Confirmation
              </span>
              <span className="text-xs font-medium text-[#F5EFEB] italic leading-relaxed line-clamp-2 block">
                "{currentPhrases.languageSelectedConfirm}"
              </span>
            </div>
            <button
              onClick={handlePlaySample}
              className="w-11 h-11 rounded-full bg-[#1B5E3F] hover:bg-[#154a32] text-white flex items-center justify-center shadow-md shrink-0 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              title="Play Sample Audio"
              aria-label="Play sample audio confirmation"
            >
              {isPlayingSample ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="pt-6 pb-6">
          <button
            onClick={handleSave}
            className="touch-target w-full py-3.5 rounded-xl bg-[#1B5E3F] hover:bg-[#154a32] text-white font-bold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
