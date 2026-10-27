import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { ServerConnectionBanner } from '../components/ServerConnectionBanner';
import { ServerConnectionModal } from '../components/ServerConnectionModal';
import { isCapacitorNative } from '../services/api';

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const isScanRoute = location.pathname === '/' || location.pathname === '/scan';
  const isNative = isCapacitorNative();

  // If on mobile scan view or running inside Capacitor native app, render dedicated full-screen view
  if (isScanRoute || isNative) {
    return (
      <div className="min-h-screen w-full bg-[#111417] text-[#F5EFEB] flex flex-col antialiased overflow-hidden selection:bg-[#D4AF37] selection:text-black">
        <main id="main-content" tabIndex={-1} className="flex-1 w-full h-full focus:outline-none">
          <Outlet />
        </main>
        <ServerConnectionModal />
      </div>
    );
  }

  // Desktop administration & workbench dashboard shell
  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0F1E28] flex flex-col antialiased">
      {/* Top Header */}
      <Header />

      {/* Main Content Layout with Sidebar */}
      <div className="flex-1 flex w-full min-w-0 overflow-x-hidden">
        <Sidebar />

        {/* Dynamic Route Content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full min-w-0 focus:outline-none space-y-4 overflow-x-hidden"
        >
          <ServerConnectionBanner />
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Connection Settings Modal */}
      <ServerConnectionModal />
    </div>
  );
};
