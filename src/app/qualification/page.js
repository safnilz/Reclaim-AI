import { fetchAllActiveDeals } from '@/lib/zoho';
import { calculateQualificationScore } from '@/lib/logic';
import { formatCurrency } from '@/lib/utils';
import { CheckSquare, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default async function QualificationPage() {
  const opportunities = await fetchAllActiveDeals();
  
  const oppsWithScores = opportunities.map(opp => ({
    ...opp,
    scoreData: calculateQualificationScore(opp)
  })).sort((a, b) => a.scoreData.percentage - b.scoreData.percentage);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-blue-500" />
          Opportunity Qualification Engine
        </h1>
        <p className="text-slate-9000 mt-1">Live from Zoho CRM: Review missing mandatory fields to ensure strict CRM discipline.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {oppsWithScores.map(opp => (
          <QualificationCard key={opp.id} opp={opp} />
        ))}
      </div>
    </div>
  );
}

function QualificationCard({ opp }) {
  const { percentage, missingFields, status } = opp.scoreData;
  
  let statusIcon;
  let statusColor;
  
  if (status === 'Qualified') {
    statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    statusColor = 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
  } else if (status === 'Needs Qualification') {
    statusIcon = <AlertTriangle className="w-5 h-5 text-amber-500" />;
    statusColor = 'text-amber-500 border-amber-500/20 bg-amber-500/10';
  } else {
    statusIcon = <XCircle className="w-5 h-5 text-rose-500" />;
    statusColor = 'text-rose-500 border-rose-500/20 bg-rose-500/10';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6">
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-900">{opp.dealName}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${statusColor}`}>
            {statusIcon}
            {status} ({percentage}%)
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-9000">Value</p>
            <p className="text-slate-900 font-medium">{formatCurrency(opp.expectedRevenue)}</p>
          </div>
          <div>
            <p className="text-slate-9000">Stage</p>
            <p className="text-slate-900 font-medium">{opp.stage}</p>
          </div>
        </div>

        {missingFields.length > 0 && (
          <div className="mt-4 p-4 bg-slate-100/50 rounded-lg border border-slate-300/50">
            <p className="text-sm font-medium text-slate-600 mb-2">Missing Mandatory Fields ({missingFields.length}):</p>
            <div className="flex flex-wrap gap-2">
              {missingFields.map(field => (
                <span key={field} className="px-2.5 py-1 bg-slate-100 text-rose-400 border border-rose-900/30 rounded text-xs font-medium">
                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-end justify-between self-stretch">
        <div className="text-right">
          <p className="text-xs text-slate-9000">Owner</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="px-3 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-medium border border-indigo-500/30">
              {opp.ownerId}
            </div>
          </div>
        </div>
        <a 
          href={`https://crm.zoho.com/crm/EntityInfo.do?module=Deals&id=${opp.id}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-900 text-sm font-medium rounded-lg transition-colors shadow-sm shadow-blue-900/20 mt-4 text-center"
        >
          Requalify in CRM
        </a>
      </div>
    </div>
  );
}
