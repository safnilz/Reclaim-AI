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
    <div className="flex h-full w-full flex-col bg-white border-r border-slate-200">
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <Link href="/" className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Bot className="w-5 h-5 text-blue-500" />
          Ehfaaz CRM Assistant
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors"
          >
            <item.icon className="text-slate-9000 group-hover:text-blue-400 mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-slate-900 font-bold text-xs">
            CEO
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-slate-900">Management View</p>
            <p className="text-xs text-slate-500">Live CRM Data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
