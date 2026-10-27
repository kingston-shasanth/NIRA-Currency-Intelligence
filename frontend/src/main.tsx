import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { isCapacitorNative } from './services/api.ts';

// Safeguard against unhandled async exceptions closing the native WebView
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.warn('NIRA intercepted window error:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('NIRA intercepted unhandled promise rejection:', event.reason);
  });
}

// Register PWA Service Worker strictly in standard browser mode (never inside Capacitor native app)
if (!isCapacitorNative() && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('NIRA Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('NIRA Service Worker registration skipped:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
