import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Grid,
  Table,
  PieChart,
  Clock,
  AlertCircle,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import type { MetricsSummaryResponse } from '../types';
import { EmptyState } from '../components/EmptyState';

const DEFAULT_CLASSES = ['₹10', '₹20', '₹50', '₹100', '₹200', '₹500', '₹2000'];

export const InsightsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsSummaryResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'training' | 'evaluation' | 'dataset' | 'latency'>('training');

  useEffect(() => {
    let isMounted = true;
    api
      .getMetricsSummary()
      .then((res) => {
        if (isMounted) setMetrics(res);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const classes = metrics?.classes || DEFAULT_CLASSES;
  const history = metrics?.training_history || [];
  const cm = metrics?.confusion_matrix;
  const perClass = metrics?.per_class_metrics;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-['Outfit'] text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#00C853]" />
          <span>Analytics & Model Evaluation Reports</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#9EABA6] mt-1">
          Empirical telemetry, loss curves, confusion matrices, and per-class classification metrics.
        </p>
      </div>

      {/* Academic Honesty Notice */}
      <div className="rounded-2xl border border-[#22332E] bg-[#121212] p-4.5 text-xs text-[#9EABA6] flex items-start gap-3 shadow-2xs">
        <AlertCircle className="w-5 h-5 text-[#1DE9B6] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Zero Simulated Metrics Policy</p>
          <p className="text-[#9EABA6] leading-relaxed">
            All charts and matrices reflect empirical state. Data appears here automatically when model training epochs and test set evaluations are performed using the <strong className="text-white">Model Workbench</strong> or ML scripts.
          </p>
        </div>
      </div>

      {/* Quick Summary Pill Bar if evaluated */}
      {metrics && metrics.model_accuracy !== null && metrics.model_accuracy !== undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-[#121212] border border-[#22332E] shadow-2xs">
            <span className="text-[#9EABA6] text-[10px] uppercase font-bold tracking-wider block">Test Accuracy</span>
            <span className="text-xl font-bold font-['Outfit'] text-[#00C853] mt-0.5 block">
              {metrics.model_accuracy}%
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#121212] border border-[#22332E] shadow-2xs">
            <span className="text-[#9EABA6] text-[10px] uppercase font-bold tracking-wider block">Macro-F1</span>
            <span className="text-xl font-bold font-['Outfit'] text-white mt-0.5 block">
              {metrics.macro_f1 ? `${metrics.macro_f1}%` : '--'}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#121212] border border-[#22332E] shadow-2xs">
            <span className="text-[#9EABA6] text-[10px] uppercase font-bold tracking-wider block">Recognitions Logged</span>
            <span className="text-xl font-bold font-['Outfit'] text-white mt-0.5 block">
              {metrics.total_recognitions}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-[#121212] border border-[#22332E] shadow-2xs">
            <span className="text-[#9EABA6] text-[10px] uppercase font-bold tracking-wider block">Mean Latency</span>
            <span className="text-xl font-bold font-['Outfit'] text-white mt-0.5 block">
              {metrics.average_latency_ms ? `${metrics.average_latency_ms} ms` : '--'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#22332E] pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('training')}
          className={`touch-target px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'training'
              ? 'bg-[#00C853] text-black font-bold shadow-xs'
              : 'bg-[#121212] text-[#9EABA6] hover:text-white border border-[#22332E]'
          }`}
        >
          Training & Validation Curves
        </button>
        <button
          onClick={() => setActiveTab('evaluation')}
          className={`touch-target px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'evaluation'
              ? 'bg-[#00C853] text-black font-bold shadow-xs'
              : 'bg-[#121212] text-[#9EABA6] hover:text-white border border-[#22332E]'
          }`}
        >
          Confusion Matrix & Class Metrics
        </button>
        <button
          onClick={() => setActiveTab('dataset')}
          className={`touch-target px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'dataset'
              ? 'bg-[#00C853] text-black font-bold shadow-xs'
              : 'bg-[#121212] text-[#9EABA6] hover:text-white border border-[#22332E]'
          }`}
        >
          Dataset Class Distribution
        </button>
        <button
          onClick={() => setActiveTab('latency')}
          className={`touch-target px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'latency'
              ? 'bg-[#00C853] text-black font-bold shadow-xs'
              : 'bg-[#121212] text-[#9EABA6] hover:text-white border border-[#22332E]'
          }`}
        >
          Inference Latency & Telemetry
        </button>
      </div>

      {/* TAB 1: Training & Validation Curves */}
      {activeTab === 'training' && (
        <div className="space-y-5">
          {history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Real Loss Curve */}
              <div className="rounded-2xl border border-[#22332E] bg-[#121212] p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold font-['Outfit'] text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#1DE9B6]" />
                    <span>Cross-Entropy Loss</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161F1D] text-[#9EABA6] font-semibold border border-[#22332E]">
                    {history.length} Epochs
                  </span>
                </div>
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D5" />
                      <XAxis dataKey="epoch" stroke="#82768B" fontSize={11} />
                      <YAxis stroke="#82768B" fontSize={11} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#22332E',
                          borderRadius: '12px',
                          fontSize: '11px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="train_loss" name="Train Loss" stroke="#FA5238" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="val_loss" name="Val Loss" stroke="#2D1236" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Real Accuracy Curve */}
              <div className="rounded-2xl border border-[#22332E] bg-[#121212] p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold font-['Outfit'] text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00C853]" />
                    <span>Top-1 Accuracy (%)</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161F1D] text-[#00C853] font-semibold border border-[#22332E]">
                    Validation Peak
                  </span>
                </div>
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D5" />
                      <XAxis dataKey="epoch" stroke="#82768B" fontSize={11} />
                      <YAxis stroke="#82768B" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#22332E',
                          borderRadius: '12px',
                          fontSize: '11px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="train_accuracy" name="Train Acc %" stroke="#FA5238" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="val_accuracy" name="Val Acc %" stroke="#2D1236" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-[#22332E] bg-[#121212] p-5 space-y-3 shadow-xs">
                <h3 className="text-sm font-semibold font-['Outfit'] text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1DE9B6]" />
                  <span>Training & Validation Loss</span>
                </h3>
                <div className="min-h-[220px] rounded-xl bg-[#161F1D] border border-[#22332E] flex items-center justify-center p-6">
                  <EmptyState
                    compact
                    icon={TrendingUp}
                    title="No Training Loss History"
                    description="Run model training from the Model Workbench to log real-time loss progression."
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#22332E] bg-[#121212] p-5 space-y-3 shadow-xs">
                <h3 className="text-sm font-semibold font-['Outfit'] text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00C853]" />
                  <span>Top-1 Accuracy Progression</span>
                </h3>
                <div className="min-h-[220px] rounded-xl bg-[#161F1D] border border-[#22332E] flex items-center justify-center p-6">
                  <EmptyState
                    compact
                    icon={Activity}
                    title="No Accuracy Curve Available"
                    description="Accuracy logs will appear here upon completion of transfer learning epochs."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Confusion Matrix & Class Metrics */}
      {activeTab === 'evaluation' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#22332E] bg-[#121212] p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold font-['Outfit'] text-white flex items-center gap-2">
                <Grid className="w-4 h-4 text-[#00C853]" />
                <span>Multi-Class Confusion Matrix ({classes.length} × {classes.length})</span>
              </h3>
              <span className="text-[10px] font-mono text-[#9EABA6]">Actual vs Predicted</span>
            </div>

            {cm && cm.length > 0 ? (
              <div className="overflow-x-auto p-4 rounded-xl bg-[#161F1D] border border-[#22332E]">
                <table className="text-center text-xs mx-auto">
                  <thead>
                    <tr>
                      <th className="p-2 text-[#9EABA6]">Actual \ Pred</th>
                      {classes.map((c) => (
                        <th key={c} className="p-2 font-bold text-white">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cm.map((row: number[], rowIdx: number) => (
                      <tr key={rowIdx}>
                        <td className="p-2 font-bold text-left text-white">{classes[rowIdx]}</td>
                        {row.map((val: number, colIdx: number) => (
                          <td
                            key={colIdx}
                            className={`p-2 font-mono ${
                              rowIdx === colIdx && val > 0
                                ? 'bg-[#E3D5E8] text-[#00C853] font-bold rounded-xs'
                                : val > 0
                                ? 'bg-[#FFD0C7] text-[#D9381E] font-bold'
                                : 'text-[#64746E]'
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
            ) : (
              <div className="min-h-[220px] rounded-xl bg-[#161F1D] border border-[#22332E] flex items-center justify-center p-6">
                <EmptyState
                  compact
                  icon={Grid}
                  title="Confusion Matrix Awaiting Test Run"
                  description="Evaluate a trained checkpoint in the Model Workbench to populate empirical confusion scores."
                />
              </div>
            )}
          </div>

          {/* Per-Class Precision / Recall / F1 Table */}
          {perClass && Object.keys(perClass).length > 0 && (
            <div className="rounded-2xl border border-[#22332E] bg-[#121212] p-5 space-y-3 shadow-xs">
              <h3 className="text-sm font-semibold font-['Outfit'] text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-[#00C853]" />
                <span>Per-Denomination Performance Metrics</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[#22332E]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161F1D] border-b border-[#22332E] text-[#9EABA6] font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Denomination</th>
                      <th className="p-3">Precision</th>
                      <th className="p-3">Recall</th>
                      <th className="p-3">F1-Score</th>
                      <th className="p-3">Support</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22332E]">
                    {Object.entries(perClass).map(([denom, m]: [string, any]) => (
                      <tr key={denom} className="hover:bg-[#161F1D]">
                        <td className="p-3 font-bold text-[#00C853]">{denom}</td>
                        <td className="p-3 font-mono">{m.precision}%</td>
                        <td className="p-3 font-mono">{m.recall}%</td>
                        <td className="p-3 font-mono font-bold text-white">{m.f1_score}%</td>
                        <td className="p-3 font-mono text-[#9EABA6]">{m.support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Dataset Class Distribution */}
      {activeTab === 'dataset' && (
        <div className="rounded-2xl border border-[#22332E] bg-[#121212] p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold font-['Outfit'] text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#00C853]" />
              <span>Dataset Class Distribution</span>
            </h3>
            <span className="text-[10px] font-mono text-[#9EABA6]">Class Balance</span>
          </div>

          <div className="space-y-2 pt-2">
            {classes.map((cls) => (
              <div key={cls} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#161F1D] border border-[#22332E]">
                <span className="font-bold text-[#00C853]">{cls}</span>
                <span className="text-[11px] font-mono text-[#9EABA6]">
                  Indian {cls.includes('Coin') ? 'Coin' : 'Banknote'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Latency & Telemetry */}
      {activeTab === 'latency' && (
        <div className="rounded-2xl border border-[#22332E] bg-[#121212] p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold font-['Outfit'] text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00C853]" />
              <span>Inference Hardware & Latency</span>
            </h3>
            <span className="text-[10px] font-mono text-[#9EABA6]">NVIDIA RTX 2050</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-[#161F1D] border border-[#22332E] space-y-1">
              <span className="text-[10px] text-[#9EABA6] uppercase font-bold block">Average Forward Pass</span>
              <span className="text-2xl font-black font-['Outfit'] text-[#00C853]">
                {metrics?.average_latency_ms ? `${metrics.average_latency_ms} ms` : '--'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#161F1D] border border-[#22332E] space-y-1">
              <span className="text-[10px] text-[#9EABA6] uppercase font-bold block">Total Inferences</span>
              <span className="text-2xl font-black font-['Outfit'] text-white">
                {metrics?.total_recognitions ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#161F1D] border border-[#22332E] space-y-1">
              <span className="text-[10px] text-[#9EABA6] uppercase font-bold block">Mean Model Confidence</span>
              <span className="text-2xl font-black font-['Outfit'] text-[#15803D]">
                {metrics?.average_confidence ? `${metrics.average_confidence}%` : '--'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
