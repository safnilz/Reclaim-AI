"use client";

import { useState } from 'react';
import { Menu, X, Bot } from 'lucide-react';

export default function NavigationLayout({ sidebar, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 w-full">
      {/* Mobile Top Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-slate-900 tracking-tight">CRM AI Assistant</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col relative">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden absolute top-4 right-4 p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors z-50"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex-1 overflow-y-auto" onClick={() => {
            // Close sidebar automatically when clicking a link on mobile
            if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
          }}>
            {sidebar}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-full w-full overflow-y-auto pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
}
