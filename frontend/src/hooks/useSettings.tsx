import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { AppSettings, SpeechLanguage } from '../types';
import { SUPPORTED_LANGUAGES, getPhrases, getSpokenDenomination } from '../utils/i18n';

const STORAGE_KEY = 'nira_settings_v2';
const LEGACY_STORAGE_KEY = 'nira_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  speechEnabled: true,
  speechLanguage: 'en',
  speechRate: 'normal',
  muteDuringScanning: false,
  repeatLastResult: true,
  textSize: 'standard',
  highContrast: false,
  reducedMotion: false,
  vibrationEnabled: true,
  voiceCommandsEnabled: false, // Default off to prevent permission crashes before user gesture
  autoScanEnabled: true,
  userName: '',
  deviceName: '',
  deviceId: '',
  userOnboarded: false,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
  speak: (text: string, langOverride?: SpeechLanguage, onEnd?: () => void) => void;
  stopSpeaking: () => void;
  greetUser: () => void;
  triggerVibration: (patternType: 'scan' | 'confirm' | 'warning') => void;
  announceDenomination: (
    denomination: string,
    confidencePct?: string,
    isLowConfidence?: boolean,
    safetyStatus?: string,
    hasAnomaly?: boolean,
    onEnd?: () => void
  ) => void;
  announceNaturalResult: (
    denomination: string,
    itemCount?: number,
    isRejected?: boolean,
    confidence?: number,
    currencyType?: string,
    onEnd?: () => void
  ) => void;
  announceResult: (
    denomination: string,
    isRejected?: boolean,
    confidence?: number,
    currencyType?: string,
    onEnd?: () => void
  ) => void;
  isVoiceAvailableForLang: (langCode: string) => boolean;
  voiceAdvisory: string | null;
  dismissVoiceAdvisory: () => void;
  speakChain: (
    chain: Array<{ text: string; lang?: SpeechLanguage }>,
    onComplete?: () => void
  ) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse stored settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const nativeTimeoutRef = useRef<number | null>(null);
  const [voiceAdvisory, setVoiceAdvisory] = useState<string | null>(null);

  const dismissVoiceAdvisory = useCallback(() => {
    setVoiceAdvisory(null);
  }, []);

  // Cache available browser voices on voice changes
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      try {
        const vList = window.speechSynthesis.getVoices();
        if (vList && vList.length > 0) {
          voicesRef.current = vList;
        }
      } catch {}
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Apply settings to document root for styles & accessibility
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to persist settings:', e);
    }

    const root = document.documentElement;

    // Text size class
    root.classList.remove('text-size-standard', 'text-size-large', 'text-size-xlarge');
    root.classList.add(`text-size-${settings.textSize}`);

    // High contrast class
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion class
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // Text-to-speech helper: routes through native Android TextToSpeech on Capacitor, or Web Speech API on desktop browser
  const speak = useCallback(
    (text: string, langOverride?: SpeechLanguage, onEnd?: () => void) => {
      if (!settings.speechEnabled || typeof window === 'undefined') {
        if (onEnd) onEnd();
        return;
      }

      const targetLang = langOverride || settings.speechLanguage;
      const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang);
      const speechTag = langConfig?.speechCode || `${targetLang}-IN`;

      const rateMap: Record<string, number> = {
        slow: 0.8,
        normal: 1.0,
        fast: 1.25,
      };
      const rate = rateMap[settings.speechRate || 'normal'] || 1.0;

      // 1. Native Android TTS Bridge (Physical device audio stream via MainActivity.java)
      const nativeTTS = (window as any).NativeTTS;
      if (nativeTTS && typeof nativeTTS.speak === 'function') {
        try {
          const utteranceId = 'utt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
          let completed = false;

          const finishNative = () => {
            if (completed) return;
            completed = true;
            if (nativeTimeoutRef.current) {
              window.clearTimeout(nativeTimeoutRef.current);
              nativeTimeoutRef.current = null;
            }
            if (onEnd) onEnd();
          };

          // Hard safety timeout of 5 seconds so speech failure never blocks scanning
          nativeTimeoutRef.current = window.setTimeout(finishNative, 5000);

          (window as any).__onNativeTTSEnd = (id: string, _success: boolean) => {
            if (!id || id === utteranceId) {
              finishNative();
            }
          };

          nativeTTS.stop();
          const started = nativeTTS.speak(text, speechTag, rate, utteranceId);
          if (!started) {
            console.warn('[NIRA NativeTTS] speak() returned false: voice not supported or engine busy');
            if (targetLang !== 'en') {
              const phrases = getPhrases(targetLang);
              setVoiceAdvisory(phrases.voiceUnavailableNotice);
            }
            finishNative();
          }
          return;
        } catch (nativeErr) {
          console.warn('[NIRA NativeTTS] Native speech exception, falling back:', nativeErr);
        }
      }

      // 2. Desktop Browser SpeechSynthesis fallback
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          const utterance = new SpeechSynthesisUtterance(text);
          (window as any).__niraUtterance = utterance;
          utterance.lang = speechTag;

          const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
          const matchedVoice = voices.find(
            (v) =>
              v.lang.toLowerCase() === speechTag.toLowerCase() ||
              v.lang.toLowerCase().replace('_', '-').startsWith(speechTag.toLowerCase().slice(0, 2))
          );

          if (matchedVoice) {
            utterance.voice = matchedVoice;
          } else if (targetLang !== 'en') {
            // Requested Tamil or Hindi on desktop browser, but no Indian voice installed
            console.warn(`[NIRA WebSpeech] No browser voice found for '${targetLang}' (${speechTag})`);
            const phrases = getPhrases(targetLang);
            setVoiceAdvisory(phrases.voiceUnavailableNotice);
            if (onEnd) onEnd();
            return;
          }

          utterance.rate = rate;
          utterance.pitch = 1.0;

          let completed = false;
          const safeTimeout = window.setTimeout(() => {
            if (!completed) {
              completed = true;
              (window as any).__niraUtterance = null;
              if (onEnd) onEnd();
            }
          }, 5000);

          utterance.onend = () => {
            if (!completed) {
              completed = true;
              window.clearTimeout(safeTimeout);
              (window as any).__niraUtterance = null;
              if (onEnd) onEnd();
            }
          };

          utterance.onerror = (e) => {
            console.warn('[NIRA WebSpeech] Speech synthesis warning:', e);
            if (!completed) {
              completed = true;
              window.clearTimeout(safeTimeout);
              (window as any).__niraUtterance = null;
              if (onEnd) onEnd();
            }
          };

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('[NIRA WebSpeech] Speech exception:', err);
          if (onEnd) onEnd();
        }
      } else {
        if (onEnd) onEnd();
      }
    },
    [settings.speechEnabled, settings.speechLanguage, settings.speechRate]
  );

  // Sequential speech chain: executes one utterance after another until completion
  const speakChain = useCallback(
    (
      chain: Array<{ text: string; lang?: SpeechLanguage }>,
      onComplete?: () => void
    ) => {
      if (!chain || chain.length === 0) {
        if (onComplete) onComplete();
        return;
      }
      const [current, ...remaining] = chain;
      speak(current.text, current.lang, () => {
        speakChain(remaining, onComplete);
      });
    },
    [speak]
  );

  // Check if voice for language code is installed in Android system or browser
  const isVoiceAvailableForLang = useCallback((langCode: string): boolean => {
    if (typeof window === 'undefined') return false;

    // Check Android native engine first
    const nativeTTS = (window as any).NativeTTS;
    if (nativeTTS && typeof nativeTTS.isLanguageSupported === 'function') {
      try {
        return Boolean(nativeTTS.isLanguageSupported(langCode));
      } catch {
        return false;
      }
    }

    // Fall back to browser SpeechSynthesis voices check
    if (!('speechSynthesis' in window)) return false;
    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    const speechTag = langConfig?.speechCode || `${langCode}-IN`;
    return voices.some(
      (v) =>
        v.lang.toLowerCase() === speechTag.toLowerCase() ||
        v.lang.toLowerCase().replace('_', '-').startsWith(speechTag.toLowerCase().slice(0, 2))
    );
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).NativeTTS && typeof (window as any).NativeTTS.stop === 'function') {
        try {
          (window as any).NativeTTS.stop();
        } catch {}
      }
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          (window as any).__niraUtterance = null;
        } catch {}
      }
    }
  }, []);

  // Greet user on launch using preferred name
  const greetUser = useCallback(() => {
    const phrases = getPhrases(settings.speechLanguage);
    const greetingText = phrases.greeting(settings.userName || undefined);
    speak(greetingText);
  }, [settings.speechLanguage, settings.userName, speak]);

  // Tactile vibration feedback
  const triggerVibration = useCallback(
    (patternType: 'scan' | 'confirm' | 'warning') => {
      if (!settings.vibrationEnabled || typeof window === 'undefined' || !('vibrate' in navigator)) return;
      try {
        if (patternType === 'scan') {
          navigator.vibrate([40]);
        } else if (patternType === 'confirm') {
          navigator.vibrate([60]);
        } else if (patternType === 'warning') {
          navigator.vibrate([120, 60, 120, 60, 300]);
        }
      } catch (e) {
        console.warn('Vibration not permitted or supported:', e);
      }
    },
    [settings.vibrationEnabled]
  );

  // Direct denomination announcement with model confidence & natural closing
  const announceResult = useCallback(
    (
      denomination: string,
      isRejected: boolean = false,
      confidence?: number,
      currencyType?: string,
      onEnd?: () => void
    ) => {
      const lang = settings.speechLanguage;
      const phrases = getPhrases(lang);

      if (isRejected) {
        triggerVibration('warning');
        speak(phrases.rejectedGuidance, lang, onEnd);
        return;
      }

      const spokenName = getSpokenDenomination(denomination, lang);
      const isCoin = currencyType === 'coin' || denomination.includes('Coin') || denomination.includes('Paisa');
      const rawPct = Math.round((confidence !== undefined && confidence !== null ? confidence : 0.96) * 100);
      // Never claim 100% — cap at 99, use qualitative phrasing for very high confidence
      const confPct = rawPct >= 100 ? 99 : rawPct;
      const message = phrases.successFullAnnouncement(spokenName, isCoin, confPct);
      triggerVibration('confirm');
      speak(message, lang, onEnd);
    },
    [settings.speechLanguage, speak, triggerVibration]
  );

  // Backward compatibility alias for announceNaturalResult (no counts)
  const announceNaturalResult = useCallback(
    (
      denomination: string,
      _itemCount?: number,
      isRejected: boolean = false,
      confidence?: number,
      currencyType?: string,
      onEnd?: () => void
    ) => {
      announceResult(denomination, isRejected, confidence, currencyType, onEnd);
    },
    [announceResult]
  );

  // Multilingual currency denomination and safety status announcement (full detail mode)
  const announceDenomination = useCallback(
    (
      denomination: string,
      confidencePct?: string,
      isLowConfidence: boolean = false,
      safetyStatus?: string,
      hasAnomaly: boolean = false,
      onEnd?: () => void
    ) => {
      const lang = settings.speechLanguage;
      const phrases = getPhrases(lang);
      const spokenName = getSpokenDenomination(denomination, lang);

      let message = '';
      if (isLowConfidence) {
        message = phrases.uncertainRecognition;
      } else {
        const confString = confidencePct || '99%';
        message = phrases.successRecognition(spokenName, confString);
      }

      // Legal status announced separately
      if (safetyStatus === 'withdrawn_legal_tender' || denomination.includes('2000')) {
        message += ` ${phrases.statusWithdrawn2000}`;
      } else if (safetyStatus === 'withdrawn_demonetized' || denomination.includes('25 Paisa')) {
        message += ` ${phrases.statusWithdrawn25p}`;
      } else if (safetyStatus === 'limited_legal_tender' || denomination.includes('50 Paisa')) {
        message += ` ${phrases.statusLimited50p}`;
      } else if (!isLowConfidence) {
        message += ` ${phrases.statusActive}`;
      }

      if (hasAnomaly) {
        message +=
          lang === 'ta'
            ? ' எச்சரிக்கை: படத்தில் சில தெளிவின்மை கண்டறியப்பட்டது. தொட்டுப் பார்த்து சோதிக்கவும்.'
            : lang === 'hi'
            ? ' चेतावनी: सुरक्षा विशेषताओं की स्वयं स्पर्श करके पुष्टि करें।'
            : ' Alert: Check physical tactile features manually.';
      }

      if (hasAnomaly || safetyStatus?.includes('withdrawn')) {
        triggerVibration('warning');
      } else {
        triggerVibration('confirm');
      }

      speak(message, lang, onEnd);
    },
    [settings.speechLanguage, speak, triggerVibration]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        speak,
        stopSpeaking,
        greetUser,
        triggerVibration,
        announceDenomination,
        announceNaturalResult,
        announceResult,
        isVoiceAvailableForLang,
        voiceAdvisory,
        dismissVoiceAdvisory,
        speakChain,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
