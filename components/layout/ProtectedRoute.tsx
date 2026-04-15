// components/layout/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, dbUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (adminOnly && dbUser?.role !== 'admin') {
        router.push('/dashboard'); // Redirect citizens away from admin pages
      }
    }
  }, [user, dbUser, loading, router, adminOnly]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-500 animate-pulse">Loading secure environment...</div>;
  }

  return user ? <>{children}</> : null;
}