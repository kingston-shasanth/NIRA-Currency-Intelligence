import React, { useState } from 'react';
import {
  Settings,
  Volume2,
  Type,
  RotateCcw,
  Smartphone,
  Server,
  User,
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useServerConnection } from '../hooks/useServerConnection';
import { getPhrases } from '../utils/i18n';
import type { TextSizeOption } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSetting, resetSettings, speak } = useSettings();
  const connection = useServerConnection();

  const [inputName, setInputName] = useState(settings.userName || '');
  const [nameSavedNotice, setNameSavedNotice] = useState(false);

  const handleSaveName = () => {
    updateSetting('userName', inputName.trim());
    setNameSavedNotice(true);
    setTimeout(() => setNameSavedNotice(false), 2500);
    const phrases = getPhrases(settings.speechLanguage);
    speak(phrases.greeting(inputName.trim() || undefined));
  };

  const handleClearName = () => {
    setInputName('');
    updateSetting('userName', '');
    setNameSavedNotice(true);
    setTimeout(() => setNameSavedNotice(false), 2500);
  };

  const handleTestSpeech = () => {
    const phrases = getPhrases(settings.speechLanguage);
    speak(phrases.greeting(settings.userName || undefined));
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8 text-[#0F1E28]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F1E28] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#1B5E3F]" />
          <span>Accessibility & Language Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Tailor speech announcements, preferred name, Indian languages, high contrast, and haptics.
        </p>
      </div>

      {/* Preferred Name Personalization Card */}
      <section className="rounded-2xl border border-[#E5E9E7] bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#F1F5F9]">
          <User className="w-5 h-5 text-[#1B5E3F]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            User Personalization & Name
          </h2>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="settings-name-input" className="text-sm font-semibold text-[#0F1E28] block">
              Preferred Name
            </label>
            <span className="text-xs text-[#64748B]">
              NIRA uses your preferred name for personalized spoken greetings on startup. Stored only on this device.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="settings-name-input"
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
              className="flex-1 p-2.5 rounded-xl bg-[#F8FAF9] border border-[#CBD5E1] text-sm font-semibold text-[#0F1E28] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#1B5E3F] focus:border-[#1B5E3F] focus:outline-none"
            />
            <button
              onClick={handleSaveName}
              className="touch-target px-4 py-2.5 rounded-xl bg-[#1B5E3F] hover:bg-[#154a32] text-white text-xs font-bold transition-colors"
            >
              Save
            </button>
            {settings.userName && (
              <button
                onClick={handleClearName}
                className="touch-target px-3 py-2.5 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F1E28] text-xs font-bold transition-colors"
                title="Remove saved name"
              >
                Clear
              </button>
            )}
          </div>

          {nameSavedNotice && (
            <p className="text-xs font-semibold text-emerald-700">
              ✓ Name preference updated successfully.
            </p>
          )}
        </div>
      </section>

      {/* Voice & Speech Section */}
      <section className="rounded-2xl border border-[#E5E9E7] bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#F1F5F9]">
          <Volume2 className="w-5 h-5 text-[#1B5E3F]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Voice Announcements & Speech
          </h2>
        </div>

        {/* Enable Speech Toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <label htmlFor="speech-toggle" className="text-sm font-semibold text-[#0F1E28] block">
              Auditory Denomination Feedback
            </label>
            <span className="text-xs text-[#64748B]">
              Speak detected banknote or coin denomination automatically upon capture.
            </span>
          </div>
          <button
            id="speech-toggle"
            role="switch"
            aria-checked={settings.speechEnabled}
            onClick={() => updateSetting('speechEnabled', !settings.speechEnabled)}
            className={`touch-target w-12 h-6 rounded-full transition-colors relative p-0.5 border ${
              settings.speechEnabled
                ? 'bg-[#1B5E3F] border-[#1B5E3F]'
                : 'bg-stone-200 border-stone-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                settings.speechEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Tactile Vibration Feedback Toggle */}
        <div className="flex items-center justify-between py-2 border-t border-[#F1F5F9]">
          <div>
            <label htmlFor="vibration-toggle" className="text-sm font-semibold text-[#0F1E28] block">
              Tactile Vibration Feedback
            </label>
            <span className="text-xs text-[#64748B]">
              Haptic pulse confirmation on scan, with warning vibration for invalid captures.
            </span>
          </div>
          <button
            id="vibration-toggle"
            role="switch"
            aria-checked={settings.vibrationEnabled}
            onClick={() => updateSetting('vibrationEnabled', !settings.vibrationEnabled)}
            className={`touch-target w-12 h-6 rounded-full transition-colors relative p-0.5 border ${
              settings.vibrationEnabled
                ? 'bg-[#1B5E3F] border-[#1B5E3F]'
                : 'bg-stone-200 border-stone-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Mobile Speech Language Note */}
        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Spoken Assistant Language
            </span>
            <span className="text-xs text-[#64748B]">
              Configured directly from your mobile scanner interface (Top Menu → Select Language).
            </span>
          </div>
          <button
            onClick={handleTestSpeech}
            className="touch-target px-4 py-2 rounded-xl bg-[#1B5E3F] text-white hover:bg-[#154a32] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Voice</span>
          </button>
        </div>
      </section>

      {/* Visual & Typography Section */}
      <section className="rounded-2xl border border-[#E5E9E7] bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#F1F5F9]">
          <Type className="w-5 h-5 text-[#1B5E3F]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Display & Typography Sizing
          </h2>
        </div>

        {/* Text Size Selector */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            Interface Text Scaling
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'standard' as TextSizeOption, label: 'Standard', size: '16px' },
              { key: 'large' as TextSizeOption, label: 'Large', size: '18px' },
              { key: 'xlarge' as TextSizeOption, label: 'Extra Large', size: '20px' },
            ].map((item) => {
              const isSelected = settings.textSize === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => updateSetting('textSize', item.key)}
                  className={`touch-target p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-[#E8F5E9] border-[#1B5E3F] text-[#1B5E3F] font-bold shadow-2xs'
                      : 'bg-[#F8FAF9] border-[#E2E8F0] text-[#64748B] hover:border-stone-300'
                  }`}
                >
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className="text-[10px] text-[#64748B]">{item.size} base</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* High Contrast Mode Toggle */}
        <div className="flex items-center justify-between py-2 border-t border-[#F1F5F9]">
          <div>
            <label htmlFor="contrast-toggle" className="text-sm font-semibold text-[#0F1E28] block">
              High-Contrast Theme
            </label>
            <span className="text-xs text-[#64748B]">
              Maximizes luminance contrast with deep aubergine-black backgrounds and bold text.
            </span>
          </div>
          <button
            id="contrast-toggle"
            role="switch"
            aria-checked={settings.highContrast}
            onClick={() => updateSetting('highContrast', !settings.highContrast)}
            className={`touch-target w-12 h-6 rounded-full transition-colors relative p-0.5 border ${
              settings.highContrast
                ? 'bg-[#1B5E3F] border-[#1B5E3F]'
                : 'bg-stone-200 border-stone-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                settings.highContrast ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between py-2 border-t border-[#F1F5F9]">
          <div>
            <label htmlFor="motion-toggle" className="text-sm font-semibold text-[#0F1E28] block">
              Reduced Motion
            </label>
            <span className="text-xs text-[#64748B]">
              Suppresses decorative transitions and pulses for vestibular comfort.
            </span>
          </div>
          <button
            id="motion-toggle"
            role="switch"
            aria-checked={settings.reducedMotion}
            onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
            className={`touch-target w-12 h-6 rounded-full transition-colors relative p-0.5 border ${
              settings.reducedMotion
                ? 'bg-[#1B5E3F] border-[#1B5E3F]'
                : 'bg-stone-200 border-stone-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                settings.reducedMotion ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Laptop Model Server Connection Section */}
      <section className="rounded-2xl border border-[#E5E9E7] bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-[#1B5E3F]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Laptop Model Server Connectivity
            </h2>
          </div>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
              connection.status === 'connected'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : connection.status === 'unavailable'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connection.status === 'connected'
                  ? 'bg-emerald-600'
                  : connection.status === 'unavailable'
                  ? 'bg-rose-600'
                  : 'bg-amber-600 animate-spin'
              }`}
            />
            <span className="capitalize">{connection.status}</span>
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#F8FAF9] border border-[#E2E8F0]">
            <div>
              <p className="font-bold text-[#0F1E28]">Configured Laptop Server Endpoint</p>
              <p className="font-mono text-[#64748B] text-[11px] break-all">{connection.serverUrl}</p>
            </div>
            {connection.latencyMs !== null && (
              <span className="text-[11px] font-mono font-semibold text-[#1B5E3F] bg-[#E8F5E9] px-2 py-0.5 rounded self-start sm:self-auto border border-[#C8E6C9]">
                {connection.latencyMs}ms ping
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[#64748B] text-[11px]">
            <span>
              Last successful ping:{' '}
              <strong className="text-[#0F1E28]">
                {connection.lastConnectedAt ? connection.lastConnectedAt.toLocaleTimeString() : 'Never'}
              </strong>
            </span>
            <button
              onClick={connection.openModal}
              className="touch-target font-bold text-[#1B5E3F] hover:underline"
            >
              Open Connection Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Target Device & Local Persistence Info */}
      <section className="rounded-2xl border border-[#E5E9E7] bg-white p-5 text-xs space-y-2 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#0F1E28] font-semibold">
            <Smartphone className="w-4 h-4 text-[#1B5E3F]" />
            <span>Target Calibration: Mobile Android & PWA</span>
          </div>
          <span className="text-[10px] text-[#1B5E3F] px-2 py-0.5 rounded bg-[#E8F5E9] border border-[#C8E6C9] font-semibold">
            NIRA v1.0
          </span>
        </div>
        <p className="text-[#64748B] leading-relaxed">
          Preferences are persistently stored locally (<code className="text-[#0F1E28] bg-[#F1F5F9] px-1 py-0.5 rounded">localStorage</code>) and take effect immediately across all routes.
        </p>

        <div className="pt-2">
          <button
            onClick={resetSettings}
            className="touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] text-xs font-semibold transition-colors border border-[#CBD5E1]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Preferences</span>
          </button>
        </div>
      </section>
    </div>
  );
};
