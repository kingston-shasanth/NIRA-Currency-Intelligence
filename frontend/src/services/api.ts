import { Capacitor } from '@capacitor/core';
import type {
  HealthResponse,
  ModelStatusResponse,
  MetricsSummaryResponse,
  HistoryResponse,
  PredictionResponse,
  TrainingStatusResponse,
  DatasetAuditResponse,
  CheckpointInfo,
  EvaluationResults,
  SystemTelemetry,
} from '../types';

export const SERVER_URL_STORAGE_KEY = 'nira_server_url';
export const LEGACY_SERVER_URL_STORAGE_KEY = 'drishti_server_url';

/**
 * Returns true if running within the Capacitor native Android/iOS WebView container.
 */
export function isCapacitorNative(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    return true;
  }
  const isCap = (window as any).Capacitor?.isNativePlatform?.();
  const isCapProtocol = window.location.protocol === 'capacitor:' || window.location.origin.includes('capacitor://');
  const hasNativeBridge = Boolean((window as any).NativeTTS || (window as any).androidBridge);
  return Boolean(isCap || isCapProtocol || hasNativeBridge);
}

/**
 * Returns the effective API base URL.
 * Defaults to:
 * - LocalStorage stored value (if user configured a custom laptop IP)
 * - If on native Android app: uses stored custom URL or default LAN endpoint
 * - '/api' for localhost desktop browser development (via Vite proxy)
 * - 'http://<window.location.hostname>:8000/api' if accessing Vite dev server from phone browser over Wi-Fi
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom =
      localStorage.getItem(SERVER_URL_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_SERVER_URL_STORAGE_KEY);

    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }

    // Running inside native Capacitor Android app:
    // In Android WebView, hostname is 'localhost', which is the PHONE itself, not the laptop!
    // Connect to laptop hotspot interface (OPPO F25 Pro to laptop hotspot: 192.168.137.1)
    if (isCapacitorNative()) {
      return 'http://192.168.137.1:8000/api';
    }

    // Localhost / loopback desktop development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return '/api';
    }

    // Mobile browser on LAN: point directly to FastAPI backend on laptop port 8000
    if (window.location.hostname) {
      return `http://${window.location.hostname}:8000/api`;
    }
  }
  return '/api';
}

/**
 * Normalizes and stores a new backend server URL in localStorage.
 */
export function setApiBaseUrl(url: string): string {
  let cleaned = url.trim().replace(/\/+$/, '');
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `http://${cleaned}`;
  }
  if (!cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(SERVER_URL_STORAGE_KEY, cleaned);
    localStorage.setItem(LEGACY_SERVER_URL_STORAGE_KEY, cleaned);
  }
  return cleaned;
}

/**
 * Resets the server URL back to automatic discovery.
 */
export function resetApiBaseUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SERVER_URL_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SERVER_URL_STORAGE_KEY);
  }
}

/**
 * Returns dynamic client identity headers from persisted device configuration.
 */
export function getClientHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    let devName = 'Unnamed device';
    let devId = localStorage.getItem('nira_device_id');
    if (!devId) {
      devId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('nira_device_id', devId);
    }
    const rawSettings =
      localStorage.getItem('nira_settings_v2') ||
      localStorage.getItem('nira_settings') ||
      localStorage.getItem('nira_settings_v1');
    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings);
        if (parsed.deviceName && parsed.deviceName.trim()) {
          devName = parsed.deviceName.trim();
        } else if (parsed.userName && parsed.userName.trim()) {
          devName = `${parsed.userName.trim()}'s Device`;
        }
      } catch {}
    }
    headers['X-Device-Name'] = devName;
    headers['X-Device-Id'] = devId;
    if (isCapacitorNative()) {
      headers['X-Client-Type'] = 'Android Native App (Capacitor)';
    } else if (window.innerWidth < 768) {
      headers['X-Client-Type'] = 'Mobile Browser';
    } else {
      headers['X-Client-Type'] = 'Desktop Workstation';
    }
  }
  return headers;
}

/**
 * Performs a real health-check ping to verify if the laptop backend is responding.
 */
export async function testServerConnection(customBaseUrl?: string): Promise<{
  ok: boolean;
  latencyMs: number;
  data?: HealthResponse;
  error?: string;
}> {
  const base = customBaseUrl ? customBaseUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
  const url = `${base}/health`;
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(url, {
      headers: getClientHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = (await res.json()) as HealthResponse;
      return { ok: true, latencyMs: Math.round(performance.now() - start), data };
    }
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      error: `Server responded with status ${res.status}`,
    };
  } catch {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      error: 'NIRA server is not running. Start NIRA on your laptop and reconnect.',
    };
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errorDetail = text;
    }
    throw new Error(errorDetail || `API Error (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiBaseUrl,
  testServerConnection,
  isCapacitorNative,

  async getHealth(signal?: AbortSignal): Promise<HealthResponse> {
    const res = await fetch(`${getApiBaseUrl()}/health`, { signal });
    return handleResponse<HealthResponse>(res);
  },

  async getModelStatus(signal?: AbortSignal): Promise<ModelStatusResponse> {
    const res = await fetch(`${getApiBaseUrl()}/model/status`, { signal });
    return handleResponse<ModelStatusResponse>(res);
  },

  async getMetricsSummary(signal?: AbortSignal): Promise<MetricsSummaryResponse> {
    const res = await fetch(`${getApiBaseUrl()}/metrics/summary`, { signal });
    return handleResponse<MetricsSummaryResponse>(res);
  },

  async getHistory(
    params?: { search?: string; denomination?: string; currency_type?: string; limit?: number; offset?: number },
    signal?: AbortSignal
  ): Promise<HistoryResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.denomination) query.set('denomination', params.denomination);
    if (params?.currency_type && params.currency_type !== 'All') query.set('currency_type', params.currency_type);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());

    const qs = query.toString();
    const url = `${getApiBaseUrl()}/history${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { signal });
    return handleResponse<HistoryResponse>(res);
  },

  async getCurrencyStatus(denomination: string, signal?: AbortSignal) {
    const res = await fetch(`${getApiBaseUrl()}/currency/status/${encodeURIComponent(denomination)}`, { signal });
    return handleResponse<any>(res);
  },

  async getCurrencyClasses(signal?: AbortSignal): Promise<any[]> {
    const res = await fetch(`${getApiBaseUrl()}/currency/classes`, { signal });
    return handleResponse<any[]>(res);
  },

  async getDatasetSummary(signal?: AbortSignal): Promise<any> {
    const res = await fetch(`${getApiBaseUrl()}/dataset/summary`, { signal });
    return handleResponse<any>(res);
  },

  async getSystemHealthDetails(signal?: AbortSignal): Promise<any> {
    const res = await fetch(`${getApiBaseUrl()}/system/health/details`, { signal });
    return handleResponse<any>(res);
  },

  async predictBanknote(
    file: File | Blob,
    filename: string = 'currency.jpg',
    explain: boolean = true,
    mode: 'auto' | 'banknote' | 'coin' = 'auto',
    language: string = 'en',
    signal?: AbortSignal
  ): Promise<PredictionResponse> {
    const formData = new FormData();
    formData.append('file', file, filename);

    const url = `${getApiBaseUrl()}/predict?explain=${explain ? 'true' : 'false'}&mode=${mode}&language=${language}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getClientHeaders(),
      body: formData,
      signal,
    });
    return handleResponse<PredictionResponse>(res);
  },

  // =========================================================================
  // MODEL WORKBENCH & WORKSTATION METHODS
  // =========================================================================

  async getTrainingStatus(signal?: AbortSignal): Promise<TrainingStatusResponse> {
    const res = await fetch(`${getApiBaseUrl()}/training/status`, { signal });
    return handleResponse<TrainingStatusResponse>(res);
  },

  async startTraining(
    config: {
      splits_dir?: string;
      epochs?: number;
      batch_size?: number;
      lr?: number;
      optimizer?: string;
      patience?: number;
      device?: string;
      architecture?: string;
    },
    signal?: AbortSignal
  ): Promise<{ status: string; job_id: string }> {
    const res = await fetch(`${getApiBaseUrl()}/training/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
      signal,
    });
    return handleResponse<{ status: string; job_id: string }>(res);
  },

  async stopTraining(signal?: AbortSignal): Promise<{ status: string; message?: string }> {
    const res = await fetch(`${getApiBaseUrl()}/training/stop`, {
      method: 'POST',
      signal,
    });
    return handleResponse<{ status: string; message?: string }>(res);
  },

  async auditDataset(
    datasetPath: string = 'data/raw',
    signal?: AbortSignal
  ): Promise<DatasetAuditResponse> {
    const res = await fetch(`${getApiBaseUrl()}/dataset/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_path: datasetPath }),
      signal,
    });
    return handleResponse<DatasetAuditResponse>(res);
  },

  async splitDataset(
    params: {
      raw_dir?: string;
      output_dir?: string;
      train_ratio?: number;
      val_ratio?: number;
      test_ratio?: number;
      seed?: number;
    } = {},
    signal?: AbortSignal
  ): Promise<any> {
    const res = await fetch(`${getApiBaseUrl()}/dataset/split`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal,
    });
    return handleResponse<any>(res);
  },

  async listCheckpoints(signal?: AbortSignal): Promise<CheckpointInfo[]> {
    const res = await fetch(`${getApiBaseUrl()}/model/checkpoints`, { signal });
    return handleResponse<CheckpointInfo[]>(res);
  },

  async evaluateModel(
    checkpointPath?: string,
    signal?: AbortSignal
  ): Promise<EvaluationResults> {
    const res = await fetch(`${getApiBaseUrl()}/model/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkpoint_path: checkpointPath }),
      signal,
    });
    return handleResponse<EvaluationResults>(res);
  },

  async promoteModel(
    checkpointPath: string,
    signal?: AbortSignal
  ): Promise<{ status: string; active_model: string; version: string; val_accuracy?: number }> {
    const res = await fetch(`${getApiBaseUrl()}/model/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkpoint_path: checkpointPath }),
      signal,
    });
    return handleResponse<{ status: string; active_model: string; version: string; val_accuracy?: number }>(res);
  },

  async getSystemMetrics(signal?: AbortSignal): Promise<SystemTelemetry> {
    const res = await fetch(`${getApiBaseUrl()}/system/metrics`, { signal });
    return handleResponse<SystemTelemetry>(res);
  },

  async getConnectedDevices(signal?: AbortSignal): Promise<Array<{
    client_id: string;
    client_type: string;
    ip_address: string;
    last_seen: string;
    last_seen_timestamp: number;
    total_requests: number;
    last_action: string;
    user_agent?: string;
    is_active: boolean;
  }>> {
    const res = await fetch(`${getApiBaseUrl()}/system/connected-devices`, { signal });
    return handleResponse<any>(res);
  },

  getExportHistoryCsvUrl(): string {
    return `${getApiBaseUrl()}/history/export/csv`;
  },

  subscribeToTrainingStream(
    onMessage: (data: TrainingStatusResponse) => void,
    onError?: (err: any) => void
  ): () => void {
    const eventSource = new EventSource(`${getApiBaseUrl()}/training/stream`);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch (err) {
        if (onError) onError(err);
      }
    };

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return () => {
      eventSource.close();
    };
  },
};
