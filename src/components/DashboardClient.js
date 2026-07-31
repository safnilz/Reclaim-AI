"use client";

import { useMemo } from 'react';
import { calculateDashboardKPIs, calculateQualificationScore } from '@/lib/logic';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle2, DollarSign, Target, Activity } from 'lucide-react';

export default function DashboardClient({ opportunities }) {
  const { totalPipeline, qualifiedPipeline, weightedPipeline } = useMemo(() => calculateDashboardKPIs(opportunities), [opportunities]);
  const targetPipeline = 18000000;
  const targetGap = targetPipeline - qualifiedPipeline;
  
  const stageData = useMemo(() => {
    const stages = {};
    opportunities.forEach(opp => {
      if (!stages[opp.stage]) stages[opp.stage] = 0;
      stages[opp.stage] += opp.expectedRevenue || 0;
    });
    return Object.keys(stages).map(name => ({ name, value: stages[name] }));
  }, [opportunities]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Executive Command Centre</h1>
        <p className="text-slate-400 mt-1">Real-time commercial performance based on live Zoho CRM data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Pipeline" 
          value={formatCurrency(totalPipeline)} 
          icon={<Activity className="text-blue-500" />} 
          subtitle="All active deals" 
        />
        <KpiCard 
          title="Qualified Pipeline" 
          value={formatCurrency(qualifiedPipeline)} 
          icon={<CheckCircle2 className="text-emerald-500" />} 
          subtitle="Fully qualified deals only" 
          highlight="emerald"
        />
        <KpiCard 
          title="Target Gap" 
          value={formatCurrency(targetGap)} 
          icon={<Target className="text-amber-500" />} 
          subtitle={`Against ${formatCurrency(targetPipeline)} target`} 
          highlight="amber"
        />
        <KpiCard 
          title="Weighted Pipeline" 
          value={formatCurrency(weightedPipeline)} 
          icon={<TrendingUp className="text-purple-500" />} 
          subtitle="Adjusted by stage probability" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-slate-400" /> Pipeline by Stage
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(v) => `$${v/1000}k`} stroke="#475569" />
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

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-400" /> Pipeline Health
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
    <div className={`bg-slate-900 border ${highlight === 'emerald' ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : highlight === 'amber' ? 'border-amber-500/30' : 'border-slate-800'} rounded-xl p-6 shadow-sm flex flex-col`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-400 font-medium text-sm">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-slate-500 mt-2 font-medium">{subtitle}</p>
    </div>
  );
}

function HealthItem({ label, count, total, color }) {
  const percentage = Math.round((count / total) * 100) || 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-white font-bold">{count} <span className="text-slate-500 font-normal">({percentage}%)</span></span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
