import React, { useState } from 'react';
import { ArrowLeft, Play, Square, AlertCircle, ChevronRight } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { SUPPORTED_LANGUAGES } from '../utils/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenLanguage?: () => void;
}

export const NiraVoiceSettingsModal: React.FC<Props> = ({ isOpen, onClose, onOpenLanguage }) => {
  const { settings, updateSetting, speak, stopSpeaking, isVoiceAvailableForLang } = useSettings();
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  if (!isOpen) return null;

  const currentLangConfig = SUPPORTED_LANGUAGES.find((l) => l.code === settings.speechLanguage) || SUPPORTED_LANGUAGES[0];
  const isVoiceInstalled = isVoiceAvailableForLang(settings.speechLanguage);

  const sampleText =
    settings.speechLanguage === 'ta'
      ? 'இது பத்து ரூபாய் நோட்டு.'
      : settings.speechLanguage === 'hi'
      ? 'यह दस रुपये का नोट है।'
      : 'This is a ten-rupee banknote.';

  const handleToggleSpeech = () => {
    const next = !settings.speechEnabled;
    updateSetting('speechEnabled', next);
    if (next) {
      speak('Speech output enabled');
    }
  };

  const handleRateChange = (rate: 'slow' | 'normal' | 'fast') => {
    updateSetting('speechRate', rate);
    speak(`Speech rate set to ${rate}`);
  };

  const handleToggleMuteDuringScanning = () => {
    updateSetting('muteDuringScanning', !settings.muteDuringScanning);
  };

  const handleToggleRepeatLastResult = () => {
    updateSetting('repeatLastResult', !settings.repeatLastResult);
  };

  const handlePlayPreview = () => {
    if (isPlayingPreview) {
      stopSpeaking();
      setIsPlayingPreview(false);
      return;
    }

    setIsPlayingPreview(true);
    speak(sampleText, settings.speechLanguage, () => {
      setIsPlayingPreview(false);
    });
  };

  const currentRate = settings.speechRate || 'normal';

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
          Voice Settings
        </h2>
      </div>

      {/* Main Content Area (Screen 10 in Image 1) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 max-w-md mx-auto w-full">
        {/* Missing Voice Notification */}
        {!isVoiceInstalled && (settings.speechLanguage === 'ta' || settings.speechLanguage === 'hi') && (
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/50 flex items-start gap-3 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                {currentLangConfig.nativeName} voice not found on device
              </span>
              <span>
                To hear natural {currentLangConfig.name} speech, open Android Settings → Accessibility → Text-to-Speech and install Google Speech voice data.
              </span>
            </div>
          </div>
        )}

        {/* 1. Speech Output Toggle */}
        <div className="p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#F5EFEB]">Speech Output</div>
            <div className="text-xs text-[#A0AAB5]">Audible currency identification</div>
          </div>
          <button
            onClick={handleToggleSpeech}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${
              settings.speechEnabled ? 'bg-[#1B5E3F]' : 'bg-stone-700'
            }`}
            aria-checked={settings.speechEnabled}
            role="switch"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.speechEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 2. Language Voice Selector Row */}
        <div
          onClick={onOpenLanguage}
          className="p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] flex items-center justify-between cursor-pointer hover:bg-[#232931] transition-colors"
        >
          <div>
            <div className="text-xs text-[#A0AAB5]">Language Voice</div>
            <div className="text-sm font-bold text-[#F5EFEB] mt-0.5">
              {currentLangConfig.name} ({currentLangConfig.speechCode})
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A0AAB5]" />
        </div>

        {/* 3. Speech Rate 3-Step Slider (Screen 10) */}
        <div className="p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#F5EFEB]">Speech Rate</span>
            <span className="text-xs font-semibold capitalize text-[#D4AF37]">
              {currentRate}
            </span>
          </div>

          <div className="relative pt-2 pb-1">
            <div className="h-2 w-full bg-[#111417] rounded-full relative">
              <div
                className="h-full bg-[#D4AF37] rounded-full transition-all"
                style={{
                  width:
                    currentRate === 'slow'
                      ? '16%'
                      : currentRate === 'normal'
                      ? '50%'
                      : '100%',
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-[#A0AAB5] mt-2">
              <button
                onClick={() => handleRateChange('slow')}
                className={`transition-colors py-1 px-2 rounded hover:text-white ${currentRate === 'slow' ? 'text-[#D4AF37] font-bold' : ''}`}
              >
                Slow
              </button>
              <button
                onClick={() => handleRateChange('normal')}
                className={`transition-colors py-1 px-2 rounded hover:text-white ${currentRate === 'normal' ? 'text-[#D4AF37] font-bold' : ''}`}
              >
                Normal
              </button>
              <button
                onClick={() => handleRateChange('fast')}
                className={`transition-colors py-1 px-2 rounded hover:text-white ${currentRate === 'fast' ? 'text-[#D4AF37] font-bold' : ''}`}
              >
                Fast
              </button>
            </div>
          </div>
        </div>

        {/* 4. Test Voice Preview Card */}
        <div className="p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] flex items-center justify-between gap-3">
          <div className="space-y-1 pr-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0AAB5] block">
              Test Voice
            </span>
            <span className="text-sm font-medium text-[#F5EFEB] italic block">
              "{sampleText}"
            </span>
          </div>
          <button
            onClick={handlePlayPreview}
            className="w-11 h-11 rounded-full bg-[#1B5E3F] hover:bg-[#154a32] text-white flex items-center justify-center shadow-md shrink-0 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            title="Test Voice Preview"
            aria-label="Test voice preview"
          >
            {isPlayingPreview ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* 5. Mute During Scanning Toggle */}
        <div className="p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#F5EFEB]">Mute During Scanning</div>
            <div className="text-xs text-[#A0AAB5]">Silence audio guidance while camera is seeking note</div>
          </div>
          <button
            onClick={handleToggleMuteDuringScanning}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${
              settings.muteDuringScanning ? 'bg-[#1B5E3F]' : 'bg-stone-700'
            }`}
            aria-checked={settings.muteDuringScanning}
            role="switch"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.muteDuringScanning ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 6. Repeat Last Result Toggle */}
        <div className="p-4 rounded-2xl bg-[#181C20] border border-[#2D343E] flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#F5EFEB]">Repeat Last Result</div>
            <div className="text-xs text-[#A0AAB5]">Show replay audio control on results</div>
          </div>
          <button
            onClick={handleToggleRepeatLastResult}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${
              settings.repeatLastResult ? 'bg-[#1B5E3F]' : 'bg-stone-700'
            }`}
            aria-checked={settings.repeatLastResult}
            role="switch"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.repeatLastResult ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
