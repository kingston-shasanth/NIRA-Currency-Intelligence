import React from 'react';
import { AlertCircle, RefreshCw, Settings2, Cpu } from 'lucide-react';
import { useServerConnection } from '../hooks/useServerConnection';
import { useNavigate } from 'react-router-dom';

export const ServerConnectionBanner: React.FC = () => {
  const navigate = useNavigate();
  const {
    status,
    errorMessage,
    retryConnection,
    openModal,
    latencyMs,
    isRecognitionReady,
  } = useServerConnection();

  if (status === 'connected') {
    if (!isRecognitionReady) {
      return (
        <aside
          aria-label="Model Checkpoint Unloaded Notice"
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold">
              Laptop Backend Online • Model Weights Awaiting Training
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/workbench')}
              className="touch-target px-3 py-1.5 rounded-lg bg-[#1B5E3F] hover:bg-[#154a32] text-white font-bold text-xs shadow-2xs transition-colors"
            >
              Open Workbench
            </button>
            <button
              onClick={openModal}
              className="touch-target text-xs font-bold text-amber-300 hover:underline px-2 py-1"
            >
              Diagnostics
            </button>
          </div>
        </aside>
      );
    }

    return (
      <aside
        aria-label="Server Connection Status"
        className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#181C20] border border-[#2D343E] text-[11px] text-[#F5EFEB]"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1B5E3F] animate-pulse" />
          <span className="font-semibold text-[#F5EFEB]">NIRA Inference Engine Online</span>
          {latencyMs !== null && (
            <span className="text-[#A0AAB5] font-mono">({latencyMs}ms)</span>
          )}
        </div>
        <button
          onClick={openModal}
          className="touch-target inline-flex items-center gap-1 font-bold text-[#D4AF37] hover:underline"
          title="Configure server address"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Server Dashboard</span>
        </button>
      </aside>
    );
  }

  if (status === 'connecting' || status === 'reconnecting') {
    return (
      <aside
        aria-label="Server Connection Status"
        className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#181C20] border border-amber-800/60 text-xs text-amber-200"
      >
        <div className="flex items-center gap-2.5">
          <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="font-medium">
            {status === 'reconnecting'
              ? 'Attempting to reconnect to NIRA server...'
              : 'Connecting to NIRA server...'}
          </span>
        </div>
        <button
          onClick={openModal}
          className="touch-target text-xs font-bold text-amber-300 underline px-2 py-1"
        >
          Server Settings
        </button>
      </aside>
    );
  }

  // Unavailable state
  return (
    <aside
      role="alert"
      aria-live="assertive"
      className="rounded-2xl border border-rose-900/60 bg-rose-950/40 p-4 space-y-3 text-rose-200 shadow-xs"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-rose-900/60 border border-rose-700 flex items-center justify-center text-rose-300 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="text-sm font-bold text-white">
            NIRA laptop server is not reachable
          </h3>
          <p className="text-xs text-rose-300 leading-relaxed">
            {errorMessage || 'Verify laptop hotspot or LAN connection and ensure START_NIRA.bat is running.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-rose-900/60 justify-end">
        <button
          onClick={openModal}
          className="touch-target px-3.5 py-1.5 rounded-lg border border-[#2D343E] bg-[#232931] text-xs font-bold text-[#F5EFEB] hover:bg-[#2D343E] transition-colors"
        >
          Change Server IP
        </button>
        <button
          onClick={() => retryConnection()}
          className="touch-target px-4 py-1.5 rounded-lg bg-[#1B5E3F] hover:bg-[#154a32] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    </aside>
  );
};
