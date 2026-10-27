import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './hooks/useSettings';
import { ServerConnectionProvider } from './hooks/useServerConnection';
import { MainLayout } from './layouts/MainLayout';
import { ScanPage } from './pages/ScanPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { ModelWorkbenchPage } from './pages/ModelWorkbenchPage';
import { InsightsPage } from './pages/InsightsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <ServerConnectionProvider>
      <SettingsProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Landing screen is directly the Scan experience */}
            <Route index element={<ScanPage />} />
            <Route path="scan" element={<ScanPage />} />
            <Route path="workbench" element={<ModelWorkbenchPage />} />
            <Route path="model-lab" element={<ModelWorkbenchPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="dashboard/:tab" element={<DashboardPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  </ServerConnectionProvider>
  );
}

export default App;
