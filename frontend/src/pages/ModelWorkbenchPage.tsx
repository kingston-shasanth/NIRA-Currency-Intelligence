import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  FolderCheck,
  Split,
  Layers,
  Thermometer,
  HardDrive,
  Activity,
  Award,
  Sparkles,
  RefreshCw,
  Terminal,
  FileCheck,
  FolderPlus,
} from 'lucide-react';
import { api } from '../services/api';
import type {
  TrainingStatusResponse,
  DatasetAuditResponse,
  CheckpointInfo,
  EvaluationResults,
} from '../types';

export const ModelWorkbenchPage: React.FC = () => {
  // Workstation state
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatusResponse | null>(null);
  const [auditData, setAuditData] = useState<DatasetAuditResponse | null>(null);
  const [checkpoints, setCheckpoints] = useState<CheckpointInfo[]>([]);
  const [evalResults, setEvalResults] = useState<EvaluationResults | null>(null);

  // Form Controls
  const [datasetPath, setDatasetPath] = useState('data/raw');
  const [epochs, setEpochs] = useState(15);
  const [batchSize, setBatchSize] = useState(16);
  const [learningRate, setLearningRate] = useState(0.0001);
  const [optimizer, setOptimizer] = useState('AdamW');
  const [patience, setPatience] = useState(5);
  const device = 'cuda:0';
  const [architecture, setArchitecture] = useState('ResNet-50');

  // Loading & confirmation dialog states
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isPromoting, setIsPromoting] = useState<string | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [actionNotice, setActionNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Container-only scroll reference. Preserves user scroll position when inspecting logs.
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);

  const handleTerminalScroll = () => {
    if (!terminalContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalContainerRef.current;
    isUserScrolledUpRef.current = scrollHeight - (scrollTop + clientHeight) > 30;
  };

  useEffect(() => {
    if (terminalContainerRef.current && !isUserScrolledUpRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [trainingStatus?.recent_logs]);

  // Initial audit and checkpoint loading
  const refreshData = async () => {
    try {
      const [status, ckpts] = await Promise.all([
        api.getTrainingStatus(),
        api.listCheckpoints(),
      ]);
      setTrainingStatus(status);
      setCheckpoints(ckpts);
      if (status.evaluation_results) {
        setEvalResults(status.evaluation_results);
      }
    } catch (e) {
      console.warn('Refresh notice:', e);
    }
  };

  useEffect(() => {
    refreshData();

    // Subscribe to real-time Server-Sent Events stream
    const unsubscribe = api.subscribeToTrainingStream(
      (data) => {
        setTrainingStatus(data);
        if (data.evaluation_results) {
          setEvalResults(data.evaluation_results);
        }
      },
      (err) => {
        console.warn('SSE fallback to polling:', err);
      }
    );

    // Backup polling
    const interval = setInterval(refreshData, 3500);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Trigger dataset audit
  const handleAudit = async () => {
    setIsAuditing(true);
    setActionNotice(null);
    try {
      const res = await api.auditDataset(datasetPath);
      setAuditData(res);
      setActionNotice({
        type: res.ready_for_training ? 'success' : 'info',
        message: res.message,
      });
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Audit failed.' });
    } finally {
      setIsAuditing(false);
    }
  };

  // Trigger dataset split
  const handleSplit = async () => {
    setIsSplitting(true);
    setActionNotice(null);
    try {
      const res = await api.splitDataset({ raw_dir: datasetPath });
      setActionNotice({
        type: 'success',
        message: res.message || 'Dataset splits prepared successfully.',
      });
      refreshData();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Splits preparation failed.' });
    } finally {
      setIsSplitting(false);
    }
  };

  // Start Training
  const handleStartTraining = async () => {
    setActionNotice(null);
    try {
      const res = await api.startTraining({
        splits_dir: datasetPath,
        epochs,
        batch_size: batchSize,
        lr: learningRate,
        optimizer,
        patience,
        device,
        architecture,
      });
      setActionNotice({ type: 'success', message: `Training started (Job: ${res.job_id})` });
      refreshData();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to start training job.' });
    }
  };

  // Stop Training
  const handleStopTraining = async () => {
    setShowStopConfirm(false);
    try {
      const res = await api.stopTraining();
      setActionNotice({ type: 'info', message: res.message || 'Training stop requested.' });
      refreshData();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to request training stop.' });
    }
  };

  // Promote Checkpoint
  const handlePromote = async (checkpointPath: string) => {
    setIsPromoting(checkpointPath);
    setActionNotice(null);
    try {
      const res = await api.promoteModel(checkpointPath);
      setActionNotice({ type: 'success', message: `Model promoted: ${res.active_model}` });
      refreshData();
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Failed to promote checkpoint.' });
    } finally {
      setIsPromoting(null);
    }
  };

  // Evaluate Checkpoint on Unseen Test Split
  const handleEvaluate = async (checkpointPath: string) => {
    setIsEvaluating(true);
    setActionNotice(null);
    try {
      const res = await api.evaluateModel(checkpointPath);
      setEvalResults(res);
      setActionNotice({
        type: 'success',
        message: `Evaluation completed: ${res.overall_accuracy}% accuracy on held-out test split.`,
      });
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err.message || 'Evaluation failed.' });
    } finally {
      setIsEvaluating(false);
    }
  };

  const isJobRunning = trainingStatus?.is_running ?? false;
  const telemetry = trainingStatus?.telemetry;

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-6 pb-12">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1E352F] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#00C853]" />
              Model Workbench & Checkpoint Registry
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#00C853]/15 text-[#1DE9B6] border border-[#1DE9B6]/30">
              PyTorch CUDA
            </span>
          </div>
          <p className="text-xs text-[#9EABA7] mt-1">
            End-to-end dataset stratification, transfer learning training, real-time telemetry, and model promotion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="touch-target px-3.5 py-2 rounded-xl bg-[#162320] hover:bg-[#1D2E2A] text-white text-xs font-semibold border border-[#1E352F] transition-all flex items-center gap-1.5"
            title="Refresh workbench status"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#00C853]" />
            <span>Sync</span>
          </button>

          {isJobRunning ? (
            <button
              onClick={() => setShowStopConfirm(true)}
              className="touch-target px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Job</span>
            </button>
          ) : (
            <button
              onClick={handleStartTraining}
              className="touch-target px-5 py-2 rounded-xl bg-[#00C853] hover:bg-[#00B048] text-black text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Training</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            actionNotice.type === 'success'
              ? 'bg-[#00C853]/10 border-[#00C853]/40 text-[#1DE9B6]'
              : actionNotice.type === 'error'
              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
              : 'bg-[#162320] border-[#1E352F] text-stone-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0" />
            ) : actionNotice.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Activity className="w-4 h-4 text-[#1DE9B6] shrink-0" />
            )}
            <span className="font-medium">{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-[11px] font-bold underline opacity-80 hover:opacity-100 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stop Job Confirmation Dialog */}
      {showStopConfirm && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div>
            <span className="font-bold block text-sm">Interrupt active training session?</span>
            <span className="text-xs text-rose-300">
              The checkpoint from the latest completed epoch will be saved in <code>artifacts/</code>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStopConfirm(false)}
              className="px-3 py-1.5 rounded-lg bg-[#162320] border border-[#1E352F] text-xs font-semibold text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleStopTraining}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs"
            >
              Confirm Stop
            </button>
          </div>
        </div>
      )}

      {/* 2. System Hardware & CUDA Telemetry Card */}
      <section
        aria-label="Hardware GPU and System Status"
        className="rounded-2xl border border-[#1E352F] bg-[#162320] p-5 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between border-b border-[#1E352F] pb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9EABA7] flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#00C853]" />
            Local Telemetry & GPU Compute
          </span>
          <span className="text-xs font-mono text-[#1DE9B6] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00C853] animate-pulse" />
            {telemetry?.gpu_name || 'NVIDIA RTX 2050 (4GB CUDA)'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* VRAM Gauge */}
          <div className="p-3 rounded-xl bg-[#121212] border border-[#1E352F] space-y-1.5">
            <div className="flex items-center justify-between text-[#9EABA7]">
              <span className="flex items-center gap-1 text-[11px] font-semibold">
                <HardDrive className="w-3.5 h-3.5 text-[#00C853]" />
                GPU VRAM
              </span>
              <span className="font-mono font-bold text-white">
                {telemetry ? `${telemetry.gpu_memory_used_mb} / ${telemetry.gpu_memory_total_mb} MB` : '1.2 / 4.0 GB'}
              </span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#00C853] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    telemetry && telemetry.gpu_memory_total_mb > 0
                      ? Math.min(100, (telemetry.gpu_memory_used_mb / telemetry.gpu_memory_total_mb) * 100)
                      : 30
                  }%`,
                }}
              />
            </div>
          </div>

          {/* GPU Core Utilization */}
          <div className="p-3 rounded-xl bg-[#121212] border border-[#1E352F] space-y-1.5">
            <div className="flex items-center justify-between text-[#9EABA7]">
              <span className="flex items-center gap-1 text-[11px] font-semibold">
                <Activity className="w-3.5 h-3.5 text-[#1DE9B6]" />
                GPU Core
              </span>
              <span className="font-mono font-bold text-white">
                {telemetry ? `${telemetry.gpu_utilization_pct}%` : '8%'}
              </span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#1DE9B6] h-full rounded-full transition-all duration-500"
                style={{ width: `${telemetry?.gpu_utilization_pct || 8}%` }}
              />
            </div>
          </div>

          {/* GPU Temperature */}
          <div className="p-3 rounded-xl bg-[#121212] border border-[#1E352F] space-y-1.5">
            <div className="flex items-center justify-between text-[#9EABA7]">
              <span className="flex items-center gap-1 text-[11px] font-semibold">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                GPU Temp
              </span>
              <span className="font-mono font-bold text-white">
                {telemetry && telemetry.gpu_temp_c > 0 ? `${telemetry.gpu_temp_c}°C` : '48°C'}
              </span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((telemetry?.gpu_temp_c || 48) / 90) * 100)}%` }}
              />
            </div>
          </div>

          {/* System RAM */}
          <div className="p-3 rounded-xl bg-[#121212] border border-[#1E352F] space-y-1.5">
            <div className="flex items-center justify-between text-[#9EABA7]">
              <span className="flex items-center gap-1 text-[11px] font-semibold">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                RAM / CPU
              </span>
              <span className="font-mono font-bold text-white">
                {telemetry ? `${telemetry.ram_utilization_pct}% RAM` : '42% RAM'}
              </span>
            </div>
            <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${telemetry?.ram_utilization_pct || 42}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Dataset Audit & Splitting Workbench Card */}
      <section
        aria-label="Dataset Configuration and Integrity Audit"
        className="rounded-2xl border border-[#1E352F] bg-[#162320] p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#1E352F] pb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9EABA7] flex items-center gap-1.5">
            <FolderCheck className="w-4 h-4 text-[#00C853]" />
            Dataset Selection & Leakage-Free Stratification
          </span>
          <span className="text-xs text-[#9EABA7]">Step 1 of 3</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-white block">
              Raw Dataset Directory Path
            </label>
            <input
              type="text"
              value={datasetPath}
              onChange={(e) => setDatasetPath(e.target.value)}
              disabled={isJobRunning}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#121212] border border-[#1E352F] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00C853]"
              placeholder="e.g., data/raw"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAudit}
              disabled={isAuditing || isJobRunning}
              className="touch-target flex-1 px-4 py-2.5 rounded-xl bg-[#121212] hover:bg-[#1A2E28] text-white text-xs font-bold border border-[#1E352F] transition-colors"
            >
              <FolderCheck className="w-4 h-4 mr-1.5 inline text-[#00C853]" />
              <span>{isAuditing ? 'Auditing...' : 'Audit Dataset'}</span>
            </button>

            <button
              onClick={handleSplit}
              disabled={isSplitting || isJobRunning}
              className="touch-target flex-1 px-4 py-2.5 rounded-xl bg-[#00C853]/15 hover:bg-[#00C853]/25 text-[#1DE9B6] text-xs font-bold border border-[#00C853]/30 transition-colors"
            >
              <Split className="w-4 h-4 mr-1.5 inline text-[#00C853]" />
              <span>{isSplitting ? 'Splitting...' : 'Prepare Splits'}</span>
            </button>
          </div>
        </div>

        {/* Dataset Guidance when empty or not audited */}
        {(!auditData || auditData.total_images_found === 0) && (
          <div className="rounded-xl border border-[#1E352F] bg-[#121212] p-4 text-xs space-y-2 text-[#9EABA7]">
            <div className="flex items-center gap-2 font-bold text-white">
              <FolderPlus className="w-4 h-4 text-[#00C853]" />
              <span>Required Dataset Folder Structure:</span>
            </div>
            <p className="leading-relaxed">
              Place banknote and coin JPEG/PNG images into subdirectory classes inside <code className="font-bold text-white">data/raw/</code>:
            </p>
            <div className="p-3 rounded-lg bg-[#0B1F1A] border border-[#1E352F] font-mono text-[11px] leading-relaxed text-[#1DE9B6]">
              data/raw/ <br />
              &nbsp;&nbsp;├── 10/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(or ₹10 notes)<br />
              &nbsp;&nbsp;├── 20/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(or ₹20 notes)<br />
              &nbsp;&nbsp;├── 50/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(or ₹50 notes)<br />
              &nbsp;&nbsp;├── 100/ &nbsp;&nbsp;&nbsp;&nbsp;(or ₹100 notes)<br />
              &nbsp;&nbsp;├── 200/ &nbsp;&nbsp;&nbsp;&nbsp;(or ₹200 notes)<br />
              &nbsp;&nbsp;├── 500/ &nbsp;&nbsp;&nbsp;&nbsp;(or ₹500 notes)<br />
              &nbsp;&nbsp;├── 2000/ &nbsp;&nbsp;&nbsp;(or ₹2000 notes)<br />
              &nbsp;&nbsp;├── 1_coin/ &nbsp;&nbsp;(or ₹1 coins)<br />
              &nbsp;&nbsp;├── 2_coin/ &nbsp;&nbsp;(or ₹2 coins)<br />
              &nbsp;&nbsp;├── 5_coin/ &nbsp;&nbsp;(or ₹5 coins)<br />
              &nbsp;&nbsp;├── 10_coin/ &nbsp;(or ₹10 coins)<br />
              &nbsp;&nbsp;└── 20_coin/ &nbsp;(or ₹20 coins)
            </div>
          </div>
        )}

        {/* Audit Results View */}
        {auditData && auditData.total_images_found > 0 && (
          <div className="p-4 rounded-xl bg-[#121212] border border-[#1E352F] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Audit Summary Results</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  auditData.ready_for_training
                    ? 'bg-[#00C853]/20 text-[#00C853]'
                    : 'bg-amber-950/40 text-amber-300'
                }`}
              >
                {auditData.ready_for_training ? 'Ready for Stratified Split' : 'Review Warnings'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#162320] border border-[#1E352F]">
                <span className="text-[10px] text-[#9EABA7] block">Valid Images</span>
                <span className="font-mono font-bold text-white text-sm">
                  {auditData.valid_images}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#162320] border border-[#1E352F]">
                <span className="text-[10px] text-[#9EABA7] block">Detected Classes</span>
                <span className="font-mono font-bold text-[#1DE9B6] text-sm">
                  {Object.keys(auditData.class_counts).length}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#162320] border border-[#1E352F]">
                <span className="text-[10px] text-[#9EABA7] block">Corrupt Files</span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {auditData.corrupt_images}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#162320] border border-[#1E352F]">
                <span className="text-[10px] text-[#9EABA7] block">Duplicates</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {auditData.duplicate_images}
                </span>
              </div>
            </div>

            {/* Class distribution pills */}
            {Object.keys(auditData.class_counts).length > 0 && (
              <div className="pt-2 border-t border-[#1E352F]">
                <span className="text-[10px] uppercase font-bold text-[#9EABA7] block mb-1.5">
                  Class Distribution:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {Object.entries(auditData.class_counts).map(([cls, count]) => (
                    <span
                      key={cls}
                      className="px-2 py-0.5 rounded-md bg-[#162320] border border-[#1E352F] text-[11px] text-stone-300 font-mono"
                    >
                      <strong className="text-[#00C853]">{cls}</strong>: {count} images
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Training Hyperparameters & Execution Controls */}
      <section
        aria-label="Training Controls and Hyperparameters"
        className="rounded-2xl border border-[#1E352F] bg-[#162320] p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#1E352F] pb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9EABA7] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#00C853]" />
            ResNet-50 Training Controls
          </span>
          <span className="text-xs text-[#9EABA7]">Step 2 of 3</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-white block">Epochs</label>
            <input
              type="number"
              min={1}
              max={100}
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
              disabled={isJobRunning}
              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#1E352F] font-mono text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-white block">
              Batch Size <span className="text-[10px] text-stone-400">(4GB VRAM)</span>
            </label>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              disabled={isJobRunning}
              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#1E352F] font-mono text-white"
            >
              <option value={8}>8 (Safest)</option>
              <option value={16}>16 (Recommended)</option>
              <option value={32}>32 (High VRAM)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-white block">Learning Rate</label>
            <input
              type="number"
              step={0.00005}
              value={learningRate}
              onChange={(e) => setLearningRate(Number(e.target.value))}
              disabled={isJobRunning}
              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#1E352F] font-mono text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-white block">Optimizer</label>
            <select
              value={optimizer}
              onChange={(e) => setOptimizer(e.target.value)}
              disabled={isJobRunning}
              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#1E352F] font-mono text-white"
            >
              <option value="AdamW">AdamW</option>
              <option value="Adam">Adam</option>
              <option value="SGD">SGD (Momentum)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-white block">Patience (Stop)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={patience}
              onChange={(e) => setPatience(Number(e.target.value))}
              disabled={isJobRunning}
              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#1E352F] font-mono text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-white block">Backbone</label>
            <select
              value={architecture}
              onChange={(e) => setArchitecture(e.target.value)}
              disabled={isJobRunning}
              className="w-full px-3 py-2 rounded-xl bg-[#121212] border border-[#1E352F] font-mono text-white"
            >
              <option value="ResNet-50">ResNet-50</option>
              <option value="ResNet-18">ResNet-18</option>
            </select>
          </div>
        </div>
      </section>

      {/* 5. Real-Time Training Progress Telemetry (Only when job exists/running) */}
      {trainingStatus && (trainingStatus.is_running || trainingStatus.current_epoch > 0) && (
        <section
          aria-label="Active Training Progress and Epoch Curves"
          className="rounded-2xl border border-[#1E352F] bg-[#162320] p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#1E352F] pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9EABA7] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#00C853]" />
              Live Training Epoch Telemetry
            </span>
            <span className="text-xs font-mono font-bold text-white">
              Epoch {trainingStatus.current_epoch} of {trainingStatus.total_epochs}
            </span>
          </div>

          {/* Metrics Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#121212] border border-[#1E352F]">
              <span className="text-[10px] text-[#9EABA7] block">Train Loss / Accuracy</span>
              <span className="font-mono font-bold text-white text-sm">
                {trainingStatus.train_loss} | {trainingStatus.train_acc}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#121212] border border-[#1E352F]">
              <span className="text-[10px] text-[#9EABA7] block">Val Loss / Accuracy</span>
              <span className="font-mono font-bold text-[#1DE9B6] text-sm">
                {trainingStatus.val_loss} | {trainingStatus.val_acc}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#121212] border border-[#1E352F]">
              <span className="text-[10px] text-[#9EABA7] block">Best Val Accuracy</span>
              <span className="font-mono font-bold text-[#00C853] text-sm">
                {trainingStatus.best_val_acc}% (Ep {trainingStatus.best_epoch})
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#121212] border border-[#1E352F]">
              <span className="text-[10px] text-[#9EABA7] block">Estimated Remaining Time</span>
              <span className="font-mono font-bold text-stone-300 text-sm">
                {trainingStatus.estimated_remaining_seconds > 0
                  ? `${Math.round(trainingStatus.estimated_remaining_seconds)}s (est.)`
                  : '--'}
              </span>
            </div>
          </div>

          {/* Progress Curve */}
          {trainingStatus.history.length > 1 && (
            <div className="p-4 rounded-xl bg-[#121212] border border-[#1E352F] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#9EABA7]">
                <span className="font-bold text-white">Validation Accuracy Progression (%)</span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[#00C853]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00C853]" /> Val Acc
                  </span>
                  <span className="flex items-center gap-1 text-[#9EABA7]">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-500" /> Train Acc
                  </span>
                </span>
              </div>

              <div className="h-32 w-full flex items-end gap-1.5 pt-2 border-b border-[#1E352F]">
                {trainingStatus.history.map((h) => (
                  <div key={h.epoch} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div
                      className="w-full max-w-[18px] bg-[#00C853] rounded-t-sm transition-all"
                      style={{ height: `${Math.max(4, h.val_accuracy)}%` }}
                      title={`Epoch ${h.epoch}: Val Acc ${h.val_accuracy}%, Train Acc ${h.train_accuracy}%`}
                    />
                    <span className="text-[9px] font-mono text-[#9EABA7]">{h.epoch}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 6. Live Training Console Stream (CONTAINER-SCOPED SCROLL) */}
      <section
        aria-label="Training Terminal Output"
        className="rounded-2xl border border-[#1E352F] bg-[#162320] p-5 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between border-b border-[#1E352F] pb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9EABA7] flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-[#00C853]" />
            Live Process Logs & Checkpoint Events
          </span>
          <span className="text-xs font-mono text-[#9EABA7]">
            {trainingStatus?.recent_logs.length || 0} events
          </span>
        </div>

        {/* CONTAINER-SCOPED SCROLLING: NEVER calls scrollIntoView on the page */}
        <div
          ref={terminalContainerRef}
          onScroll={handleTerminalScroll}
          className="h-44 overflow-y-auto rounded-xl bg-[#0B1F1A] p-3.5 font-mono text-[11px] text-stone-200 space-y-1 border border-[#1E352F]"
        >
          {trainingStatus?.recent_logs && trainingStatus.recent_logs.length > 0 ? (
            trainingStatus.recent_logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-stone-500 select-none">{log.timestamp}</span>
                <span
                  className={
                    log.level === 'SUCCESS'
                      ? 'text-[#00C853] font-bold'
                      : log.level === 'WARNING'
                      ? 'text-amber-400 font-bold'
                      : log.level === 'ERROR'
                      ? 'text-rose-400 font-bold'
                      : 'text-[#1DE9B6]'
                  }
                >
                  [{log.level}]
                </span>
                <span className="text-stone-200">{log.message}</span>
              </div>
            ))
          ) : (
            <div className="text-stone-500 italic py-4 text-center">
              Awaiting training session. Process output and checkpoint events will stream here in real time.
            </div>
          )}
        </div>
      </section>

      {/* 7. Checkpoint Registry & Model Promotion */}
      <section
        aria-label="Checkpoint Management and Active Model Promotion"
        className="rounded-2xl border border-[#1E352F] bg-[#162320] p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#1E352F] pb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9EABA7] flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#00C853]" />
            Model Registry & Checkpoint Promotion
          </span>
          <span className="text-xs text-[#9EABA7]">Step 3 of 3</span>
        </div>

        {checkpoints.length > 0 ? (
          <div className="space-y-2">
            {checkpoints.map((ckpt) => (
              <div
                key={ckpt.path}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  ckpt.is_active
                    ? 'bg-[#00C853]/10 border-[#00C853]/40'
                    : 'bg-[#121212] border-[#1E352F]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-white">
                      {ckpt.filename}
                    </span>
                    {ckpt.is_active && (
                      <span className="px-2 py-0.5 rounded-md bg-[#00C853] text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-black" />
                        Active Production Model
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#9EABA7]">
                    <span>Val Acc: <strong className="text-[#00C853]">{ckpt.val_accuracy}%</strong></span>
                    <span>Epoch: {ckpt.epoch || '--'}</span>
                    <span>Size: {ckpt.size_mb} MB</span>
                    <span>Classes: {ckpt.num_classes || ckpt.classes.length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleEvaluate(ckpt.path)}
                    disabled={isEvaluating}
                    className="touch-target px-3.5 py-1.5 rounded-xl bg-[#162320] hover:bg-[#1D2E2A] text-white text-xs font-semibold border border-[#1E352F]"
                  >
                    Evaluate Test Split
                  </button>

                  {!ckpt.is_active && (
                    <button
                      onClick={() => handlePromote(ckpt.path)}
                      disabled={isPromoting === ckpt.path}
                      className="touch-target px-4 py-1.5 rounded-xl bg-[#00C853] hover:bg-[#00B048] text-black text-xs font-bold transition-all shadow-xs"
                    >
                      {isPromoting === ckpt.path ? 'Promoting...' : 'Promote Model'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#121212] border border-dashed border-[#1E352F] text-center text-xs text-[#9EABA7] space-y-2">
            <p>
              No trained checkpoints found in <code>artifacts/</code>.
            </p>
            <p className="text-[11px] text-stone-400">
              Add banknote/coin images to <code className="font-bold text-white">data/raw/</code> and click <strong>Start Training ResNet-50</strong> above.
            </p>
          </div>
        )}
      </section>

      {/* 8. Empirical Held-Out Test Evaluation Results */}
      {evalResults && (
        <section
          aria-label="Evaluation Results on Unseen Test Split"
          className="rounded-2xl border border-[#1E352F] bg-[#162320] p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#1E352F] pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9EABA7] flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#00C853]" />
              Held-Out Test Set Academic Evaluation
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#00C853]/20 text-[#00C853] border border-[#00C853]/40">
              Strictly Unseen Data
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#121212] border border-[#1E352F]">
              <span className="text-[10px] text-[#9EABA7] block">Overall Test Accuracy</span>
              <span className="font-extrabold text-2xl font-['Outfit'] text-[#00C853]">
                {evalResults.overall_accuracy}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#121212] border border-[#1E352F]">
              <span className="text-[10px] text-[#9EABA7] block">Macro-F1 Score</span>
              <span className="font-extrabold text-2xl font-['Outfit'] text-[#1DE9B6]">
                {evalResults.macro_f1}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#121212] border border-[#1E352F]">
              <span className="text-[10px] text-[#9EABA7] block">Evaluated Test Samples</span>
              <span className="font-extrabold text-2xl font-['Outfit'] text-white">
                {evalResults.total_test_samples}
              </span>
            </div>
          </div>

          {/* Per-Class Metrics Table */}
          {evalResults.per_class_metrics && (
            <div className="overflow-x-auto rounded-xl border border-[#1E352F] max-w-full">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-[#121212] border-b border-[#1E352F] text-[#9EABA7] font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Denomination</th>
                    <th className="p-3">Precision</th>
                    <th className="p-3">Recall</th>
                    <th className="p-3">F1-Score</th>
                    <th className="p-3">Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E352F]">
                  {Object.entries(evalResults.per_class_metrics).map(([denom, m]) => (
                    <tr key={denom} className="hover:bg-[#1A2E28]">
                      <td className="p-3 font-bold text-[#00C853]">{denom}</td>
                      <td className="p-3 font-mono">{m.precision}%</td>
                      <td className="p-3 font-mono">{m.recall}%</td>
                      <td className="p-3 font-mono font-bold text-white">{m.f1_score}%</td>
                      <td className="p-3 font-mono text-[#9EABA7]">{m.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Real Confusion Matrix with Strict Overflow X */}
          {evalResults.confusion_matrix && evalResults.classes && (
            <div className="space-y-2 pt-2 max-w-full">
              <span className="text-[11px] font-bold text-white block">
                Confusion Matrix (Actual vs Predicted)
              </span>
              <div className="overflow-x-auto p-3 rounded-xl bg-[#121212] border border-[#1E352F] max-w-full">
                <table className="text-center text-[10px] mx-auto min-w-[600px]">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-stone-500">Actual \ Pred</th>
                      {evalResults.classes.map((c) => (
                        <th key={c} className="p-1.5 font-bold text-[#9EABA7] whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {evalResults.confusion_matrix.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className="p-1.5 font-bold text-left text-white whitespace-nowrap">
                          {evalResults.classes[rowIdx]}
                        </td>
                        {row.map((val, colIdx) => (
                          <td
                            key={colIdx}
                            className={`p-1.5 font-mono ${
                              rowIdx === colIdx && val > 0
                                ? 'bg-[#00C853]/25 text-[#00C853] font-bold rounded-xs'
                                : val > 0
                                ? 'bg-rose-950/60 text-rose-300 font-bold'
                                : 'text-stone-600'
                            }`}
                          >
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
