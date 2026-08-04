import { fetchAllActiveDeals } from '@/lib/zoho';
import { formatCurrency } from '@/lib/utils';
import { Briefcase, Building2, AlertTriangle, Info, Clock } from 'lucide-react';
import { differenceInDays, parseISO, isValid } from 'date-fns';

export default async function AccountsPage() {
  const allDeals = await fetchAllActiveDeals(true);
  
  // Extract unique accounts
  const accountsMap = new Map();
  allDeals.forEach(deal => {
    if (!deal.accountId) return;
    
    if (!accountsMap.has(deal.accountId)) {
      accountsMap.set(deal.accountId, {
        id: deal.accountId,
        name: deal.accountName,
        segment: 'CRM Account', // Default or parse from other fields if available
        deals: []
      });
    }
    accountsMap.get(deal.accountId).deals.push(deal);
  });

  const excludedStages = ['Closed Won', 'Revenue Collected', 'Closed Lost', 'Closed - Lost to Competitor', 'Job Completed'];
  const wonStages = ['Closed Won', 'Revenue Collected', 'Job Completed'];

  const accountStats = Array.from(accountsMap.values()).map(acc => {
    const activeDeals = acc.deals.filter(o => !excludedStages.includes(o.stage));
    const wonDeals = acc.deals.filter(o => wonStages.includes(o.stage));
    
    const activePipeline = activeDeals.reduce((sum, o) => sum + (o.expectedRevenue || 0), 0);
    const historicalSpend = wonDeals.reduce((sum, o) => sum + (o.expectedRevenue || 0), 0);
    
    // Find last activity
    let lastActivityDate = null;
    acc.deals.forEach(deal => {
      if (deal.lastUpdated) {
        const d = parseISO(deal.lastUpdated);
        if (isValid(d)) {
          if (!lastActivityDate || d > lastActivityDate) {
            lastActivityDate = d;
          }
        }
      }
    });

    const daysSinceLastActivity = lastActivityDate ? differenceInDays(new Date(), lastActivityDate) : 999;
    
    return {
      ...acc,
      activePipeline,
      historicalSpend,
      activeDealsCount: activeDeals.length,
      daysSinceLastActivity,
      lastActivityDate
    };
  });

  const activeAccounts = accountStats
    .filter(acc => acc.activePipeline > 0)
    .sort((a, b) => b.activePipeline - a.activePipeline);

  const inactiveAccounts = accountStats
    .filter(acc => acc.activePipeline === 0 && acc.historicalSpend > 0)
    .sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity); // Longest inactivity first

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-blue-600" />
          Account Overview
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Live customer accounts and their active pipeline data from Zoho CRM.</p>
      </div>

      {/* Active Accounts Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          Active Key Accounts
          <span className="bg-blue-100 text-blue-700 text-sm py-1 px-3 rounded-full ml-3">{activeAccounts.length}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeAccounts.length === 0 && (
            <p className="text-slate-500 italic col-span-full">No active accounts found in pipeline.</p>
          )}
          {activeAccounts.map(acc => (
            <div key={acc.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 line-clamp-1" title={acc.name}>{acc.name}</h2>
                  <p className="text-sm text-slate-500">{acc.segment}</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Active Pipeline</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(acc.activePipeline)}</p>
                  <p className="text-sm text-slate-500 mt-1">Across {acc.activeDealsCount} active deals</p>
                </div>

                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="bg-slate-50 p-3 rounded-lg flex-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Historical Spend</p>
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(acc.historicalSpend)}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg flex-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Last Activity</p>
                    <p className="text-sm font-bold text-slate-700">
                      {acc.daysSinceLastActivity === 0 ? 'Today' : `${acc.daysSinceLastActivity} days ago`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inactive Accounts Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-rose-600 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Inactive / Churn Risk Accounts
          <span className="bg-rose-100 text-rose-700 text-sm py-1 px-3 rounded-full ml-3">{inactiveAccounts.length}</span>
        </h2>
        <p className="text-slate-500 text-sm">Accounts with historical revenue but 0 active pipeline and no recent communication.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inactiveAccounts.length === 0 && (
            <p className="text-slate-500 italic col-span-full">No inactive accounts found.</p>
          )}
          {inactiveAccounts.map(acc => (
            <div key={acc.id} className="bg-rose-50 border border-rose-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/60 rounded-xl group-hover:bg-white transition-colors">
                  <Clock className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 line-clamp-1" title={acc.name}>{acc.name}</h2>
                  <p className="text-sm text-rose-500 font-medium">{acc.daysSinceLastActivity} days inactive</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-rose-200/60">
                <div>
                  <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider mb-1">Historical Spend (At Risk)</p>
                  <p className="text-2xl font-bold text-rose-600">{formatCurrency(acc.historicalSpend)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
