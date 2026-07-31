"use client";

import { useState } from 'react';
import { FileText, Download, CheckSquare, Loader2, Bot } from 'lucide-react';
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
          deals: person.deals
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
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-emerald-500" />
            Weekly Commercial Review
          </h1>
          <p className="text-slate-400 mt-1">AI-generated coaching preparation powered by Groq and live Zoho data.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg border border-slate-700 transition-colors">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      <div className="space-y-6">
        {teamArray.map(person => {
          const isGenerating = loadingStates[person.name];
          const displayQuestions = reviews[person.name] || person.savedQuestions;
          
          return (
            <div key={person.name} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">{person.name}</h2>
                  <p className="text-slate-400 text-sm">{person.deals.length} Active Deals • {formatCurrency(person.totalValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Pipeline Share</p>
                  <div className="flex items-center gap-3 justify-end">
                    <span className="text-emerald-400 font-bold">{person.percentageOfPipeline}%</span>
                    <div className="w-32 bg-slate-800 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${person.percentageOfPipeline}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-500" /> AI Generated Questions
                  </h3>
                  <button 
                    onClick={() => generateReview(person)}
                    disabled={isGenerating}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Generate New Review"}
                  </button>
                </div>
                
                {isGenerating ? (
                  <div className="py-8 text-center text-slate-500 flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <p className="text-sm">Groq AI is analyzing pipeline data...</p>
                  </div>
                ) : displayQuestions.length > 0 ? (
                  <ul className="space-y-4">
                    {displayQuestions.map((q, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-slate-800/50">
                        <span className="text-blue-500 font-bold shrink-0">Q.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-8 text-center text-slate-500">
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
