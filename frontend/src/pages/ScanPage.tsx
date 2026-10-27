import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Flashlight,
  History,
  MoreVertical,
  Loader2,
  Camera as CameraIcon,
  X,
  RefreshCw,
  Settings2,
  AlertTriangle,
  WifiOff,
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useCamera } from '../hooks/useCamera';
import { useServerConnection } from '../hooks/useServerConnection';
import { api } from '../services/api';
import { audioFeedback } from '../utils/audioFeedback';
import { CurrencyNoteFrame } from '../components/CurrencyNoteFrame';
import { NiraSplashScreen } from '../components/NiraSplashScreen';
import { NiraOnboarding } from '../components/NiraOnboarding';
import { NiraThreeDotMenu } from '../components/NiraThreeDotMenu';
import { NiraSideMenu } from '../components/NiraSideMenu';
import { NiraProfileModal } from '../components/NiraProfileModal';
import { NiraLanguageModal } from '../components/NiraLanguageModal';
import { NiraVoiceSettingsModal } from '../components/NiraVoiceSettingsModal';
import { NiraHistoryModal } from '../components/NiraHistoryModal';
import { NiraResultSheet } from '../components/NiraResultSheet';
import { getPhrases } from '../utils/i18n';
import type { PredictionResponse, RecognitionRecord } from '../types';

export type ScannerState =
  | 'initializing'
  | 'offline'
  | 'connecting'
  | 'greeting'
  | 'ready'
  | 'capturing'
  | 'recognizing'
  | 'result'
  | 'rejected'
  | 'error';

export const ScanPage: React.FC = () => {
  const {
    settings,
    speak,
    speakChain,
    stopSpeaking,
    announceResult,
    triggerVibration,
    voiceAdvisory,
    dismissVoiceAdvisory,
  } = useSettings();

  const camera = useCamera();
  const {
    status: serverStatus,
    retryConnection,
    openModal: openServerModal,
  } = useServerConnection();
  const isConnected = serverStatus === 'connected';

  // Navigation / Modal States
  const [showSplash, setShowSplash] = useState<boolean>(!settings.userOnboarded);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(!settings.userOnboarded);
  const [isThreeDotOpen, setIsThreeDotOpen] = useState<boolean>(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState<boolean>(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Scanner Core States
  const [scannerState, setScannerState] = useState<ScannerState>('initializing');
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [clientTurnaroundMs, setClientTurnaroundMs] = useState<number | null>(null);
  const [, setRecentScans] = useState<RecognitionRecord[]>([]);

  // Concurrency & Session Locks (ZERO auto-scan timers or stability listeners)
  const isInferringRef = useRef<boolean>(false);
  const hasGreetedSessionRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCancelButton, setShowCancelButton] = useState<boolean>(false);

  // Debounce cancel button visual appearance to avoid 30ms flash during fast CUDA inference
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (scannerState === 'recognizing' || scannerState === 'capturing') {
      timer = setTimeout(() => setShowCancelButton(true), 300);
    } else {
      setShowCancelButton(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [scannerState]);

  // 1. Initial Launch / Onboarding Setup
  useEffect(() => {
    if (!settings.userOnboarded) {
      setShowSplash(true);
      setIsOnboardingOpen(true);
      setScannerState('initializing');
    } else {
      setShowSplash(false);
      setIsOnboardingOpen(false);
    }
  }, [settings.userOnboarded]);

  // 2. Server-Gated Lifecycle & Sequential Speech Workflow
  useEffect(() => {
    if (!settings.userOnboarded) return;

    // A. If server is disconnected / unreachable: disable camera and enter OFFLINE
    if (!isConnected) {
      hasGreetedSessionRef.current = false;
      isInferringRef.current = false;
      stopSpeaking();
      camera.stopCamera();
      setScannerState('offline');
      return;
    }

    // B. Server is connected! Start camera if not streaming
    let isMounted = true;

    camera.startCamera().then((started) => {
      if (!isMounted) return;
      if (!started) {
        setScannerState('error');
        return;
      }

      // If already greeted for this active server session, transition directly to READY
      if (hasGreetedSessionRef.current) {
        setScannerState('ready');
        return;
      }

      // Run sequential greeting sequence exactly once per connection cycle
      hasGreetedSessionRef.current = true;
      setScannerState('greeting');

      const phrases = getPhrases(settings.speechLanguage);
      speakChain(
        [
          { text: phrases.returningGreeting(settings.userName || undefined), lang: settings.speechLanguage },
          { text: phrases.tapToScan, lang: settings.speechLanguage },
        ],
        () => {
          if (isMounted) {
            setScannerState('ready');
          }
        }
      );
    });

    return () => {
      isMounted = false;
      camera.stopCamera();
      stopSpeaking();
    };
  }, [settings.userOnboarded, isConnected]);

  // 3. Reliable Single-Tap Inference Pipeline
  const runInference = useCallback(
    async (fileBlob: Blob, filename: string) => {
      if (isInferringRef.current || !isConnected) return;
      isInferringRef.current = true;
      setScannerState('recognizing');

      triggerVibration('scan');

      // Safety watchdog: ensure lock is never held longer than 8s under any circumstance
      const safetyLockTimeout = window.setTimeout(() => {
        if (isInferringRef.current) {
          console.warn('[NIRA Scanner] Safety timeout released inference lock');
          isInferringRef.current = false;
          setScannerState((prev) =>
            prev === 'recognizing' || prev === 'capturing' ? 'ready' : prev
          );
        }
      }, 8000);

      const requestStartTime = performance.now();
      try {
        const result = await api.predictBanknote(
          fileBlob,
          filename,
          true,
          'auto',
          settings.speechLanguage
        );
        const turnaround = Math.round(performance.now() - requestStartTime);
        setClientTurnaroundMs(turnaround);

        const isRejected = Boolean(result.rejected || !result.is_currency);

        if (isRejected) {
          audioFeedback.playErrorChime();
          setPrediction(result);
          setScannerState('rejected');
          announceResult(result.predicted_denomination, true, result.confidence, result.currency_type);
          return;
        }

        // Genuine Currency Recognition Flow
        audioFeedback.playSuccessChime();
        setPrediction(result);
        setScannerState('result');

        // Append to recent scans
        const newRecord: RecognitionRecord = {
          id: result.record_id || `scan_${Date.now()}`,
          timestamp: new Date().toISOString(),
          image_filename: imagePreview || 'captured_currency.jpg',
          predicted_denomination: result.predicted_denomination,
          confidence: result.confidence,
          inference_ms: result.inference_ms,
          currency_type: result.currency_type,
          safety_status: result.safety_check?.circulation_status,
        };
        setRecentScans((prev) => [newRecord, ...prev]);

        // Delay speech 300ms after chime so Android TTS doesn't clip opening phonemes
        setTimeout(() => {
          announceResult(result.predicted_denomination, false, result.confidence, result.currency_type);
        }, 300);
      } catch (err: any) {
        audioFeedback.playErrorChime();
        console.warn('[NIRA Inference] Error occurred:', err.message);
        triggerVibration('warning');

        if (
          err.message?.toLowerCase().includes('network') ||
          err.message?.toLowerCase().includes('failed to fetch')
        ) {
          setScannerState('offline');
          const phrases = getPhrases(settings.speechLanguage);
          speak(phrases.serverOffline);
        } else {
          setScannerState('ready');
        }
      } finally {
        window.clearTimeout(safetyLockTimeout);
        isInferringRef.current = false;
      }
    },
    [
      isConnected,
      settings.speechLanguage,
      imagePreview,
      speak,
      announceResult,
      triggerVibration,
    ]
  );

  // 4. Intentional User Tap Trigger (ONE tap = ONE scan)
  const handleManualScan = () => {
    // Only permit starting a scan if in READY state and server connected
    if (scannerState !== 'ready' || isInferringRef.current || !isConnected) return;

    if (camera.isActive) {
      setScannerState('capturing');
      const frame = camera.captureFrame();
      if (frame) {
        setImagePreview(frame.dataUrl);
        runInference(frame.blob, 'live_camera_capture.jpg');
      } else {
        setScannerState('ready');
      }
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Viewport tap handler
  const handleViewportTap = () => {
    // If a result or rejection is currently displayed, tapping dismisses it back to READY
    if (scannerState === 'result' || scannerState === 'rejected' || prediction !== null) {
      handleScanAgain();
      return;
    }
    // If READY, tapping triggers exactly one intentional scan
    if (scannerState === 'ready') {
      handleManualScan();
    }
  };

  // 5. Handle File Upload Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    runInference(file, file.name);
    e.target.value = '';
  };

  // 6. Actions for Result Sheet
  const handleScanAgain = () => {
    stopSpeaking();
    setPrediction(null);
    setImagePreview(null);
    setClientTurnaroundMs(null);
    isInferringRef.current = false;
    setScannerState('ready');
  };

  const handleDone = () => {
    handleScanAgain();
  };

  const handleRepeatAudio = () => {
    if (!prediction) return;
    const isRejected = prediction.rejected || !prediction.is_currency;
    announceResult(
      prediction.predicted_denomination,
      isRejected,
      prediction.confidence,
      prediction.currency_type
    );
  };

  const handleCancelScan = () => {
    stopSpeaking();
    isInferringRef.current = false;
    setScannerState('ready');
  };

  const handleOnboardingComplete = () => {
    setIsOnboardingOpen(false);
  };

  const handleMenuNavigate = (dest: string) => {
    switch (dest) {
      case 'profile':
        setIsProfileOpen(true);
        break;
      case 'language':
        setIsLanguageOpen(true);
        break;
      case 'voice':
        setIsVoiceSettingsOpen(true);
        break;
      case 'history':
        setIsHistoryOpen(true);
        break;
      case 'server':
        openServerModal();
        break;
      default:
        break;
    }
  };

  const userInitial = settings.userName?.trim()
    ? settings.userName.trim()[0].toUpperCase()
    : 'N';

  return (
    <div className="relative w-full h-[100dvh] bg-[#111417] text-[#F5EFEB] overflow-hidden select-none flex flex-col justify-between">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* SCREEN 1 — Splash */}
      {showSplash && (
        <NiraSplashScreen
          autoDismissMs={1500}
          onFinish={() => {
            setShowSplash(false);
          }}
        />
      )}

      {/* SCREENS 2, 3, 4 — Onboarding */}
      <NiraOnboarding
        isOpen={isOnboardingOpen && !showSplash}
        onComplete={handleOnboardingComplete}
      />

      {/* =========================================================================
          SCREEN: Professional Offline Screen when Server is Unreachable
         ========================================================================= */}
      {scannerState === 'offline' && (
        <div className="absolute inset-0 z-40 bg-[#111417] flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
          <div className="w-18 h-18 rounded-3xl bg-amber-950/40 border border-amber-600/50 flex items-center justify-center text-amber-300 mb-4 shadow-xl">
            <WifiOff className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-xl font-bold text-[#F5EFEB] mb-2 font-['Outfit']">
            NIRA Server Offline
          </h2>
          <p className="text-xs text-[#A0AAB5] max-w-xs leading-relaxed mb-6">
            Cannot reach the recognition server. Ensure START_NIRA.bat is running on your laptop and your phone is connected to the laptop hotspot (192.168.137.1) or Wi-Fi.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
            <button
              onClick={() => retryConnection()}
              className="touch-target w-full py-3 rounded-xl bg-[#1B5E3F] hover:bg-[#2E7D32] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
            <button
              onClick={openServerModal}
              className="touch-target w-full py-3 rounded-xl bg-[#181C20] hover:bg-[#232931] border border-[#2D343E] text-[#F5EFEB] font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Settings2 className="w-4 h-4 text-[#D4AF37]" />
              <span>Server Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          FULL SCREEN CAMERA VIEWPORT (Tap to Scan / Tap to Dismiss Result)
         ========================================================================= */}
      <div
        className="absolute inset-0 z-0 bg-black flex items-center justify-center cursor-pointer"
        onClick={handleViewportTap}
        title="Tap anywhere to scan currency"
      >
        {camera.isActive ? (
          <video
            ref={camera.setVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6 space-y-3">
            <CameraIcon className="w-12 h-12 mx-auto text-[#D4AF37] animate-pulse" />
            <p className="text-sm font-semibold text-[#A0AAB5]">
              {camera.errorMessage || (scannerState === 'offline' ? 'Server offline' : 'Camera initializing...')}
            </p>
            {scannerState !== 'offline' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  camera.startCamera();
                }}
                className="touch-target px-4 py-2 rounded-xl bg-gradient-to-r from-[#E8DFC8] to-[#D4AF37] text-[#111417] font-bold text-xs"
              >
                Start Camera
              </button>
            )}
          </div>
        )}
      </div>

      {/* Corner Bracket Reticle (Laser only sweeps during active capturing/recognizing) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <CurrencyNoteFrame
          imagePreview={imagePreview && prediction !== null ? imagePreview : null}
          isScanning={scannerState === 'capturing' || scannerState === 'recognizing'}
          isValidating={scannerState === 'recognizing'}
          isConfirmed={scannerState === 'result' && prediction !== null && !prediction.rejected}
        />
      </div>

      {/* =========================================================================
          TOP BAR OVERLAY
         ========================================================================= */}
      <header className="relative z-20 w-full px-5 pt-safe flex flex-col gap-2 pointer-events-auto mt-2">
        <div className="w-full flex items-center justify-between">
          {/* Top-Left: Avatar & Name Button */}
          <button
            onClick={() => setIsSideMenuOpen(true)}
            className="touch-target flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#181C20]/85 backdrop-blur-md border border-[#2D343E] text-white shadow-lg active:scale-95 transition-all"
            title="Open Menu"
            aria-label="User profile and navigation menu"
          >
            <div className="w-7 h-7 rounded-full bg-[#232931] border border-[#D4AF37] flex items-center justify-center font-bold text-xs text-[#E8DFC8]">
              {userInitial}
            </div>
            <span className="text-xs font-semibold text-[#F5EFEB] pr-1 truncate max-w-[110px]">
              {settings.userName || 'User'}
            </span>
          </button>

          {/* Top-Center: Identifying or Greeting Pill */}
          {scannerState === 'recognizing' || scannerState === 'capturing' ? (
            <div className="px-4 py-1.5 rounded-full bg-[#181C20]/90 backdrop-blur-md border border-[#1B5E3F] text-xs font-semibold text-[#E8DFC8] shadow-lg flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
              <span>Identifying currency...</span>
            </div>
          ) : scannerState === 'greeting' ? (
            <div className="px-4 py-1.5 rounded-full bg-[#181C20]/90 backdrop-blur-md border border-[#D4AF37]/50 text-xs font-semibold text-[#D4AF37] shadow-lg flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting to NIRA...</span>
            </div>
          ) : null}

          {/* Top-Right: Three-Dot Menu Button */}
          <button
            onClick={() => setIsThreeDotOpen(true)}
            className="touch-target w-10 h-10 rounded-full bg-[#181C20]/85 backdrop-blur-md border border-[#2D343E] flex items-center justify-center text-[#F5EFEB] shadow-lg active:scale-95 transition-all"
            title="Open Menu"
            aria-label="Open menu"
          >
            <MoreVertical className="w-5 h-5 text-[#A0AAB5]" />
          </button>
        </div>

        {/* Voice Advisory Toast (Displayed when requested language voice pack is missing) */}
        {voiceAdvisory && (
          <div className="mx-auto w-full max-w-sm px-3.5 py-2 rounded-xl bg-amber-950/90 border border-amber-600/70 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-lg backdrop-blur-md animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2 flex-1">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="leading-tight text-[11px]">{voiceAdvisory}</span>
            </div>
            <button
              onClick={dismissVoiceAdvisory}
              className="p-1 text-amber-400 hover:text-white shrink-0"
              aria-label="Dismiss voice advisory"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* =========================================================================
          BOTTOM CONTROLS BAR
         ========================================================================= */}
      <footer className="relative z-20 w-full px-6 pb-safe mb-2 flex flex-col gap-3 pointer-events-auto">
        {/* Row 1: Torch - Shutter (Tap anywhere to scan) - History */}
        <div className="flex items-center justify-between">
          {/* Torch Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              camera.toggleTorch();
            }}
            disabled={scannerState === 'offline'}
            className={`touch-target flex flex-col items-center justify-center w-14 h-14 rounded-2xl backdrop-blur-md border transition-all active:scale-95 ${
              camera.isTorchOn
                ? 'bg-[#D4AF37] border-[#D4AF37] text-[#111417] shadow-[0_0_16px_rgba(212,175,55,0.4)]'
                : 'bg-[#181C20]/85 border-[#2D343E] text-[#A0AAB5] hover:text-white disabled:opacity-40'
            }`}
            title="Toggle Torch"
            aria-label="Toggle camera flashlight"
          >
            <Flashlight className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-semibold mt-0.5">Torch</span>
          </button>

          {/* Large Shutter Button / Cancel button during scanning */}
          {(scannerState === 'recognizing' || scannerState === 'capturing') && showCancelButton ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancelScan();
              }}
              className="touch-target px-5 py-3 rounded-full bg-[#181C20]/90 backdrop-blur-md border border-[#2D343E] flex items-center gap-2 text-[#E8DFC8] font-bold text-xs shadow-xl active:scale-95 transition-all"
            >
              <X className="w-4 h-4 text-[#D4AF37]" />
              <span>Cancel</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleManualScan();
              }}
              disabled={scannerState !== 'ready' || !isConnected}
              className="touch-target group flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-40"
              title="Tap anywhere to scan"
              aria-label="Tap anywhere to scan"
            >
              {/* Outer circle */}
              <div className="w-16 h-16 rounded-full bg-[#181C20]/90 border-2 border-[#D4AF37] flex items-center justify-center shadow-xl group-hover:border-[#E8DFC8]">
                {/* Inner white shutter ring with centered Rupee glyph */}
                <div className="w-11 h-11 rounded-full bg-white/95 group-hover:bg-white shadow-inner flex items-center justify-center">
                  <span className="text-sm font-black font-['Outfit'] text-[#111417]">₹</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[#A0AAB5] mt-1">
                {scannerState === 'offline'
                  ? 'Server offline'
                  : scannerState === 'greeting'
                  ? 'Connecting...'
                  : scannerState === 'recognizing' || scannerState === 'capturing'
                  ? 'Identifying...'
                  : 'Tap anywhere to scan'}
              </span>
            </button>
          )}

          {/* History Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsHistoryOpen(true);
            }}
            className="touch-target flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-[#181C20]/85 backdrop-blur-md border border-[#2D343E] text-[#A0AAB5] hover:text-white transition-all active:scale-95"
            title="Scan History"
            aria-label="Open scan history"
          >
            <History className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] font-semibold mt-0.5">History</span>
          </button>
        </div>
      </footer>

      {/* =========================================================================
          Result Bottom Sheet / Non-Currency Feedback
         ========================================================================= */}
      <NiraResultSheet
        prediction={prediction}
        imagePreview={imagePreview}
        clientTurnaroundMs={clientTurnaroundMs}
        onScanAgain={handleScanAgain}
        onDone={handleDone}
        onRepeatAudio={handleRepeatAudio}
      />

      {/* =========================================================================
          MODALS & DRAWERS
         ========================================================================= */}
      <NiraSideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        onNavigate={handleMenuNavigate}
        isConnected={isConnected}
      />

      <NiraThreeDotMenu
        isOpen={isThreeDotOpen}
        onClose={() => setIsThreeDotOpen(false)}
        onSelectAction={(action) => {
          setIsThreeDotOpen(false);
          handleMenuNavigate(action);
        }}
      />

      <NiraProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onNavigate={(screen) => {
          setIsProfileOpen(false);
          handleMenuNavigate(screen);
        }}
      />

      <NiraLanguageModal
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
      />

      <NiraVoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />

      <NiraHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
