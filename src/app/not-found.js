import Link from 'next/link';
import { Construction } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 text-center">
      <div className="bg-slate-900 p-6 rounded-full border border-slate-800 mb-4">
        <Construction className="w-16 h-16 text-blue-500" />
      </div>
      <h1 className="text-3xl font-bold text-white tracking-tight">Module Under Construction</h1>
      <p className="text-slate-400 max-w-md">
        This specific module is scheduled for development in a future phase. For Phase 1 and 2, please focus on the Command Centre, AI Assistant, Qualification, Stale Deals, and Daily Actions.
      </p>
      <Link 
        href="/"
        className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        Return to Command Centre
      </Link>
    </div>
  );
}
