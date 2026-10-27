import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../services/api';

describe('Frontend API Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls /api/health with relative path', async () => {
    const mockHealth = { status: 'ok', timestamp: '2026-10-22T15:00:00Z', version: '0.1.0' };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHealth,
    } as Response);
    vi.stubGlobal('fetch', mockFetch);

    const res = await api.getHealth();
    expect(mockFetch).toHaveBeenCalledWith('/api/health', { signal: undefined });
    expect(res.status).toBe('ok');
    expect(res.version).toBe('0.1.0');
  });

  it('calls /api/model/status and returns unloaded status in Phase 1', async () => {
    const mockModelStatus = {
      loaded: false,
      model_name: null,
      architecture: 'ResNet-50',
      num_classes: null,
      classes: null,
      checkpoint_path: null,
      message: 'No trained model is loaded. Train the model in Phase 2.',
    };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockModelStatus,
    } as Response);
    vi.stubGlobal('fetch', mockFetch);

    const res = await api.getModelStatus();
    expect(mockFetch).toHaveBeenCalledWith('/api/model/status', { signal: undefined });
    expect(res.loaded).toBe(false);
    expect(res.architecture).toBe('ResNet-50');
  });

  it('calls /api/metrics/summary and returns unavailable state', async () => {
    const mockMetrics = {
      available: false,
      total_recognitions: 0,
      average_confidence: null,
      average_latency_ms: null,
      model_accuracy: null,
      training_epochs_completed: null,
      message: 'Metrics will become available after model training and evaluation.',
    };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMetrics,
    } as Response);
    vi.stubGlobal('fetch', mockFetch);

    const res = await api.getMetricsSummary();
    expect(mockFetch).toHaveBeenCalledWith('/api/metrics/summary', { signal: undefined });
    expect(res.available).toBe(false);
    expect(res.total_recognitions).toBe(0);
  });

  it('calls /api/history with query parameters and returns empty list', async () => {
    const mockHistory = {
      records: [],
      total: 0,
      message: 'No recognition records yet.',
    };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockHistory,
    } as Response);
    vi.stubGlobal('fetch', mockFetch);

    const res = await api.getHistory({ denomination: '₹500', limit: 10 });
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/history?denomination=%E2%82%B9500&limit=10',
      { signal: undefined }
    );
    expect(res.records).toEqual([]);
    expect(res.total).toBe(0);
  });
});
