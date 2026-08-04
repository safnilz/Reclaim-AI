import { fetchAllActiveDeals } from '@/lib/zoho';
import { detectStaleDeal, calculateQualificationScore } from '@/lib/logic';
import { formatCurrency } from '@/lib/utils';
import { Calendar, AlertCircle, ArrowRight } from 'lucide-react';

export default async function DailyActionsPage() {
  const opportunities = await fetchAllActiveDeals();
  
  let list = [];
  opportunities.forEach(opp => {
    const staleData = detectStaleDeal(opp);
    const qualData = calculateQualificationScore(opp);
    
    if (staleData.isStale && staleData.severity === 'Critical') {
      list.push({
        id: opp.id + '-stale',
        opp,
        type: 'Critical Risk',
        description: staleData.reason,
        impact: formatCurrency(opp.expectedRevenue),
        priority: 1
      });
    }

    if (qualData.status === 'Needs Qualification' && opp.expectedRevenue > 100000) {
      list.push({
        id: opp.id + '-qual',
        opp,
        type: 'Missing Data on High Value Deal',
        description: `Missing: ${qualData.missingFields.join(', ')}`,
        impact: 'Cannot forecast accurately',
        priority: 2
      });
    }
  });

  const actions = list.sort((a, b) => a.priority - b.priority);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Calendar className="w-8 h-8 text-indigo-500" />
          Daily Action List
        </h1>
        <p className="text-slate-9000 mt-1">Live from Zoho CRM: AI-prioritized tasks based on deal value, risk, and urgency.</p>
      </div>

      <div className="space-y-4">
        {actions.map(action => (
          <div key={action.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-colors">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <AlertCircle className={`w-5 h-5 ${action.priority === 1 ? 'text-rose-500' : action.priority === 2 ? 'text-amber-500' : 'text-blue-500'}`} />
              </div>
              <div>
                <h3 className="text-slate-900 font-bold">{action.type}</h3>
                <p className="text-slate-600 text-sm mt-1">{action.opp.dealName} <span className="text-slate-9000">• {formatCurrency(action.opp.expectedRevenue)}</span></p>
                <p className="text-slate-9000 text-sm mt-2">{action.description}</p>
                <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-300">
                  Impact: {action.impact}
                </div>
              </div>
            </div>
            <a 
              href={`https://crm.zoho.com/crm/EntityInfo.do?module=Deals&id=${action.opp.id}`}
              target="_blank" rel="noopener noreferrer"
              className="hidden group-hover:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-slate-900 text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Take Action <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ))}
        {actions.length === 0 && (
          <div className="text-center py-12 bg-white/50 rounded-xl border border-slate-200 border-dashed">
            <p className="text-slate-9000">You are all caught up! No urgent actions required today.</p>
          </div>
        )}
      </div>
    </div>
  );
}
