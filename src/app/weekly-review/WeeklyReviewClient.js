"use client";

import { useState } from 'react';
import { FileText, Download, CheckSquare, Loader2, Bot, Trophy, Banknote, ShieldAlert, PhoneCall, PlusCircle, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function WeeklyReviewClient({ teamArray }) {
  const [loadingStates, setLoadingStates] = useState({});
  const [reviews, setReviews] = useState({});

  const generateReview = async (person) => {
    setLoadingStates(prev => ({ ...prev, [person.name]: true }));
    try {
      const res = await fetch('/api/generate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salespersonName: person.name,
          deals: person.deals,
          wonThisWeekValue: person.wonThisWeekValue,
          collectedThisWeek: person.collectedThisWeek,
          createdThisWeekCount: person.createdThisWeekCount,
          createdThisWeekValue: person.createdThisWeekValue,
          progressedThisWeekCount: person.progressedThisWeekCount,
          tasksCompleted: person.utilization.tasks,
          callsLogged: person.utilization.calls,
          hygieneScore: person.hygieneScore,
          hygieneIssues: person.hygieneIssues
        })
      });
      const data = await res.json();
      if (data.questions) {
        setReviews(prev => ({ ...prev, [person.name]: data.questions }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [person.name]: false }));
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-emerald-500" />
            Weekly Commercial Review
          </h1>
          <p className="text-slate-9000 mt-1">AI-generated coaching preparation powered by AI and live Zoho data.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-700 text-slate-900 text-sm font-medium rounded-lg border border-slate-300 transition-colors">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      <div className="space-y-6">
        {teamArray.map(person => {
          const isGenerating = loadingStates[person.name];
          const displayQuestions = reviews[person.name] || person.savedQuestions;
          
          return (
            <div key={person.name} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{person.name}</h2>
                  <p className="text-slate-9000 text-sm">{person.deals.length} Active Deals • {formatCurrency(person.totalValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-9000 uppercase tracking-wider font-bold mb-1">Pipeline Share</p>
                  <div className="flex items-center gap-3 justify-end">
                    <span className="text-emerald-400 font-bold">{person.percentageOfPipeline}%</span>
                    <div className="w-32 bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${person.percentageOfPipeline}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* NEW: Weekly Snapshot */}
              <div className="grid grid-cols-2 border-b border-slate-200 divide-x divide-slate-200 bg-emerald-50/30">
                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm mb-1">
                    <Trophy className="w-4 h-4" /> Won This Week
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(person.wonThisWeekValue)}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{person.wonThisWeekCount} deals closed</p>
                </div>
                
                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-sm mb-1">
                    <Banknote className="w-4 h-4" /> Collected This Week
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(person.collectedThisWeek)}</p>
                  <p className="text-sm text-slate-500 mt-0.5">cash in bank</p>
                </div>
              </div>

              <div className="grid grid-cols-4 border-b border-slate-200 divide-x divide-slate-200 bg-slate-50/50">
                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-blue-500 font-bold text-sm mb-1">
                    <PlusCircle className="w-4 h-4" /> Pipeline Added
                  </div>
                  <p className="text-xl font-bold text-slate-900">{person.createdThisWeekCount}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatCurrency(person.createdThisWeekValue)}</p>
                </div>

                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-sm mb-1">
                    <ArrowRight className="w-4 h-4" /> Progressed
                  </div>
                  <p className="text-xl font-bold text-slate-900">{person.progressedThisWeekCount}</p>
                  <p className="text-xs text-slate-500 mt-0.5">deals updated</p>
                </div>

                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-purple-500 font-bold text-sm mb-1">
                    <PhoneCall className="w-4 h-4" /> Utilization
                  </div>
                  <p className="text-xl font-bold text-slate-900">{person.utilization.calls + person.utilization.tasks}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{person.utilization.calls} calls, {person.utilization.tasks} tasks</p>
                </div>

                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-rose-500 font-bold text-sm mb-1">
                    <ShieldAlert className="w-4 h-4" /> CRM Hygiene
                  </div>
                  <div className="flex items-center gap-2 mt-1 w-full justify-center">
                    <div className="w-16 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${person.hygieneScore >= 80 ? 'bg-emerald-500' : person.hygieneScore >= 50 ? 'bg-amber-400' : 'bg-red-500'}`} 
                        style={{ width: `${person.hygieneScore}%` }}></div>
                    </div>
                    <span className={`text-base font-bold ${person.hygieneScore >= 80 ? 'text-emerald-500' : person.hygieneScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {person.hygieneScore}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{person.hygieneIssues} issues</p>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-500" /> AI Generated Questions
                  </h3>
                  <button 
                    onClick={() => generateReview(person)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-9000 text-slate-900 text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Generate New Review"}
                  </button>
                </div>
                
                {isGenerating ? (
                  <div className="py-8 text-center text-slate-9000 flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <p className="text-sm">AI AI is analyzing pipeline data...</p>
                  </div>
                ) : displayQuestions.length > 0 ? (
                  <ul className="space-y-4">
                    {displayQuestions.map((q, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600 bg-slate-100/30 p-3 rounded-lg border border-slate-200/50">
                        <span className="text-blue-500 font-bold shrink-0">Q.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center text-slate-9000">
                    <p className="text-sm">No review generated for this week yet. Click generate above.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
