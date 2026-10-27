import React, { useState } from 'react';
import {
  Wifi,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Cpu,
  Layers,
  Globe,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useServerConnection } from '../hooks/useServerConnection';

export const ServerConnectionModal: React.FC = () => {
  const {
    isModalOpen,
    closeModal,
    serverUrl,
    updateServerUrl,
    resetToDefault,
    latencyMs,
    lastConnectedAt,
    isBackendOnline,
    isRecognitionReady,
    isModelCheckpointReady,
    isInternetOnline,
    isNativeApp,
    isHotspotIsolationSuspected,
    modelStatus,
    healthData,
    retryConnection,
  } = useServerConnection();

  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isModalOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setTesting(true);
    setTestResult(null);

    try {
      const trimmed = inputUrl.trim();
      const success = await updateServerUrl(trimmed);
      if (success) {
        setTestResult({
          ok: true,
          message: 'Successfully connected to NIRA laptop server!',
        });
      } else {
        setTestResult({
          ok: false,
          message:
            'Unable to reach server. Make sure START_NIRA.bat is active on your laptop and port 8000 is permitted in firewall.',
        });
      }
    } catch {
      setTestResult({ ok: false, message: 'Connection attempt failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleReset = async () => {
    setTesting(true);
    await resetToDefault();
    setInputUrl(serverUrl);
    setTesting(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="connection-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#181C20] border border-[#2D343E] shadow-2xl p-5 sm:p-6 space-y-5 text-[#F5EFEB]">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#2D343E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#232931] border border-[#2D343E] flex items-center justify-center text-[#D4AF37] shadow-xs">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="connection-modal-title" className="text-xl font-bold text-[#F5EFEB]">
                  Server & Network Hub
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#232931] text-[#E8DFC8] border border-[#2D343E]">
                  {isNativeApp ? 'Android Client' : 'Browser Client'}
                </span>
              </div>
              <p className="text-xs text-[#A0AAB5]">
                Truthful connection diagnostics for Phone-to-Laptop inference
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="touch-target p-2 rounded-xl text-[#A0AAB5] hover:text-white hover:bg-[#232931] transition-colors"
            aria-label="Close server dashboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hotspot Client Isolation Alert */}
        {isHotspotIsolationSuspected && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Suspected Hotspot Client Isolation</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200">
              Your device has active internet access, but cannot reach the laptop at <code className="font-bold text-white">{serverUrl}</code>. Some mobile hotspots prevent phones and laptops from communicating directly. Connect both devices to a shared Wi-Fi router or run <code className="font-bold text-white">ALLOW_FIREWALL.bat</code> on your laptop.
            </p>
          </div>
        )}

        {/* 1. Truthful Multi-State Status Cards */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0AAB5] px-1">
            System & Readiness Telemetry
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* Backend API State */}
            <div className="p-3 rounded-2xl bg-[#232931] border border-[#2D343E] shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Laptop className="w-4 h-4 text-[#D4AF37]" />
                <div>
                  <span className="font-semibold block text-[#F5EFEB]">Laptop Backend</span>
                  <span className="text-[11px] text-[#A0AAB5]">
                    {isBackendOnline ? `Online (${latencyMs}ms)` : 'Offline / Unreachable'}
                  </span>
                </div>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isBackendOnline ? 'bg-[#1B5E3F] animate-pulse ring-2 ring-[#1B5E3F]/40' : 'bg-rose-500'
                }`}
              />
            </div>

            {/* Model Readiness State */}
            <div className="p-3 rounded-2xl bg-[#232931] border border-[#2D343E] shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-[#D4AF37]" />
                <div>
                  <span className="font-semibold block text-[#F5EFEB]">Model Inference</span>
                  <span className="text-[11px] text-[#A0AAB5]">
                    {isRecognitionReady
                      ? `${modelStatus?.architecture || 'ResNet-18'} Ready`
                      : isModelCheckpointReady
                      ? 'Checkpoint Loading...'
                      : 'Checkpoint Missing'}
                  </span>
                </div>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isRecognitionReady ? 'bg-[#1B5E3F] ring-2 ring-[#1B5E3F]/40' : 'bg-amber-400'
                }`}
              />
            </div>

            {/* Hardware / GPU Acceleration */}
            <div className="p-3 rounded-2xl bg-[#232931] border border-[#2D343E] shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                <div>
                  <span className="font-semibold block text-[#F5EFEB]">Hardware Device</span>
                  <span className="text-[11px] text-[#A0AAB5]">
                    {healthData?.gpu_available
                      ? healthData.gpu_name || 'NVIDIA RTX 2050 (CUDA)'
                      : healthData?.device || 'CPU Inference'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111417] border border-[#2D343E] font-bold text-[#E8DFC8]">
                {healthData?.device || 'cuda:0'}
              </span>
            </div>

            {/* Internet / Cloud Honest Status */}
            <div className="p-3 rounded-2xl bg-[#232931] border border-[#2D343E] shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="font-semibold block text-[#F5EFEB]">LAN Network</span>
                  <span className="text-[11px] text-[#A0AAB5]">
                    {isInternetOnline ? 'LAN Host Active' : 'Offline / Air-Gapped'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#111417] text-[#E8DFC8] font-bold border border-[#2D343E]">
                Local Host
              </span>
            </div>
          </div>
        </div>

        {/* 2. Last Heartbeat Banner */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#232931] border border-[#2D343E] text-xs text-[#A0AAB5]">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#A0AAB5]" />
            <span>Last successful ping:</span>
            <span className="font-mono font-medium text-[#F5EFEB]">
              {lastConnectedAt ? lastConnectedAt.toLocaleTimeString() : 'Never'}
            </span>
          </div>
          <button
            onClick={() => retryConnection()}
            disabled={testing}
            className="touch-target inline-flex items-center gap-1 font-bold text-[#D4AF37] hover:underline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>Reconnect</span>
          </button>
        </div>

        {/* 3. Editable Backend URL Form */}
        <form onSubmit={handleTestAndSave} className="space-y-3.5">
          <div className="space-y-1.5">
            <label htmlFor="server-url-input" className="block text-xs font-bold text-[#F5EFEB]">
              Configured Laptop Backend API URL
            </label>
            <div className="flex gap-2">
              <input
                id="server-url-input"
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://192.168.137.1:8000/api"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#111417] border border-[#2D343E] text-[#F5EFEB] font-mono text-xs sm:text-sm placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                disabled={testing}
                className="touch-target px-4 py-2.5 rounded-xl bg-[#1B5E3F] hover:bg-[#154a32] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                {testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{testing ? 'Testing...' : 'Test & Save'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#A0AAB5]">
              The laptop's IP is shown on the command window when running <code className="font-bold text-[#F5EFEB]">START_NIRA.bat</code>.
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[11px] text-[#A0AAB5]">Presets:</span>
            <button
              type="button"
              onClick={() => setInputUrl('http://192.168.137.1:8000/api')}
              className="touch-target px-2.5 py-1.5 rounded-lg bg-[#232931] border border-[#2D343E] font-mono text-[11px] text-[#E8DFC8] font-bold hover:border-[#D4AF37] active:border-[#D4AF37]"
              title="Default Windows Mobile Hotspot IP for OPPO F25 Pro"
            >
              Hotspot: 192.168.137.1:8000
            </button>
            <button
              type="button"
              onClick={() => setInputUrl('http://10.3.3.206:8000/api')}
              className="touch-target px-2.5 py-1.5 rounded-lg bg-[#232931] border border-[#2D343E] font-mono text-[11px] text-[#E8DFC8] hover:border-[#D4AF37]"
              title="Campus Wi-Fi LAN IP"
            >
              Wi-Fi: 10.3.3.206:8000
            </button>
            <button
              type="button"
              onClick={() => setInputUrl('http://localhost:8000/api')}
              className="touch-target px-2.5 py-1.5 rounded-lg bg-[#232931] border border-[#2D343E] font-mono text-[11px] text-[#E8DFC8] hover:border-[#D4AF37]"
            >
              localhost:8000
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="touch-target text-[11px] text-[#A0AAB5] underline hover:text-[#F5EFEB] ml-auto"
            >
              Reset to Auto
            </button>
          </div>

          {testResult && (
            <div
              className={`rounded-xl p-3 text-xs flex items-start gap-2 ${
                testResult.ok
                  ? 'bg-[#1B5E3F]/30 text-[#E8DFC8] border border-[#1B5E3F]'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-[#2D343E]">
          <button
            type="button"
            onClick={closeModal}
            className="touch-target px-6 py-2.5 rounded-xl bg-[#1B5E3F] hover:bg-[#154a32] text-white text-xs font-bold transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
