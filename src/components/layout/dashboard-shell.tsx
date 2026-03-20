'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface DashboardShellProps {
    children: React.ReactNode;
    header?: React.ReactNode;
}

export function DashboardShell({ children, header }: DashboardShellProps) {
    const { loading, profile } = useAuth();
    const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-redirect to login if loading takes too long (6s) or no profile after loading
    useEffect(() => {
        if (!loading && !profile) {
            // Loading done but no profile — redirect immediately
            console.warn('[DashboardShell] No profile after auth loaded — redirecting to login');
            window.location.href = '/auth/login';
            return;
        }

        if (loading) {
            // Set a safety timer: if still loading after 6s, redirect to login
            redirectTimerRef.current = setTimeout(() => {
                console.warn('[DashboardShell] Auth loading timeout — redirecting to login');
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/auth/login';
            }, 6000);
        }

        return () => {
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
            }
        };
    }, [loading, profile]);

    if (loading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-6">
                <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-sm" />
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-900">Inisialisasi Sistem...</h2>
                        <p className="text-sm text-slate-500">Mohon tunggu sebentar, kami sedang menyiapkan dashboard Anda.</p>
                    </div>
                    
                    <div className="w-full h-px bg-slate-200 my-2" />
                    
                    <div className="flex flex-col gap-2 w-full">
                        <Button 
                            variant="outline" 
                            className="w-full py-6 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-white font-bold transition-all"
                            onClick={() => window.location.reload()}
                        >
                            Coba Muat Ulang
                        </Button>
                        <Button 
                            variant="destructive" 
                            className="w-full py-6 rounded-xl font-bold shadow-lg shadow-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={() => {
                                localStorage.clear();
                                sessionStorage.clear();
                                window.location.href = '/auth/login';
                            }}
                        >
                            Gagal Masuk? Force Logout
                        </Button>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 font-mono mt-4">
                        Status: Menunggu Auth Context (Auto-redirect dalam 6 detik)
                    </p>
                </div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-14 items-center gap-4 border-b px-6 shrink-0">
                    <SidebarTrigger className="-ml-2 md:hidden" />
                    <Separator orientation="vertical" className="h-6 md:hidden" />
                    {header}
                </header>
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
