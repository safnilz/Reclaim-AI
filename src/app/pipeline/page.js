import { fetchAllActiveDeals, excludedStages } from '@/lib/zoho';
import { formatCurrency } from '@/lib/utils';
import { calculateQualificationScore } from '@/lib/logic';
import { stageProbabilities } from '@/lib/mockData';
import { Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

export default async function PipelinePage() {
  const opportunities = await fetchAllActiveDeals();
  
  // Exclude closed/completed stages from active pipeline view
  const activeStages = Object.keys(stageProbabilities).filter(s => !excludedStages.includes(s));
  
  const pipeline = {};
  activeStages.forEach(stage => {
    pipeline[stage] = { deals: [], totalValue: 0 };
  });

  opportunities.forEach(opp => {
    if (pipeline[opp.stage]) {
      pipeline[opp.stage].deals.push(opp);
      pipeline[opp.stage].totalValue += (opp.expectedRevenue || 0);
    }
  });

  return (
    <div className="p-8 h-full flex flex-col space-y-6 overflow-hidden">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Layers className="w-8 h-8 text-blue-500" />
          Sales Pipeline
        </h1>
        <p className="text-slate-9000 mt-1">Live from Zoho CRM: Stage-based Kanban view.</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max">
          {activeStages.map(stage => {
            const column = pipeline[stage];
            return (
              <div key={stage} className="w-80 flex flex-col bg-white/50 rounded-xl border border-slate-200">
                <div className="p-4 border-b border-slate-200 bg-white/80 rounded-t-xl flex justify-between items-center">
                  <h2 className="text-sm font-bold text-slate-900 tracking-wider">{stage}</h2>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-300">
                    {column.deals.length}
                  </span>
                </div>
                <div className="p-4 bg-white/40 text-center border-b border-slate-200">
                  <p className="text-xl font-bold text-blue-400">{formatCurrency(column.totalValue)}</p>
                  <p className="text-xs text-slate-9000 font-medium mt-1">{stageProbabilities[stage]}% Win Probability</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {column.deals.map(opp => {
                    const qual = calculateQualificationScore(opp);
                    return (
                      <a 
                        key={opp.id} 
                        href={`https://crm.zoho.com/crm/EntityInfo.do?module=Deals&id=${opp.id}`}
                        target="_blank" rel="noopener noreferrer"
                        className="block bg-slate-100 border border-slate-300 hover:border-blue-500 hover:bg-slate-100/80 transition-all rounded-lg p-4 shadow-sm group relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <h3 className="text-slate-900 font-semibold text-sm leading-tight mb-2 group-hover:text-blue-400 transition-colors">{opp.dealName}</h3>
                        <p className="text-slate-600 font-bold text-sm mb-4">{formatCurrency(opp.expectedRevenue)}</p>
                        
                        <div className="flex justify-between items-center text-xs text-slate-9000 border-t border-slate-300 pt-3">
                          <span className="font-medium bg-white px-2 py-1 rounded">{opp.ownerId}</span>
                          <div className="flex items-center gap-1" title={`Hygiene: ${qual.status}`}>
                            {qual.status === 'Qualified' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <AlertCircle className={`w-4 h-4 ${qual.status === 'Needs Qualification' ? 'text-amber-500' : 'text-rose-500'}`} />
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                  {column.deals.length === 0 && (
                    <div className="text-center p-4 border border-dashed border-slate-200 rounded-lg">
                      <p className="text-sm text-slate-9000">No deals in this stage</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
