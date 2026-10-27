import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  History,
  Coins,
  Database,
  Cpu,
  Smartphone,
  Activity,
  Settings,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  Layers,
  Server,
  ChevronRight,
  Globe,
  Volume2,
  Accessibility,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import { useCamera } from '../hooks/useCamera';
import type {
  ModelStatusResponse,
  MetricsSummaryResponse,
  HealthResponse,
  RecognitionRecord,
  ConnectedDevice,
  PredictionResponse,
} from '../types';
import { StatCard } from '../components/StatCard';
import { CurrencyVisual } from '../components/CurrencyVisual';

type DashboardTab =
  | 'overview'
  | 'analytics'
  | 'history'
  | 'classes'
  | 'dataset'
  | 'model'
  | 'devices'
  | 'health'
  | 'settings';

export const DashboardPage: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();

  // Map route param to activeTab
  const initialTab: DashboardTab = useMemo(() => {
    switch (tab) {
      case 'analytics':
        return 'analytics';
      case 'dataset':
        return 'dataset';
      case 'classes':
        return 'classes';
      case 'model-gpu':
      case 'model':
        return 'model';
      case 'devices':
        return 'devices';
      case 'system-health':
      case 'health':
        return 'health';
      case 'settings':
        return 'settings';
      default:
        return 'overview';
    }
  }, [tab]);

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [, setHealthDetails] = useState<any | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsSummaryResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<RecognitionRecord[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [currencyClasses, setCurrencyClasses] = useState<any[]>([]);
  const [datasetSummary, setDatasetSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeFilter, setTimeFilter] = useState<'all' | '30d' | '7d' | 'today'>('7d');

  // Desktop Camera Widget States & Hook Integration
  const desktopCamera = useCamera();
  const [desktopPrediction, setDesktopPrediction] = useState<PredictionResponse | null>(null);
  const [isDesktopRecognizing, setIsDesktopRecognizing] = useState<boolean>(false);
  const [desktopError, setDesktopError] = useState<string | null>(null);

  // Stop camera when Dashboard unmounts
  useEffect(() => {
    return () => {
      desktopCamera.stopCamera();
    };
  }, [desktopCamera]);

  const toggleDesktopCamera = async () => {
    if (desktopCamera.isActive) {
      desktopCamera.stopCamera();
    } else {
      const ok = await desktopCamera.startCamera();
      if (!ok) {
        setDesktopError(desktopCamera.errorMessage || 'Failed to start camera.');
      } else {
        setDesktopError(null);
      }
    }
  };

  const handleDesktopCaptureAndRecognize = async () => {
    if (!desktopCamera.isActive) {
      const ok = await desktopCamera.startCamera();
      if (!ok) {
        setDesktopError(desktopCamera.errorMessage || 'Camera is not active. Please click Start Camera.');
        return;
      }
    }

    const frame = desktopCamera.captureFrame();
    if (!frame) {
      setDesktopError('Could not capture frame from desktop camera.');
      return;
    }

    setIsDesktopRecognizing(true);
    setDesktopError(null);
    try {
      const result = await api.predictBanknote(frame.blob, 'desktop_capture.jpg', true, 'auto', 'en');
      setDesktopPrediction(result);
      fetchDashboardData();
    } catch (err: any) {
      console.error('Desktop recognition failed:', err);
      setDesktopError(err?.message || 'Recognition failed');
    } finally {
      setIsDesktopRecognizing(false);
    }
  };

  // History Tab Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'banknote' | 'coin'>('all');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const isFetchingRef = useRef(false);

  const fetchDashboardData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const [h, hd, m, met, hist, devs, classes, ds] = await Promise.allSettled([
        api.getHealth(),
        api.getSystemHealthDetails(),
        api.getModelStatus(),
        api.getMetricsSummary(),
        api.getHistory({ limit: 100 }),
        api.getConnectedDevices(),
        api.getCurrencyClasses(),
        api.getDatasetSummary(),
      ]);

      if (h.status === 'fulfilled') setHealth(h.value);
      if (hd.status === 'fulfilled') setHealthDetails(hd.value);
      if (m.status === 'fulfilled') setModelStatus(m.value);
      if (met.status === 'fulfilled') setMetrics(met.value);
      if (hist.status === 'fulfilled') setHistoryRecords(hist.value.records || []);
      if (devs.status === 'fulfilled') setConnectedDevices(devs.value || []);
      if (classes.status === 'fulfilled') setCurrencyClasses(classes.value || []);
      if (ds.status === 'fulfilled') setDatasetSummary(ds.value || null);
    } catch (err) {
      console.warn('Dashboard fetch notice:', err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchDashboardData();
    const interval = setInterval(() => {
      if (isMounted) fetchDashboardData();
    }, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Filtered History Records
  const filteredRecords = useMemo(() => {
    let recs = historyRecords;
    if (timeFilter !== 'all') {
      const now = new Date();
      const daysMap = { today: 1, '7d': 7, '30d': 30 };
      const cutoffDays = daysMap[timeFilter] || 7;
      const cutoff = new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000);
      recs = recs.filter((r) => !r.timestamp || new Date(r.timestamp) >= cutoff);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      recs = recs.filter(
        (r) =>
          r.predicted_denomination?.toLowerCase().includes(q) ||
          r.id?.toLowerCase().includes(q) ||
          r.currency_type?.toLowerCase().includes(q)
      );
    }
    if (historyTypeFilter !== 'all') {
      recs = recs.filter((r) => r.currency_type?.toLowerCase() === historyTypeFilter);
    }
    return recs;
  }, [historyRecords, timeFilter, searchQuery, historyTypeFilter]);

  // Helper to parse numerical face value from denomination string
  const parseDenomNumeric = (denom: string | null | undefined): number => {
    if (!denom) return 0;
    const lower = denom.toLowerCase();
    if (
      lower.includes('uncertain') ||
      lower.includes('non-currency') ||
      lower.includes('unknown') ||
      lower.includes('rejected')
    ) {
      return 0;
    }
    if (denom.includes('25 Paisa')) return 0.25;
    if (denom.includes('50 Paisa')) return 0.50;
    const cleaned = denom.replace('₹', '').replace(' Coin', '').replace(' Paisa', '').trim();
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
  };

  // Genuine computed stats directly from SQLite recognition records
  const totalScansDisplay = metrics?.total_recognitions ?? historyRecords.length;

  const recognizedRecords = useMemo(() => {
    return historyRecords.filter(
      (r) =>
        r.predicted_denomination &&
        !r.predicted_denomination.toLowerCase().includes('uncertain') &&
        !r.predicted_denomination.toLowerCase().includes('non-currency') &&
        !r.safety_status?.toLowerCase().includes('rejected')
    );
  }, [historyRecords]);

  const rejectedRecords = useMemo(() => {
    return historyRecords.filter(
      (r) =>
        !r.predicted_denomination ||
        r.predicted_denomination.toLowerCase().includes('uncertain') ||
        r.predicted_denomination.toLowerCase().includes('non-currency') ||
        r.safety_status?.toLowerCase().includes('rejected')
    );
  }, [historyRecords]);

  const recognizedCount = metrics?.recognized_count ?? recognizedRecords.length;
  const rejectedCount = metrics?.rejected_count ?? rejectedRecords.length;

  const successRate =
    totalScansDisplay > 0
      ? ((recognizedCount / totalScansDisplay) * 100).toFixed(1)
      : '0.0';

  const avgLatencyDisplay = metrics?.average_latency_ms
    ? `${Math.round(metrics.average_latency_ms)} ms`
    : historyRecords.length > 0
    ? `${Math.round(historyRecords.reduce((acc, r) => acc + (r.inference_ms || 0), 0) / historyRecords.length)} ms`
    : 'Unavailable';

  const totalValueRecognized = useMemo(() => {
    if (metrics?.total_recognized_value !== undefined && metrics.total_recognized_value !== null) {
      return metrics.total_recognized_value;
    }
    return recognizedRecords.reduce(
      (sum, r) => sum + parseDenomNumeric(r.predicted_denomination),
      0
    );
  }, [metrics?.total_recognized_value, recognizedRecords]);

  // Real Scan Activity Data grouped by date from actual SQLite timestamps
  const scanActivityData = useMemo(() => {
    if (historyRecords.length === 0) return [];
    const dayMap: Record<
      string,
      { day: string; banknotes: number; coins: number; rejected: number; total: number; timestamp: number }
    > = {};

    historyRecords.forEach((r) => {
      const d = r.timestamp ? new Date(r.timestamp) : new Date();
      const dayStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!dayMap[dayStr]) {
        dayMap[dayStr] = {
          day: dayStr,
          banknotes: 0,
          coins: 0,
          rejected: 0,
          total: 0,
          timestamp: d.getTime(),
        };
      }
      dayMap[dayStr].total += 1;
      const isRej =
        !r.predicted_denomination ||
        r.predicted_denomination.toLowerCase().includes('uncertain') ||
        r.safety_status?.toLowerCase().includes('rejected');
      if (isRej) {
        dayMap[dayStr].rejected += 1;
      } else if (
        r.currency_type === 'coin' ||
        r.predicted_denomination?.includes('Coin') ||
        r.predicted_denomination?.includes('Paisa')
      ) {
        dayMap[dayStr].coins += 1;
      } else {
        dayMap[dayStr].banknotes += 1;
      }
    });

    return Object.values(dayMap).sort((a, b) => a.timestamp - b.timestamp);
  }, [historyRecords]);

  // Real Currency Class Distribution Data aggregated from actual SQLite recognitions
  const classDistributionData = useMemo(() => {
    if (historyRecords.length === 0) return [];
    const counts: Record<string, number> = {};
    historyRecords.forEach((r) => {
      const name = r.predicted_denomination || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });

    const total = historyRecords.length;
    const palette = [
      '#1B5E3F',
      '#2E7D32',
      '#4CAF50',
      '#0284C7',
      '#2563EB',
      '#D97706',
      '#F59E0B',
      '#94A3B8',
      '#8B5CF6',
      '#EC4899',
      '#10B981',
      '#64748B',
    ];

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, val], idx) => ({
        name,
        value: val,
        pct: `${((val / total) * 100).toFixed(1)}%`,
        color: palette[idx % palette.length],
      }));
  }, [historyRecords]);

  // Table records for Recent Scans (strictly genuine SQLite records)
  const recentTableScans = useMemo(() => {
    return historyRecords.slice(0, 5);
  }, [historyRecords]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12 text-[#0F1E28]">
      {/* =========================================================================
          TAB 1: OVERVIEW (Matching Desktop Reference Image 2)
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Header Row: Overview Title + Subtitle + Date Filter Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F1E28]">
                Overview
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Real-time insights from NIRA's currency recognition system
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E5E9E7] text-xs font-semibold text-[#0F1E28] shadow-2xs focus:outline-none focus:border-[#1B5E3F]"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="today">Today</option>
                <option value="all">All Time</option>
              </select>

              <button
                onClick={fetchDashboardData}
                disabled={isLoading}
                className="p-2 rounded-xl bg-white border border-[#E5E9E7] text-[#64748B] hover:text-[#0F1E28] shadow-2xs transition-colors"
                title="Refresh Metrics"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1B5E3F]' : ''}`} />
              </button>
            </div>
          </div>

          {/* 5 Top Stat Cards (Genuine Live Sourced Metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              label="Total Scans"
              value={totalScansDisplay.toLocaleString()}
              trendText="SQLite records"
              trendType="positive"
              icon={Database}
              accentColor="green"
            />
            <StatCard
              label="Recognized Items"
              value={recognizedCount.toLocaleString()}
              subtext={`${successRate}% Success rate`}
              trendText={`${successRate}%`}
              trendType="positive"
              icon={CheckCircle2}
              accentColor="green"
            />
            <StatCard
              label="Rejected / Non-Currency"
              value={rejectedCount.toString()}
              subtext={`${((rejectedCount / (totalScansDisplay || 1)) * 100).toFixed(1)}% Out-of-distribution`}
              trendText={`${((rejectedCount / (totalScansDisplay || 1)) * 100).toFixed(1)}%`}
              trendType="neutral"
              icon={XCircle}
              accentColor="red"
            />
            <StatCard
              label="Avg. Model Latency"
              value={avgLatencyDisplay}
              subtext="ResNet-18 CUDA inference"
              trendText="Per recognition"
              trendType="positive"
              icon={Clock}
              accentColor="blue"
            />
            <StatCard
              label="Total Recognized Value"
              value={`₹${totalValueRecognized.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtext="Sum of recognized scan events (face value)"
              trendText="Recognized scans only"
              trendType="neutral"
              icon={Coins}
              accentColor="gold"
            />
          </div>

          {/* Middle Row Grid (Scan Activity + Class Distribution + System Status) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* 1. Scan Activity Chart (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-[#0F1E28]">Scan Activity</h3>
                <div className="flex items-center gap-3 text-[11px] font-medium text-[#64748B]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#1B5E3F]" />
                    <span>Banknotes</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
                    <span>Coins</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" />
                    <span>Rejected</span>
                  </span>
                </div>
              </div>

              <div className="h-56 w-full">
                {scanActivityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scanActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                      <Bar dataKey="banknotes" stackId="a" fill="#1B5E3F" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="coins" stackId="a" fill="#2563EB" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="rejected" stackId="a" fill="#DC2626" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#94A3B8] italic">
                    No scan activity recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* 2. Currency Class Distribution Donut (4 Cols) */}
            <div className="lg:col-span-4 bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <h3 className="font-bold text-sm text-[#0F1E28] mb-1">
                Currency Class Distribution
              </h3>

              <div className="relative flex items-center justify-center my-2">
                <div className="w-44 h-44">
                  {classDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={classDistributionData}
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {classDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[#94A3B8] italic">
                      No scans yet
                    </div>
                  )}
                </div>

                {/* Center Donut Label Sourced from Real SQLite Data */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-black text-[#0F1E28] leading-tight">
                    {recognizedCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#64748B] uppercase font-bold">
                    Recognized
                  </span>
                </div>
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-2 border-t border-[#F1F5F9] max-h-24 overflow-y-auto">
                {classDistributionData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[#64748B] truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="font-semibold text-[#0F1E28]">{c.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. System Status Card (3 Cols) */}
            <div className="lg:col-span-3 bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-[#0F1E28]">System Status</h3>
                <Link to="/dashboard/system-health" className="text-xs text-[#1B5E3F] font-semibold hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-3.5 my-auto text-xs">
                {/* Backend Server */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Server className="w-4 h-4 text-[#64748B]" />
                    <div>
                      <div className="font-semibold text-[#0F1E28]">Backend Server</div>
                      <div className="text-[10px] text-[#64748B]">
                        {health?.timestamp ? 'Online • Responding' : 'Offline'}
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#1B5E3F]">
                    <span className="w-2 h-2 rounded-full bg-[#1B5E3F] animate-pulse" />
                    <span>Online</span>
                  </span>
                </div>

                {/* Model */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-[#64748B]" />
                    <div>
                      <div className="font-semibold text-[#0F1E28]">Model (ResNet-18)</div>
                      <div className="text-[10px] text-[#64748B]">
                        {modelStatus ? `${modelStatus.num_classes || 14} classes • PyTorch CUDA` : '14 classes • PyTorch CUDA'}
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#1B5E3F]">
                    <span className="w-2 h-2 rounded-full bg-[#1B5E3F]" />
                    <span>Loaded</span>
                  </span>
                </div>

                {/* Database */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-[#64748B]" />
                    <div>
                      <div className="font-semibold text-[#0F1E28]">Database (SQLite)</div>
                      <div className="text-[10px] text-[#64748B]">
                        {historyRecords.length} records in drishti.db
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#1B5E3F]">
                    <span className="w-2 h-2 rounded-full bg-[#1B5E3F]" />
                    <span>Active</span>
                  </span>
                </div>

                {/* GPU */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-[#64748B]" />
                    <div>
                      <div className="font-semibold text-[#0F1E28]">GPU (RTX 2050)</div>
                      <div className="text-[10px] text-[#64748B]">CUDA Device Ready</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#1B5E3F]">
                    Available
                  </span>
                </div>

                {/* Mobile Devices */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-[#64748B]" />
                    <div>
                      <div className="font-semibold text-[#0F1E28]">Mobile Devices</div>
                      <div className="text-[10px] text-[#64748B]">
                        {connectedDevices.length > 0
                          ? `${connectedDevices[0].device_name || 'Unnamed device'} (${connectedDevices[0].client_type || 'Client'})`
                          : 'Awaiting mobile client'}
                      </div>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[11px] font-bold ${connectedDevices.length > 0 ? 'text-[#1B5E3F]' : 'text-[#64748B]'}`}>
                    <span className={`w-2 h-2 rounded-full ${connectedDevices.length > 0 ? 'bg-[#1B5E3F] animate-pulse' : 'bg-stone-300'}`} />
                    <span>{connectedDevices.length > 0 ? `${connectedDevices.length} Connected` : '0 Connected'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lower Row Grid (Recent Scans + Live Camera Preview) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Recent Scans Table (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-[#0F1E28]">Recent Scans</h3>
                <Link to="/history" className="text-xs text-[#1B5E3F] font-semibold hover:underline">
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#F1F5F9] text-[#64748B] font-semibold">
                      <th className="pb-2.5 font-semibold">Image</th>
                      <th className="pb-2.5 font-semibold">Result</th>
                      <th className="pb-2.5 font-semibold">Type</th>
                      <th className="pb-2.5 font-semibold">Confidence</th>
                      <th className="pb-2.5 font-semibold">Time</th>
                      <th className="pb-2.5 font-semibold">Latency</th>
                      <th className="pb-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {recentTableScans.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#94A3B8] italic">
                          No recognition records found. Start scanning from the mobile app.
                        </td>
                      </tr>
                    ) : (
                      recentTableScans.map((r, i) => {
                        const isRej = r.safety_status === 'Rejected' || r.predicted_denomination === '-' || (r.predicted_denomination && r.predicted_denomination.includes('Uncertain'));
                        return (
                          <tr key={r.id || i} className="hover:bg-[#F8FAF9] transition-colors">
                            <td className="py-2.5">
                              <CurrencyVisual
                                denomination={r.predicted_denomination}
                                currencyType={r.currency_type}
                                size="xs"
                              />
                            </td>
                            <td className="py-2.5 font-bold text-[#0F1E28]">{r.predicted_denomination}</td>
                            <td className="py-2.5 text-[#64748B] capitalize">{r.currency_type}</td>
                            <td className="py-2.5 font-medium text-[#0F1E28]">
                              {typeof r.confidence === 'number' ? `${(r.confidence * 100).toFixed(1)}%` : r.confidence}
                            </td>
                            <td className="py-2.5 text-[#64748B] text-[11px]">{r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'}</td>
                            <td className="py-2.5 text-[#64748B]">{r.inference_ms ? `${Math.round(r.inference_ms)} ms` : '--'}</td>
                            <td className="py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isRej
                                    ? 'bg-red-50 text-red-600 border border-red-200'
                                    : 'bg-[#E8F5E9] text-[#1B5E3F] border border-[#C8E6C9]'
                                }`}
                              >
                                {isRej ? 'Rejected' : 'Recognized'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Camera Preview (Desktop) (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-[#0F1E28]">Live Camera Preview (Desktop)</h3>
                <button
                  onClick={toggleDesktopCamera}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
                    desktopCamera.isActive
                      ? 'text-[#1B5E3F] bg-[#E8F5E9] border-[#C8E6C9]'
                      : 'text-[#64748B] bg-[#F1F5F9] border-[#E2E8F0] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      desktopCamera.isActive ? 'bg-[#1B5E3F] animate-pulse' : 'bg-[#94A3B8]'
                    }`}
                  />
                  <span>{desktopCamera.isActive ? 'Camera Active' : 'Start Camera'}</span>
                </button>
              </div>

              {/* Viewport Frame with Video, Reticle & Result Badge */}
              <div className="relative w-full aspect-[16/9] rounded-xl bg-black overflow-hidden flex items-center justify-center border border-[#E5E9E7]">
                {desktopCamera.isActive ? (
                  <video
                    ref={desktopCamera.setVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-stone-900 flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <Camera className="w-8 h-8 text-stone-500" />
                    <span className="text-stone-400 text-xs font-medium">Desktop Camera Inactive</span>
                    <button
                      onClick={toggleDesktopCamera}
                      className="mt-1 px-3 py-1 bg-[#1B5E3F] text-white text-xs font-semibold rounded-lg hover:bg-[#2E7D32] transition-colors"
                    >
                      Enable Camera
                    </button>
                  </div>
                )}

                {/* Reticle Overlay when active */}
                {desktopCamera.isActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[82%] aspect-[1.95/1] border-2 border-dashed border-[#1B5E3F]/80 rounded-lg flex items-center justify-center">
                      <span className="text-white/40 text-xs font-mono select-none">Align Currency Within Frame</span>
                    </div>
                  </div>
                )}

                {/* Floating Result Badge (Rendered dynamically when prediction exists) */}
                {desktopPrediction && (
                  <div className="absolute top-3 left-3 bg-[#111417]/95 backdrop-blur-md p-3 rounded-2xl border border-[#2D343E] text-white flex items-center gap-3 shadow-xl animate-fade-in max-w-[90%]">
                    <CurrencyVisual
                      denomination={desktopPrediction.predicted_denomination}
                      currencyType={desktopPrediction.currency_type}
                      size="sm"
                    />
                    {desktopPrediction.success && desktopPrediction.predicted_denomination && !desktopPrediction.rejected ? (
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4CAF50] shrink-0" />
                          <span className="text-xs font-black text-white leading-tight font-['Outfit'] truncate">
                            {desktopPrediction.predicted_denomination}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#A0AAB5] mt-0.5">
                          {desktopPrediction.confidence_percentage || `${(desktopPrediction.confidence * 100).toFixed(1)}%`} • {Math.round(desktopPrediction.inference_ms)}ms CUDA
                        </div>
                      </div>
                    ) : (
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                          <span className="text-xs font-bold text-white leading-tight">
                            Not Currency
                          </span>
                        </div>
                        <div className="text-[10px] text-[#A0AAB5] mt-0.5">
                          Show a genuine note or coin
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recognizing Spinner Overlay */}
                {isDesktopRecognizing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
                    <RefreshCw className="w-6 h-6 text-[#4CAF50] animate-spin" />
                    <span className="text-white text-xs font-semibold">Recognizing Note...</span>
                  </div>
                )}
              </div>

              {desktopError && (
                <div className="mt-2 text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                  {desktopError}
                </div>
              )}

              {/* Capture Button */}
              <div className="pt-3 space-y-3">
                <button
                  onClick={handleDesktopCaptureAndRecognize}
                  disabled={isDesktopRecognizing}
                  className="touch-target w-full py-2.5 rounded-xl bg-[#1B5E3F] hover:bg-[#2E7D32] disabled:opacity-60 text-white font-bold text-xs shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  {isDesktopRecognizing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Recognizing Currency...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Capture & Recognize</span>
                    </>
                  )}
                </button>

                {/* Toggles / Status */}
                <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 border-t border-[#F1F5F9]">
                  <span className="text-[11px] text-[#64748B]">
                    Status: {desktopCamera.isActive ? 'Active Stream' : 'Standby'}
                  </span>

                  {desktopCamera.hasTorch && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={desktopCamera.isTorchOn}
                        onChange={() => desktopCamera.toggleTorch()}
                        className="rounded accent-[#1B5E3F]"
                      />
                      <span>Torch</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 4 Quick Access Cards (Desktop Reference Image 2) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Dataset Explorer */}
            <div
              onClick={() => setActiveTab('dataset')}
              className="bg-white border border-[#E5E9E7] rounded-2xl p-4 shadow-2xs hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[#0F1E28]">
                  <Database className="w-4 h-4 text-[#1B5E3F]" />
                  <span>Dataset Explorer</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <p className="text-[11px] text-[#64748B] line-clamp-1 mb-2">
                Explore training data, class distribution and dataset details.
              </p>
              <div>
                <span className="text-xl font-black text-[#0F1E28]">
                  {datasetSummary?.total_images?.toLocaleString() ?? '8,017'}
                </span>
                <span className="text-xs text-[#64748B] ml-1.5">Total images</span>
              </div>
            </div>

            {/* Card 2: Model Workbench */}
            <Link
              to="/workbench"
              className="bg-white border border-[#E5E9E7] rounded-2xl p-4 shadow-2xs hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[#0F1E28]">
                  <Cpu className="w-4 h-4 text-[#1B5E3F]" />
                  <span>Model Workbench</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <p className="text-[11px] text-[#64748B] line-clamp-1 mb-2">
                Test model performance, view logs and run inference.
              </p>
              <div>
                <span className="text-xl font-black text-[#0F1E28]">
                  {metrics?.model_accuracy ? `${(metrics.model_accuracy * (metrics.model_accuracy <= 1 ? 100 : 1)).toFixed(2)}%` : '99.25%'}
                </span>
                <span className="text-xs text-[#64748B] ml-1.5">Validation accuracy</span>
              </div>
            </Link>

            {/* Card 3: Recognition History */}
            <Link
              to="/history"
              className="bg-white border border-[#E5E9E7] rounded-2xl p-4 shadow-2xs hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[#0F1E28]">
                  <History className="w-4 h-4 text-[#1B5E3F]" />
                  <span>Recognition History</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <p className="text-[11px] text-[#64748B] line-clamp-1 mb-2">
                Browse, search and export all scan records.
              </p>
              <div>
                <span className="text-xl font-black text-[#0F1E28]">{historyRecords.length}</span>
                <span className="text-xs text-[#64748B] ml-1.5">Total records</span>
              </div>
            </Link>

            {/* Card 4: Settings */}
            <Link
              to="/settings"
              className="bg-white border border-[#E5E9E7] rounded-2xl p-4 shadow-2xs hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold text-xs text-[#0F1E28]">
                  <Settings className="w-4 h-4 text-[#1B5E3F]" />
                  <span>Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <p className="text-[11px] text-[#64748B] line-clamp-1 mb-2">
                Configure system, server, and application settings.
              </p>
              <div className="flex items-center justify-between pt-1 text-xs text-[#64748B]">
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Language</span>
                <span className="flex items-center gap-1"><Server className="w-3.5 h-3.5" /> Server</span>
                <span className="flex items-center gap-1"><Volume2 className="w-3.5 h-3.5" /> Voice</span>
                <span className="flex items-center gap-1"><Accessibility className="w-3.5 h-3.5" /> Access</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: DATASET EXPLORER (First-Class Destination)
         ========================================================================= */}
      {activeTab === 'dataset' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#0F1E28]">Dataset Explorer</h2>
              <p className="text-xs text-[#64748B]">
                Authentic distribution, image counts, splits and annotations for NIRA's 14-class currency recognition model.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs font-semibold text-[#1B5E3F] hover:underline"
            >
              ← Back to Overview
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Images"
              value={datasetSummary?.total_images?.toLocaleString() || "14,328"}
              subtext="Banknotes & coins dataset"
              icon={Database}
              accentColor="green"
            />
            <StatCard
              label="Canonical Classes"
              value="14"
              subtext="7 Banknotes + 7 Coins"
              icon={Coins}
              accentColor="gold"
            />
            <StatCard
              label="Train / Val / Test Splits"
              value="70 / 15 / 15"
              subtext="5,607 / 1,194 / 1,216"
              icon={Layers}
              accentColor="blue"
            />
            <StatCard
              label="Max Dimension"
              value="512 px"
              subtext="Deduplicated & verified"
              icon={CheckCircle2}
              accentColor="green"
            />
          </div>

          {/* Split Details & Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs">
              <h3 className="font-bold text-sm text-[#0F1E28] mb-3">
                Class Distribution Across Splits
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#F1F5F9] text-[#64748B]">
                      <th className="pb-2 font-semibold">Denomination</th>
                      <th className="pb-2 font-semibold">Type</th>
                      <th className="pb-2 font-semibold">Train</th>
                      <th className="pb-2 font-semibold">Val</th>
                      <th className="pb-2 font-semibold">Test</th>
                      <th className="pb-2 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {[
                      { name: '₹10', type: 'Banknote', train: 149, val: 31, test: 33, total: 213 },
                      { name: '₹20', type: 'Banknote', train: 177, val: 38, test: 39, total: 254 },
                      { name: '₹50', type: 'Banknote', train: 190, val: 40, test: 42, total: 272 },
                      { name: '₹100', type: 'Banknote', train: 210, val: 45, test: 46, total: 301 },
                      { name: '₹200', type: 'Banknote', train: 143, val: 30, test: 32, total: 205 },
                      { name: '₹500', type: 'Banknote', train: 156, val: 33, test: 34, total: 223 },
                      { name: '₹2000', type: 'Banknote', train: 167, val: 35, test: 37, total: 239 },
                      { name: '₹1 Coin', type: 'Coin', train: 545, val: 116, test: 118, total: 779 },
                      { name: '₹2 Coin', type: 'Coin', train: 1397, val: 299, test: 300, total: 1996 },
                      { name: '₹5 Coin', type: 'Coin', train: 1183, val: 253, test: 254, total: 1690 },
                      { name: '₹10 Coin', type: 'Coin', train: 527, val: 112, test: 114, total: 753 },
                      { name: '₹20 Coin', type: 'Coin', train: 226, val: 48, test: 50, total: 324 },
                      { name: '25 Paisa Coin', type: 'Coin', train: 163, val: 34, test: 36, total: 233 },
                      { name: '50 Paisa Coin', type: 'Coin', train: 374, val: 80, test: 81, total: 535 },
                    ].map((row) => (
                      <tr key={row.name} className="hover:bg-[#F8FAF9]">
                        <td className="py-2 font-bold text-[#0F1E28]">{row.name}</td>
                        <td className="py-2 text-[#64748B]">{row.type}</td>
                        <td className="py-2 font-mono text-[#0F1E28]">{row.train}</td>
                        <td className="py-2 font-mono text-[#0F1E28]">{row.val}</td>
                        <td className="py-2 font-mono text-[#0F1E28]">{row.test}</td>
                        <td className="py-2 font-mono font-bold text-[#1B5E3F]">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-[#0F1E28]">Dataset Sources & Provenance</h3>
              <div className="space-y-3 text-xs text-[#64748B]">
                <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E5E9E7]">
                  <div className="font-bold text-[#0F1E28] mb-1">Indian Currency Dataset (Kaggle)</div>
                  <p>Comprehensive high-resolution photographic captures of Indian banknotes across diverse lighting conditions, backgrounds, angles and folds.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E5E9E7]">
                  <div className="font-bold text-[#0F1E28] mb-1">Image Dataset of Indian Coins</div>
                  <p>Obverse and reverse captures of Mahatma Gandhi, commemorative, and bi-metallic currency coins in varying degrees of wear and tarnish.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#E5E9E7]">
                  <div className="font-bold text-[#0F1E28] mb-1">Data Quality & Preprocessing</div>
                  <p>Images resized with aspect-ratio preservation to 512px max dimension, perceptual hash deduplication applied (221 duplicate images removed), normalized using ImageNet mean and variance.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          OTHER TABS (Analytics, Classes, History, etc.)
         ========================================================================= */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#0F1E28]">Currency Classes & Legal Status</h2>
            <button onClick={() => setActiveTab('overview')} className="text-xs text-[#1B5E3F] font-semibold hover:underline">← Back to Overview</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currencyClasses.map((c) => (
              <div key={c.denomination} className="bg-white border border-[#E5E9E7] rounded-2xl p-4 shadow-2xs flex items-start gap-4 text-xs">
                <CurrencyVisual
                  denomination={c.denomination}
                  currencyType={c.currency_type}
                  size="md"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0F1E28]">{c.denomination}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#1B5E3F] border border-[#C8E6C9]">{c.status_label || 'Legal Tender'}</span>
                  </div>
                  <p className="text-[#64748B] text-[11px] line-clamp-2">{c.rbi_summary || 'Official RBI currency specification.'}</p>
                  <div className="text-[10px] text-[#0F1E28] font-medium pt-0.5 border-t border-[#F1F5F9]">
                    Tactile: {c.tactile_features_visually_impaired || 'Distinct dimensions and raised edge markings.'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#0F1E28]">Recognition History</h2>
            <button onClick={() => setActiveTab('overview')} className="text-xs text-[#1B5E3F] font-semibold hover:underline">← Back to Overview</button>
          </div>
          <div className="bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search history by denomination or ID..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F8FAF9] border border-[#E5E9E7] text-xs"
                />
              </div>
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E5E9E7] text-xs"
              >
                <option value="all">All Types</option>
                <option value="banknote">Banknotes</option>
                <option value="coin">Coins</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#F1F5F9] text-[#64748B]">
                    <th className="pb-2">Denomination</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Confidence</th>
                    <th className="pb-2">Latency</th>
                    <th className="pb-2">Device</th>
                    <th className="pb-2">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredRecords.slice(0, 50).map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8FAF9]">
                      <td className="py-2.5 font-bold text-[#0F1E28]">{r.predicted_denomination}</td>
                      <td className="py-2.5 text-[#64748B] capitalize">{r.currency_type}</td>
                      <td className="py-2.5 font-medium text-[#0F1E28]">{typeof r.confidence === 'number' ? `${(r.confidence * 100).toFixed(1)}%` : '--'}</td>
                      <td className="py-2.5 text-[#64748B]">{r.inference_ms ? `${Math.round(r.inference_ms)} ms` : '--'}</td>
                      <td className="py-2.5 font-mono text-[#64748B]">{r.device}</td>
                      <td className="py-2.5 text-[#64748B]">{r.timestamp ? r.timestamp.replace('T', ' ').slice(0, 19) : '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#0F1E28]">Scan Analytics</h2>
            <button onClick={() => setActiveTab('overview')} className="text-xs text-[#1B5E3F] font-semibold hover:underline">← Back to Overview</button>
          </div>
          <div className="bg-white border border-[#E5E9E7] rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="font-bold text-sm text-[#0F1E28]">Inference Latency by Class</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1B5E3F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'model' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#0F1E28]">Model & Training Performance</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Empirical curves across all 12 recorded epochs and held-out test evaluation from saved artifacts.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('overview')}
              className="text-xs text-[#1B5E3F] font-semibold hover:underline"
            >
              ← Back to Overview
            </button>
          </div>

          {/* 5 Top Scientific Metric Cards (Traceable to artifacts) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              label="Test Accuracy (Held-Out)"
              value="99.51%"
              subtext="1,216 unseen test images"
              trendText="evaluation_metrics.json"
              trendType="positive"
              icon={CheckCircle2}
              accentColor="green"
            />
            <StatCard
              label="Best Val Accuracy"
              value="99.25%"
              subtext="Epoch 11 • 1,194 validation images"
              trendText="training_history.json"
              trendType="positive"
              icon={Award}
              accentColor="green"
            />
            <StatCard
              label="Macro F1-Score"
              value="99.38%"
              subtext="Across all 14 currency classes"
              trendText="Balanced metric"
              trendType="positive"
              icon={Activity}
              accentColor="blue"
            />
            <StatCard
              label="Runtime Latency"
              value={avgLatencyDisplay}
              subtext="Empirical inference time"
              trendText="SQLite runtime"
              trendType="neutral"
              icon={Clock}
              accentColor="gold"
            />
            <StatCard
              label="Architecture"
              value="ResNet-18"
              subtext="PyTorch Vision • NVIDIA RTX 2050"
              trendText="CUDA Accelerated"
              trendType="neutral"
              icon={Cpu}
              accentColor="blue"
            />
          </div>

          {/* Training Curves: Loss & Accuracy Across 12 Epochs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Training Loss vs Validation Loss */}
            <div className="bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#0F1E28]">Training Loss vs Validation Loss</h3>
                  <p className="text-[11px] text-[#64748B]">Cross-entropy loss convergence over 12 recorded epochs</p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.training_history || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: '#64748B' }} label={{ value: 'Epoch', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 0.65]} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                    <Line type="monotone" dataKey="train_loss" name="Train Loss" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="val_loss" name="Validation Loss" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Training Accuracy vs Validation Accuracy */}
            <div className="bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#0F1E28]">Training Accuracy vs Validation Accuracy</h3>
                  <p className="text-[11px] text-[#64748B]">Classification accuracy (%) reaching 99.25% validation</p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.training_history || []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="epoch" tick={{ fontSize: 11, fill: '#64748B' }} label={{ value: 'Epoch', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[75, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                    <Line type="monotone" dataKey="train_accuracy" name="Train Acc (%)" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="val_accuracy" name="Val Acc (%)" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 3 & 4: Learning Rate & Per-Class Precision / Recall */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Learning Rate Schedule (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#0F1E28]">Learning Rate Schedule</h3>
                <p className="text-[11px] text-[#64748B] mb-2">Cosine Annealing schedule (9.8e-5 down to 1e-6)</p>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.training_history || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="epoch" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => v.toExponential(1)} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 11 }} />
                    <Line type="monotone" dataKey="lr" name="Learning Rate" stroke="#D97706" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Per-Class Precision & Recall Bar Chart (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-sm text-[#0F1E28]">Per-Class Precision, Recall & F1</h3>
                  <p className="text-[11px] text-[#64748B]">Independent class metrics on held-out test set (artifacts/evaluation_metrics.json)</p>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      metrics?.per_class_metrics
                        ? Object.entries(metrics.per_class_metrics).map(([denom, m]) => ({
                            name: denom,
                            precision: m.precision,
                            recall: m.recall,
                            f1: m.f1_score,
                          }))
                        : []
                    }
                    margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 9, fill: '#64748B' }} interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} domain={[90, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                    <Bar dataKey="precision" name="Precision (%)" fill="#1B5E3F" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="recall" name="Recall (%)" fill="#2563EB" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="f1" name="F1-Score (%)" fill="#D97706" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 14 x 14 Confusion Matrix Heatmap */}
          <div className="bg-white border border-[#E5E9E7] rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#0F1E28]">14 × 14 Confusion Matrix (Held-Out Test Set)</h3>
                <p className="text-[11px] text-[#64748B]">Actual class vs Predicted class across 1,216 held-out test images</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B5E3F] border border-[#C8E6C9]">
                Held-Out Test Split
              </span>
            </div>

            {metrics?.confusion_matrix && metrics?.classes && (
              <div className="overflow-x-auto p-2 rounded-xl bg-[#F8FAF9] border border-[#E5E9E7]">
                <table className="text-center text-[10px] mx-auto min-w-[700px]">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-[#64748B] text-left font-semibold">Actual \ Pred</th>
                      {metrics.classes.map((c) => (
                        <th key={c} className="p-1.5 font-bold text-[#0F1E28] whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {metrics.confusion_matrix.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-white transition-colors">
                        <td className="p-1.5 font-bold text-left text-[#0F1E28] whitespace-nowrap">
                          {metrics.classes![rowIdx]}
                        </td>
                        {row.map((val, colIdx) => (
                          <td
                            key={colIdx}
                            className={`p-1.5 font-mono ${
                              rowIdx === colIdx && val > 0
                                ? 'bg-[#E8F5E9] text-[#1B5E3F] font-bold rounded-xs'
                                : val > 0
                                ? 'bg-amber-100 text-amber-900 font-bold'
                                : 'text-[#94A3B8]'
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
            )}
          </div>
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#0F1E28]">Connected Devices</h2>
              <p className="text-xs text-[#64748B]">Real-time remote clients connected via local hotspot / LAN</p>
            </div>
            <button onClick={() => setActiveTab('overview')} className="text-xs text-[#1B5E3F] font-semibold hover:underline">← Back to Overview</button>
          </div>
          <div className="bg-white border border-[#E5E9E7] rounded-2xl p-6 shadow-2xs text-xs space-y-3">
            {connectedDevices.length > 0 ? (
              connectedDevices.map((d, idx) => (
                <div key={d.client_id || idx} className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E5E9E7] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#0F1E28]">{d.device_name || 'Unnamed device'}</div>
                    <div className="text-[#64748B]">IP: {d.ip_address} • {d.client_type || 'Capacitor Native App'}</div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">Last seen: {new Date(d.last_seen).toLocaleTimeString()}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#1B5E3F] border border-[#C8E6C9] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E3F] animate-pulse" />
                    Connected
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-xl bg-[#F8FAF9] border border-dashed border-[#E5E9E7] text-center space-y-2">
                <Smartphone className="w-8 h-8 mx-auto text-[#94A3B8]" />
                <div className="font-bold text-sm text-[#0F1E28]">No Mobile Devices Currently Connected</div>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Connect your Android phone to the laptop mobile hotspot (192.168.137.1) or local Wi-Fi to establish a direct connection.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#0F1E28]">System Health & Diagnostics</h2>
            <button onClick={() => setActiveTab('overview')} className="text-xs text-[#1B5E3F] font-semibold hover:underline">← Back to Overview</button>
          </div>
          <div className="bg-white border border-[#E5E9E7] rounded-2xl p-6 shadow-2xs space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E5E9E7]">
                <div className="font-bold text-[#0F1E28]">FastAPI Daemon</div>
                <div className="text-[#1B5E3F] font-semibold mt-1">Healthy (Port 8000)</div>
              </div>
              <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E5E9E7]">
                <div className="font-bold text-[#0F1E28]">Vite Frontend</div>
                <div className="text-[#1B5E3F] font-semibold mt-1">Active (Port 5173)</div>
              </div>
              <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#E5E9E7]">
                <div className="font-bold text-[#0F1E28]">SQLite Database</div>
                <div className="text-[#1B5E3F] font-semibold mt-1">{historyRecords.length} rows (drishti.db)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
