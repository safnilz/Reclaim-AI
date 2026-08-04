import { fetchAllActiveDeals, fetchCollectedRevenueBySalesperson } from '@/lib/zoho';
import { calculateHygieneScore } from '@/lib/logic';
import { formatCurrency } from '@/lib/utils';
import { Award, TrendingUp, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

export default async function ScorecardsPage() {
  const opportunities = await fetchAllActiveDeals(true);
  const collectedRevenueMap = await fetchCollectedRevenueBySalesperson();
  
  // Extract unique salespeople from active opportunities
  const uniqueOwners = [...new Set(opportunities.map(o => o.ownerId))].filter(Boolean);
  
  const stats = uniqueOwners.map((ownerName, i) => {
    const person = {
      id: `u${i}`,
      name: ownerName,
      role: 'Salesperson',
      target: 6000000 // Default target
    };
    
    const deals = opportunities.filter(o => o.ownerId === ownerName);
    const excludedStages = ['Closed Won', 'Revenue Collected', 'Closed Lost', 'Closed - Lost to Competitor', 'Job Completed'];
    const activeDeals = deals.filter(o => !excludedStages.includes(o.stage));
    
    const activePipeline = activeDeals.reduce((sum, o) => sum + (o.expectedRevenue || 0), 0);
    const closedRevenue = collectedRevenueMap[ownerName] || 0;
    
    // Average Hygiene Score
    const hygieneScores = activeDeals.map(o => calculateHygieneScore(o).score);
    const avgHygiene = hygieneScores.length > 0 
      ? Math.round(hygieneScores.reduce((a, b) => a + b, 0) / hygieneScores.length)
      : 100;
      
    // Count critical hygiene issues (score < 75)
    const criticalIssues = activeDeals.filter(o => calculateHygieneScore(o).score < 75).length;

    return {
      ...person,
      activePipeline,
      closedRevenue,
      avgHygiene,
      criticalIssues,
      activeDealsCount: activeDeals.length
    };
  });
  
  // Sort by active pipeline
  stats.sort((a, b) => b.activePipeline - a.activePipeline);

  // Determine top performer (must have >0 active pipeline)
  const maxActive = stats.length > 0 ? stats[0].activePipeline : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Award className="w-8 h-8 text-purple-500" />
          Sales Scorecards
        </h1>
        <p className="text-slate-9000 mt-1">Live from Zoho CRM: Leaderboard and performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((person, index) => (
          <div key={person.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-colors">
            {index === 0 && person.activePipeline > 0 && (
              <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-lg">
                Top Performer
              </div>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-lg font-bold text-slate-600">
                {person.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{person.name}</h2>
                <p className="text-sm text-slate-9000">{person.role}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-9000">Active Pipeline</span>
                  <span className="text-slate-900 font-semibold">{formatCurrency(person.activePipeline)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (person.activePipeline / person.target) * 100)}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-9000 font-medium mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Revenue Collected</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(person.closedRevenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-9000 font-medium mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Avg Hygiene</p>
                  <p className={`text-lg font-bold ${person.avgHygiene >= 90 ? 'text-emerald-400' : person.avgHygiene >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {person.avgHygiene}/100
                  </p>
                </div>
              </div>
              
              {person.criticalIssues > 0 ? (
                <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-rose-300">
                    <strong className="text-rose-400">{person.criticalIssues} deals</strong> need immediate data cleanup.
                  </p>
                </div>
              ) : (
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-300">
                    Perfect data hygiene across all {person.activeDealsCount} active deals.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
