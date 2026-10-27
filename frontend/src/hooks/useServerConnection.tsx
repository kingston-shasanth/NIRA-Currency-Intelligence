import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  resetApiBaseUrl,
  testServerConnection,
  api,
  isCapacitorNative,
} from '../services/api';
import type { HealthResponse, ModelStatusResponse } from '../types';

export type ConnectionStatus = 'connected' | 'connecting' | 'unavailable' | 'reconnecting';

interface ServerConnectionContextType {
  status: ConnectionStatus;
  serverUrl: string;
  latencyMs: number | null;
  lastConnectedAt: Date | null;
  errorMessage: string | null;
  healthData: HealthResponse | null;
  modelStatus: ModelStatusResponse | null;

  // Separate truthful statuses
  isInternetOnline: boolean;
  isBackendOnline: boolean;
  isModelCheckpointReady: boolean;
  isRecognitionReady: boolean;
  isNativeApp: boolean;
  isHotspotIsolationSuspected: boolean;

  retryConnection: () => Promise<boolean>;
  updateServerUrl: (url: string) => Promise<boolean>;
  resetToDefault: () => Promise<boolean>;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ServerConnectionContext = createContext<ServerConnectionContextType | null>(null);

export const ServerConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [serverUrl, setServerUrlState] = useState<string>(getApiBaseUrl());
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [isInternetOnline, setIsInternetOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const consecutiveFailuresRef = useRef(0);
  const isCheckingRef = useRef(false);

  // Monitor browser online/offline events
  useEffect(() => {
    const handleOnline = () => setIsInternetOnline(true);
    const handleOffline = () => setIsInternetOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Heartbeat & status verification
  const checkConnection = useCallback(async (customUrl?: string): Promise<boolean> => {
    if (isCheckingRef.current) return false;
    isCheckingRef.current = true;

    try {
      const res = await testServerConnection(customUrl);
      if (res.ok && res.data) {
        setStatus('connected');
        setLatencyMs(res.latencyMs);
        setLastConnectedAt(new Date());
        setHealthData(res.data);
        setErrorMessage(null);
        consecutiveFailuresRef.current = 0;

        // Fetch truthful model status
        try {
          const modelRes = await api.getModelStatus();
          setModelStatus(modelRes);
        } catch {
          setModelStatus(null);
        }

        return true;
      } else {
        consecutiveFailuresRef.current += 1;
        setStatus(consecutiveFailuresRef.current > 1 ? 'unavailable' : 'reconnecting');
        setHealthData(null);
        setModelStatus(null);

        let diagMsg = 'NIRA laptop backend is not responding. Ensure START_NIRA.bat is running on your laptop.';
        if (isCapacitorNative()) {
          diagMsg = 'Cannot reach laptop server from phone. Verify laptop IP address, ensure phone and laptop are on the same Wi-Fi/hotspot, and check Windows Firewall.';
        }
        setErrorMessage(res.error || diagMsg);
        return false;
      }
    } catch {
      consecutiveFailuresRef.current += 1;
      setStatus('unavailable');
      setHealthData(null);
      setModelStatus(null);
      setErrorMessage('NIRA laptop backend is not responding. Ensure START_NIRA.bat is running on your laptop.');
      return false;
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  // Periodic heartbeat
  useEffect(() => {
    checkConnection();

    const interval = setInterval(() => {
      checkConnection();
    }, 12000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  const retryConnection = async (): Promise<boolean> => {
    setStatus('connecting');
    return checkConnection();
  };

  const updateServerUrl = async (newUrl: string): Promise<boolean> => {
    setStatus('connecting');
    const normalized = setApiBaseUrl(newUrl);
    setServerUrlState(normalized);
    const success = await checkConnection(normalized);
    return success;
  };

  const resetToDefault = async (): Promise<boolean> => {
    resetApiBaseUrl();
    const def = getApiBaseUrl();
    setServerUrlState(def);
    return checkConnection(def);
  };

  const isBackendOnline = status === 'connected';
  const isModelCheckpointReady = Boolean(modelStatus?.checkpoint_exists);
  const isRecognitionReady = Boolean(modelStatus?.loaded);
  const isNativeApp = isCapacitorNative();
  const isHotspotIsolationSuspected = status === 'unavailable' && isNativeApp && consecutiveFailuresRef.current >= 2;

  return (
    <ServerConnectionContext.Provider
      value={{
        status,
        serverUrl,
        latencyMs,
        lastConnectedAt,
        errorMessage,
        healthData,
        modelStatus,
        isInternetOnline,
        isBackendOnline,
        isModelCheckpointReady,
        isRecognitionReady,
        isNativeApp,
        isHotspotIsolationSuspected,
        retryConnection,
        updateServerUrl,
        resetToDefault,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
      }}
    >
      {children}
    </ServerConnectionContext.Provider>
  );
};

export function useServerConnection(): ServerConnectionContextType {
  const ctx = useContext(ServerConnectionContext);
  if (!ctx) {
    throw new Error('useServerConnection must be used within ServerConnectionProvider');
  }
  return ctx;
}
