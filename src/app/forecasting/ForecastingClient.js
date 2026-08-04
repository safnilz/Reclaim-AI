"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, BarChart3, Receipt } from 'lucide-react';

export default function ForecastingClient({ chartData }) {
  const totalCommit = chartData.reduce((sum, data) => sum + data.commit, 0);
  const totalBestCase = chartData.reduce((sum, data) => sum + data.bestCase, 0);
  const totalInvoiced = chartData.reduce((sum, data) => sum + data.invoiced, 0);
  const totalHistorical = chartData.reduce((sum, data) => sum + (data.historical || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          Revenue Forecasting
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Projected cash flow combining Zoho Books invoices and CRM pipelines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-semibold mb-1 uppercase tracking-wider">Invoiced Expected</p>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalInvoiced)}</p>
          </div>
          <Receipt className="w-12 h-12 text-emerald-500/20" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-semibold mb-1 uppercase tracking-wider">Projected Recurring</p>
            <p className="text-3xl font-bold text-purple-600">{formatCurrency(totalHistorical)}</p>
          </div>
          <TrendingUp className="w-12 h-12 text-purple-500/20" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-semibold mb-1 uppercase tracking-wider">Pipeline (Weighted)</p>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalCommit)}</p>
          </div>
          <BarChart3 className="w-12 h-12 text-blue-500/20" />
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-semibold mb-1 uppercase tracking-wider">Pipeline (Maximum)</p>
            <p className="text-3xl font-bold text-indigo-600">{formatCurrency(totalBestCase)}</p>
          </div>
          <TrendingUp className="w-12 h-12 text-indigo-500/20" />
        </div>

      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Cash Flow Projection (AED)</h2>
        <div className="h-[450px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCommit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBestCase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b' }}
                  tickFormatter={(v) => `AED ${v/1000}k`}
                />
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="bestCase" 
                  name="Pipeline (Maximum)"
                  stroke="#4f46e5" 
                  fillOpacity={1} 
                  fill="url(#colorBestCase)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="commit" 
                  name="Pipeline (Weighted)"
                  stroke="#2563eb" 
                  fillOpacity={1} 
                  fill="url(#colorCommit)" 
                  strokeWidth={3}
                />
                <Area 
                  type="monotone" 
                  dataKey="invoiced" 
                  name="Invoiced Expected"
                  stroke="#059669" 
                  fillOpacity={1} 
                  fill="url(#colorInvoiced)" 
                  strokeWidth={3}
                />
                <Area 
                  type="monotone" 
                  dataKey="historical" 
                  name="Projected Recurring"
                  stroke="#9333ea" 
                  fillOpacity={1} 
                  fill="url(#colorHistorical)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <p className="text-slate-500 font-medium">No projected revenue found. Ensure deals have Close Dates and Invoices have Due Dates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
