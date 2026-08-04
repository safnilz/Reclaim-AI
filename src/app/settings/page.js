"use client";

import { useState } from 'react';
import { Settings, Save, Bell, Shield, Database, Sparkles, Server, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [staleThreshold, setStaleThreshold] = useState(14);
  const [criticalThreshold, setCriticalThreshold] = useState(30);
  
  const [aiPersonality, setAiPersonality] = useState('Assertive & Commercial');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          System Settings
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Configure integrations, AI behavior, and pipeline rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Integrations */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* CRM Integration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Zoho CRM Integration</h2>
                <p className="text-sm text-slate-500">Live, bidirectional sync with active pipelines</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-900">Connection Status</p>
                  <p className="text-sm text-slate-500">Last synced 2 minutes ago</p>
                </div>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Connected
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Pipelines</label>
                  <input type="text" disabled value="ReClaim, ReCoVa" className="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-slate-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Target Year</label>
                  <input type="text" disabled value="2026" className="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-slate-600 outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Books Integration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Zoho Books Integration</h2>
                <p className="text-sm text-slate-500">Used for targets and revenue forecasting</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="font-semibold text-slate-900">Books API Status</p>
                <p className="text-sm text-slate-500">Pulling sent/overdue invoices</p>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Connected
              </span>
            </div>
          </div>
          
        </div>

        {/* Right Column: AI & Alerts */}
        <div className="space-y-8">
          
          {/* AI Settings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> AI Director
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Personality & Tone</label>
                <select 
                  value={aiPersonality}
                  onChange={(e) => setAiPersonality(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
                >
                  <option>Assertive & Commercial (Default)</option>
                  <option>Supportive & Coaching</option>
                  <option>Data-Driven & Analytical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stale Alerts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-rose-500" /> Alert Thresholds
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stale Deal Warning (Days)
                </label>
                <input 
                  type="number" 
                  value={staleThreshold}
                  onChange={(e) => setStaleThreshold(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Critical Deal Warning (Days)
                </label>
                <input 
                  type="number" 
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none shadow-sm"
                />
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 flex items-center justify-end">
        <button 
          onClick={handleSave}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
            saved 
              ? 'bg-emerald-500 text-white shadow-emerald-500/25' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
          }`}
        >
          {saved ? <><CheckCircle2 className="w-5 h-5" /> Saved Successfully</> : <><Save className="w-5 h-5" /> Save Configuration</>}
        </button>
      </div>
    </div>
  );
}
