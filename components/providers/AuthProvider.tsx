'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/onboarding', '/invite', '/auth/callback', '/auth/auth-error'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated, initializeAuth, setUser, setIsAuthenticated } = useStore();

  useEffect(() => {
    // Initialize auth on mount
    initializeAuth();
  }, [initializeAuth]);

  // Handle route protection
  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
    }

    if (isAuthenticated && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Don't show loading for public routes - let them render immediately
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));
  
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#c81f25]" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
