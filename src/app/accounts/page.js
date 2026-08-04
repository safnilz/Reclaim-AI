import { fetchAllActiveDeals } from '@/lib/zoho';
import { accounts } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';
import { Briefcase, Building2, AlertCircle, ShieldCheck } from 'lucide-react';

export default async function AccountsPage() {
  const opportunities = await fetchAllActiveDeals();
  
  const accountStats = accounts.map(acc => {
    const deals = opportunities.filter(o => o.accountId === acc.id);
    const excludedStages = ['Closed Won', 'Revenue Collected', 'Closed Lost', 'Closed - Lost to Competitor', 'Job Completed'];
    const activeDeals = deals.filter(o => !excludedStages.includes(o.stage));
    const activePipeline = activeDeals.reduce((sum, o) => sum + (o.expectedRevenue || 0), 0);
    
    return {
      ...acc,
      activePipeline,
      activeDealsCount: activeDeals.length,
      deals
    };
  }).sort((a, b) => b.activePipeline - a.activePipeline);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-emerald-500" />
          Account Overview
        </h1>
        <p className="text-slate-9000 mt-1">Holistic view of customer accounts and their active pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accountStats.map(acc => (
          <div key={acc.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm group hover:border-emerald-500/50 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                acc.riskScore === 'Low' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                acc.riskScore === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}>
                {acc.riskScore} Risk
              </span>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
                <Building2 className="w-6 h-6 text-slate-9000 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{acc.name}</h2>
                <p className="text-sm text-slate-9000">{acc.segment}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-9000 font-medium mb-1">Active Pipeline</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(acc.activePipeline)}</p>
                <p className="text-sm text-slate-9000 mt-1">Across {acc.activeDealsCount} active deals</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-100/50 p-3 rounded-lg border border-slate-300/50">
                  <p className="text-xs text-slate-9000 font-medium mb-1">Historical Spend</p>
                  <p className="text-sm font-bold text-slate-600">{formatCurrency(acc.totalHistoricalRevenue)}</p>
                </div>
                <div className="bg-slate-100/50 p-3 rounded-lg border border-slate-300/50">
                  <p className="text-xs text-slate-9000 font-medium mb-1">Payment Terms</p>
                  <p className="text-sm font-bold text-slate-600">{acc.approvedPaymentPeriod} Days</p>
                </div>
              </div>
            </div>

            {acc.activeDealsCount > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-xs font-bold text-slate-9000 uppercase tracking-wider">Top Deals</p>
                {acc.deals.filter(d => !['Closed Won', 'Revenue Collected', 'Closed Lost', 'Closed - Lost to Competitor', 'Job Completed'].includes(d.stage)).slice(0, 2).map(deal => (
                  <div key={deal.id} className="flex justify-between items-center text-sm p-2 bg-slate-100/30 rounded border border-slate-200">
                    <span className="text-slate-600 truncate pr-4">{deal.dealName}</span>
                    <span className="text-emerald-400 font-medium">{formatCurrency(deal.expectedRevenue)}</span>
                  </div>
                ))}
                {acc.activeDealsCount > 2 && (
                  <p className="text-xs text-slate-9000 text-center pt-1">+ {acc.activeDealsCount - 2} more</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
