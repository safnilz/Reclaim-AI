import { fetchAllActiveDeals, fetchCollectedRevenueBySalesperson } from '@/lib/zoho';
import { stageProbabilities } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';
import { Target, Trophy, Flame } from 'lucide-react';

export default async function TargetsPage() {
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
    
    const closedRevenue = collectedRevenueMap[ownerName] || 0;
      
    const excludedStages = ['Closed Won', 'Revenue Collected', 'Closed Lost', 'Closed - Lost to Competitor', 'Job Completed'];
    const activePipeline = deals
      .filter(o => !excludedStages.includes(o.stage))
      .reduce((sum, o) => sum + (o.expectedRevenue || 0), 0);
      
    const weightedPipeline = deals
      .filter(o => !excludedStages.includes(o.stage))
      .reduce((sum, o) => {
        const prob = stageProbabilities[o.stage] || 0;
        return sum + ((o.expectedRevenue || 0) * (prob / 100));
      }, 0);

    const projectedRevenue = closedRevenue + weightedPipeline;
    const attainment = Math.round((closedRevenue / person.target) * 100);
    const projectedAttainment = Math.round((projectedRevenue / person.target) * 100);

    return {
      ...person,
      closedRevenue,
      activePipeline,
      weightedPipeline,
      projectedRevenue,
      attainment,
      projectedAttainment
    };
  });
  
  const globalTarget = stats.reduce((sum, p) => sum + p.target, 0);
  const globalClosed = stats.reduce((sum, p) => sum + p.closedRevenue, 0);
  const globalProjected = stats.reduce((sum, p) => sum + p.projectedRevenue, 0);
  const globalAttainment = Math.round((globalClosed / globalTarget) * 100);
  const globalProjectedAttainment = Math.round((globalProjected / globalTarget) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Target className="w-8 h-8 text-amber-500" />
          Target Tracker
        </h1>
        <p className="text-slate-9000 mt-1">Quota attainment and projected target hit rates.</p>
      </div>

      {/* Global Target */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-slate-900">Company Target</h2>
          </div>
          <div>
            <p className="text-slate-9000 font-medium mb-1">Total Target</p>
            <p className="text-3xl font-bold text-slate-900">{formatCurrency(globalTarget)}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div>
              <p className="text-slate-9000 font-medium mb-1">Revenue Collected</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(globalClosed)}</p>
            </div>
            <div>
              <p className="text-slate-9000 font-medium mb-1">Projected (Collected + Weighted)</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(globalProjected)}</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-8">
          <CircularProgress 
            percentage={globalAttainment} 
            label="Actual Attainment" 
            color="text-emerald-500" 
            trackColor="text-emerald-950" 
          />
          <CircularProgress 
            percentage={globalProjectedAttainment} 
            label="Projected Attainment" 
            color="text-blue-500" 
            trackColor="text-blue-950" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.map(person => (
          <div key={person.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{person.name}</h3>
                <p className="text-sm text-slate-9000">Target: {formatCurrency(person.target)}</p>
              </div>
              {person.projectedAttainment >= 100 && (
                <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3" /> On Track to Exceed
                </div>
              )}
            </div>
            
            <div className="flex gap-6 items-center">
              <CircularProgress 
                percentage={person.projectedAttainment} 
                label="" 
                color={person.projectedAttainment >= 100 ? "text-amber-500" : "text-blue-500"} 
                trackColor="text-slate-800" 
                size={80} 
                strokeWidth={8} 
              />
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-9000">Revenue Collected</span>
                    <span className="text-emerald-400 font-semibold">{formatCurrency(person.closedRevenue)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(100, person.attainment)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-9000">Projected Total</span>
                    <span className="text-blue-400 font-semibold">{formatCurrency(person.projectedRevenue)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, person.projectedAttainment)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CircularProgress({ percentage, label, color, trackColor, size = 120, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            className={trackColor}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={`${color} transition-all duration-1000 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xl font-bold text-slate-900">{percentage}%</span>
        </div>
      </div>
      {label && <p className="text-sm font-medium text-slate-9000 mt-3">{label}</p>}
    </div>
  );
}
