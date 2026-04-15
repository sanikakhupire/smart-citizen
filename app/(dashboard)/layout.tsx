// app/(dashboard)/layout.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { usePathname } from 'next/navigation';
import MobileHeader from '@/components/layout/MobileHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { dbUser, logout } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    { name: 'My Reports', href: '/citizen', role: 'citizen' },
    { name: 'Report Issue', href: '/report', role: 'citizen' },
    { name: 'Admin Hub', href: '/admin', role: 'admin' },
    { name: 'Analytics', href: '/analytics', role: 'admin' },
    { name: 'Live Map', href: '/map', role: 'all' },
  ];

  return (
    <ProtectedRoute>
      {/* Updated to flex-col for mobile, md:flex-row for desktop */}
      <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <MobileHeader />

        {/* Desktop Sidebar (Hidden on Mobile) */}
        <aside className="w-64 bg-slate-900 text-white flex-col hidden md:flex shrink-0">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-black tracking-tight text-white">Smart<span className="text-blue-500">Citizen</span></h2>
            <p className="text-xs text-slate-400 mt-1 capitalize">{dbUser?.role} Account</p>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navLinks.map((link) => {
              // Only show links appropriate for the user's role
              if (link.role !== 'all' && link.role !== dbUser?.role) return null;
              
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="mb-4 px-2">
              <p className="text-sm font-medium truncate">{dbUser?.name}</p>
              <p className="text-xs text-slate-400 truncate">{dbUser?.email}</p>
            </div>
            <button 
              onClick={logout}
              className="w-full px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-red-500 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}