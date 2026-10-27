import React, { useState } from 'react';
import { Camera, Volume2, Shield, Scan, User, ArrowRight } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { getPhrases } from '../utils/i18n';
import { NiraLogo } from './NiraLogo';
import type { SpeechLanguage } from '../types';

interface Props {
  isOpen: boolean;
  onComplete: () => void;
}

export const NiraOnboarding: React.FC<Props> = ({ isOpen, onComplete }) => {
  const { settings, updateSetting, speak } = useSettings();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedLang, setSelectedLang] = useState<SpeechLanguage>(settings.speechLanguage || 'en');
  const [nameInput, setNameInput] = useState<string>(settings.userName || '');

  if (!isOpen) return null;

  const languages: Array<{ code: SpeechLanguage; badge: string; name: string; native: string }> = [
    { code: 'en', badge: 'A', name: 'English', native: 'English' },
    { code: 'ta', badge: 'அ', name: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', badge: 'अ', name: 'Hindi', native: 'हिन्दी' },
  ];

  const handleSelectLang = (code: SpeechLanguage) => {
    setSelectedLang(code);
    updateSetting('speechLanguage', code);
    const phrases = getPhrases(code);
    speak(phrases.languageSelectedConfirm);
  };

  const handleNextStep1 = () => {
    setStep(2);
    speak('What should NIRA call you? Enter your name or tap skip.');
  };

  const handleNextStep2 = (skip: boolean) => {
    const finalName = skip ? '' : nameInput.trim();
    if (finalName) {
      updateSetting('userName', finalName);
    }
    // Speak personalized greeting now that name is known
    const phrases = getPhrases(selectedLang);
    speak(phrases.firstLaunchGreeting(finalName || undefined));
    setStep(3);
  };

  const handleAllowCamera = () => {
    updateSetting('userOnboarded', true);
    onComplete();
  };

  const handleMaybeLater = () => {
    updateSetting('userOnboarded', true);
    onComplete();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111417]/95 backdrop-blur-xl animate-in fade-in"
    >
      <div className="w-full max-w-sm bg-[#181C20] border border-[#2D343E] rounded-3xl p-6 sm:p-7 shadow-2xl text-[#F5EFEB] space-y-6">
        {/* Minimal NIRA Top Wordmark */}
        <div className="flex justify-center pb-1">
          <NiraLogo variant="gold" size="sm" showSubtitle={false} />
        </div>

        {/* SCREEN 2 — Language Selection */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1.5 text-center">
              <h2 className="text-xl font-bold text-[#F5EFEB]">
                Choose your language
              </h2>
              <p className="text-xs text-[#A0AAB5]">
                You can change this anytime in settings
              </p>
            </div>

            <div className="space-y-3">
              {languages.map((l) => {
                const isSelected = selectedLang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => handleSelectLang(l.code)}
                    className={`touch-target w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#232931] shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                        : 'border-[#2D343E] bg-[#181C20]/80 hover:bg-[#232931]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-lg bg-[#111417] border border-[#2D343E] flex items-center justify-center font-bold text-sm text-[#E8DFC8]">
                        {l.badge}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-[#F5EFEB]">{l.native}</div>
                        <div className="text-xs text-[#A0AAB5]">({l.name})</div>
                      </div>
                    </div>

                    {/* Radio Button */}
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

            <button
              onClick={handleNextStep1}
              className="touch-target w-full py-3.5 rounded-xl bg-[#1B5E3F] hover:bg-[#154a32] text-white font-bold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCREEN 3 — Name Setup */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#232931] border border-[#D4AF37] flex items-center justify-center text-[#E8DFC8]">
                <User className="w-7 h-7 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#F5EFEB]">
                  What should NIRA call you?
                </h2>
                <p className="text-xs text-[#A0AAB5]">
                  This helps us give a more personal experience.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <User className="w-4 h-4 text-[#A0AAB5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="name-input"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name (optional)"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#232931] border border-[#2D343E] text-sm font-semibold text-[#F5EFEB] placeholder-[#64748B] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                  autoFocus
                  maxLength={30}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleNextStep2(false)}
                className="touch-target w-full py-3.5 rounded-xl bg-[#1B5E3F] hover:bg-[#154a32] text-white font-bold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleNextStep2(true)}
                className="w-full py-2.5 text-xs font-semibold text-[#A0AAB5] hover:text-[#F5EFEB] transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4 — Permissions */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#232931] border border-[#2D343E] flex items-center justify-center text-[#E8DFC8] shadow-lg">
                <Camera className="w-7 h-7 stroke-[2] text-[#D4AF37]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#F5EFEB]">
                  Camera Access
                </h2>
                <p className="text-xs text-[#A0AAB5] max-w-xs">
                  NIRA needs camera access to identify Indian currency notes and coins.
                </p>
              </div>
            </div>

            {/* Benefit List */}
            <div className="space-y-3 bg-[#111417] border border-[#2D343E] rounded-2xl p-4">
              <div className="flex items-center gap-3 text-xs text-[#F5EFEB]">
                <div className="w-7 h-7 rounded-lg bg-[#1B5E3F]/30 border border-[#1B5E3F]/40 flex items-center justify-center shrink-0">
                  <Scan className="w-4 h-4 text-[#E8DFC8]" />
                </div>
                <span>Identify currency in real-time</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#F5EFEB]">
                <div className="w-7 h-7 rounded-lg bg-[#1B5E3F]/30 border border-[#1B5E3F]/40 flex items-center justify-center shrink-0">
                  <Volume2 className="w-4 h-4 text-[#E8DFC8]" />
                </div>
                <span>Speak the result for you</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#F5EFEB]">
                <div className="w-7 h-7 rounded-lg bg-[#1B5E3F]/30 border border-[#1B5E3F]/40 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-[#E8DFC8]" />
                </div>
                <span>Keep your scan history private</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleAllowCamera}
                className="touch-target w-full py-3.5 rounded-xl bg-[#1B5E3F] hover:bg-[#154a32] text-white font-bold text-base shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <span>Allow Camera Access</span>
              </button>

              <button
                onClick={handleMaybeLater}
                className="w-full py-2.5 text-xs font-semibold text-[#A0AAB5] hover:text-[#F5EFEB] transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
