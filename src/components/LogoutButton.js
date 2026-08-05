"use client";

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      className="ml-auto text-slate-500 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"
      title="Logout"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
