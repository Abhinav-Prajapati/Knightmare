// components/AuthGuard.tsx
'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ReactNode } from 'react';

interface AuthGuardProps {
    children: ReactNode;
    requireAuth?: boolean; // true for protected routes, false for public only routes
}

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
    const { isAuthenticated, isHydrated } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only redirect after hydration is complete
        if (!isHydrated) return;

        // For protected routes, redirect to login if not authenticated
        if (requireAuth && !isAuthenticated) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }

        // For public-only routes (like login), redirect to dashboard if authenticated
        if (!requireAuth && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isHydrated, requireAuth, router, pathname]);

    // Show loading state while hydrating
    if (!isHydrated) {
        return <div>Loading auth state...</div>;
    }

    // Only render children for appropriate auth state after hydration
    if (requireAuth && !isAuthenticated) {
        return <div>Redirecting to login...</div>;
    }

    if (!requireAuth && isAuthenticated) {
        return <div>Redirecting to dashboard...</div>;
    }

    return <>{children}</>;
}