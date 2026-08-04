"use client";

import { useMemo } from 'react';
import { calculateDashboardKPIs, calculateQualificationScore } from '@/lib/logic';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle2, DollarSign, Target, Activity } from 'lucide-react';

export default function DashboardClient({ opportunities }) {
  const reclaimOpps = opportunities.filter(o => o.pipeline.includes('ReClaim'));
  const recovaOpps = opportunities.filter(o => o.pipeline.includes('ReCoVa'));

  const reclaimKPIs = useMemo(() => calculateDashboardKPIs(reclaimOpps), [reclaimOpps]);
  const recovaKPIs = useMemo(() => calculateDashboardKPIs(recovaOpps), [recovaOpps]);
  
  const reclaimTarget = 18000000;
  const recovaTarget = 6000000; // Fabian target
  
  const stageData = useMemo(() => {
    const stages = {};
    opportunities.forEach(opp => {
      if (!stages[opp.stage]) stages[opp.stage] = 0;
      stages[opp.stage] += opp.expectedRevenue || 0;
    });
    return Object.keys(stages).map(name => ({ name, value: stages[name] }));
  }, [opportunities]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Command Centre</h1>
        <p className="text-slate-600 mt-1">Real-time commercial performance across all pipelines.</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-2">ReClaim Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Total Pipeline" 
            value={formatCurrency(reclaimKPIs.totalPipeline)} 
            icon={<Activity className="text-blue-500" />} 
            subtitle="All active deals" 
          />
          <KpiCard 
            title="Qualified Pipeline" 
            value={formatCurrency(reclaimKPIs.qualifiedPipeline)} 
            icon={<CheckCircle2 className="text-emerald-500" />} 
            subtitle="Fully qualified deals only" 
            highlight="emerald"
          />
          <KpiCard 
            title="Target Gap" 
            value={formatCurrency(Math.max(0, reclaimTarget - reclaimKPIs.qualifiedPipeline))} 
            icon={<Target className="text-amber-500" />} 
            subtitle={`Against ${formatCurrency(reclaimTarget)} target`} 
            highlight="amber"
          />
          <KpiCard 
            title="Weighted Pipeline" 
            value={formatCurrency(reclaimKPIs.weightedPipeline)} 
            icon={<TrendingUp className="text-purple-500" />} 
            subtitle="Adjusted by stage probability" 
          />
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-2">ReCoVa Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Total Pipeline" 
            value={formatCurrency(recovaKPIs.totalPipeline)} 
            icon={<Activity className="text-blue-500" />} 
            subtitle="All active deals" 
          />
          <KpiCard 
            title="Qualified Pipeline" 
            value={formatCurrency(recovaKPIs.qualifiedPipeline)} 
            icon={<CheckCircle2 className="text-emerald-500" />} 
            subtitle="Fully qualified deals only" 
            highlight="emerald"
          />
          <KpiCard 
            title="Target Gap" 
            value={formatCurrency(Math.max(0, recovaTarget - recovaKPIs.qualifiedPipeline))} 
            icon={<Target className="text-amber-500" />} 
            subtitle={`Against ${formatCurrency(recovaTarget)} target`} 
            highlight="amber"
          />
          <KpiCard 
            title="Weighted Pipeline" 
            value={formatCurrency(recovaKPIs.weightedPipeline)} 
            icon={<TrendingUp className="text-purple-500" />} 
            subtitle="Adjusted by stage probability" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-slate-500" /> Pipeline by Stage (Combined)
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(v) => `AED ${v/1000}k`} stroke="#475569" />
                <YAxis dataKey="name" type="category" width={120} stroke="#475569" fontSize={12} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-9000" /> Pipeline Health
          </h2>
          <div className="space-y-6">
            <HealthItem 
              label="Qualified Deals" 
              count={opportunities.filter(o => calculateQualificationScore(o).status === 'Qualified').length} 
              total={opportunities.length}
              color="bg-emerald-500" 
            />
            <HealthItem 
              label="Needs Qualification" 
              count={opportunities.filter(o => calculateQualificationScore(o).status === 'Needs Qualification').length} 
              total={opportunities.length}
              color="bg-amber-500" 
            />
            <HealthItem 
              label="Unqualified / Missing Data" 
              count={opportunities.filter(o => calculateQualificationScore(o).status === 'Unqualified').length} 
              total={opportunities.length}
              color="bg-rose-500" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, subtitle, highlight }) {
  return (
    <div className={`bg-white border ${highlight === 'emerald' ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : highlight === 'amber' ? 'border-amber-500/30' : 'border-slate-200'} rounded-xl p-6 shadow-sm flex flex-col`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-9000 font-medium text-sm">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs text-slate-9000 mt-2 font-medium">{subtitle}</p>
    </div>
  );
}

function HealthItem({ label, count, total, color }) {
  const percentage = Math.round((count / total) * 100) || 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-900 font-bold">{count} <span className="text-slate-9000 font-normal">({percentage}%)</span></span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
