import Link from 'next/link';
import { 
  LayoutDashboard, Bot, Activity, AlertTriangle, 
  CheckSquare, Calendar, Target, TrendingUp, 
  Settings, Users, Briefcase, FileText
} from 'lucide-react';

const navigation = [
  { name: 'Command Centre', href: '/', icon: LayoutDashboard },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
  { name: 'Pipeline', href: '/pipeline', icon: Activity },
  { name: 'Qualification', href: '/qualification', icon: CheckSquare },
  { name: 'Stale Deals', href: '/stale-deals', icon: AlertTriangle },
  { name: 'Daily Actions', href: '/daily-actions', icon: Calendar },
  { name: 'Weekly Review', href: '/weekly-review', icon: FileText },
  { name: 'Target Tracker', href: '/targets', icon: Target },
  { name: 'Forecasting', href: '/forecasting', icon: TrendingUp },
  { name: 'Scorecards', href: '/scorecards', icon: Users },
  { name: 'Accounts', href: '/accounts', icon: Briefcase },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 border-r border-slate-800">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          ReClaim AI
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="text-slate-300 hover:bg-slate-800 hover:text-white group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
          >
            <item.icon className="text-slate-400 group-hover:text-blue-400 mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            CEO
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Management User</p>
            <p className="text-xs text-slate-400">Mock Data Mode</p>
          </div>
        </div>
      </div>
    </div>
  );
}
