import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-slate-50">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-slate-800">Loading module...</h2>
      <p className="text-slate-500 text-sm mt-2">Fetching live data from CRM</p>
    </div>
  );
}
