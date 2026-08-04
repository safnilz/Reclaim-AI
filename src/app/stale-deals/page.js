import { fetchAllActiveDeals } from '@/lib/zoho';
import { detectStaleDeal } from '@/lib/logic';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, Clock, CalendarX2 } from 'lucide-react';

export default async function StaleDealsPage() {
  const opportunities = await fetchAllActiveDeals();
  
  const staleDeals = opportunities
    .map(opp => ({ ...opp, staleData: detectStaleDeal(opp) }))
    .filter(opp => opp.staleData.isStale)
    .sort((a, b) => b.staleData.daysSinceUpdate - a.staleData.daysSinceUpdate);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          Stale Deal Detection
        </h1>
        <p className="text-slate-9000 mt-1">Live from Zoho CRM: Identifies deals losing momentum based on activity and date rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {staleDeals.map(opp => (
          <StaleDealCard key={opp.id} opp={opp} />
        ))}
        {staleDeals.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white/50 rounded-xl border border-slate-200 border-dashed text-slate-9000">
            No stale deals detected! Great pipeline hygiene.
          </div>
        )}
      </div>
    </div>
  );
}

function StaleDealCard({ opp }) {
  const { severity, reason, daysSinceUpdate } = opp.staleData;
  
  const colors = {
    'Critical': 'border-rose-500 bg-rose-500/10 text-rose-500',
    'High': 'border-orange-500 bg-orange-500/10 text-orange-500',
    'Medium': 'border-amber-500 bg-amber-500/10 text-amber-500',
    'Low': 'border-yellow-500 bg-yellow-500/10 text-yellow-500',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{opp.dealName}</h3>
            <p className="text-slate-9000 text-sm mt-1">{formatCurrency(opp.expectedRevenue)} • {opp.stage}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[severity]}`}>
            {severity} Risk
          </span>
        </div>

        <div className="space-y-3 mt-6">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-slate-9000" />
            <span>Last updated <strong>{daysSinceUpdate} days ago</strong></span>
          </div>
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <CalendarX2 className="w-4 h-4 text-slate-9000 mt-0.5" />
            <span className="text-rose-400 font-medium">{reason}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 flex gap-3">
        <a 
          href={`https://crm.zoho.com/crm/EntityInfo.do?module=Deals&id=${opp.id}`}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center px-4 py-2 bg-slate-100 hover:bg-slate-700 text-slate-900 text-sm font-medium rounded-lg transition-colors"
        >
          View in Zoho
        </a>
      </div>
    </div>
  );
}
