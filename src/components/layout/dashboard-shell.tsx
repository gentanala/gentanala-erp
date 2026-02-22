'use client';

import { useAuth } from '@/contexts/auth-context';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardShellProps {
    children: React.ReactNode;
    header?: React.ReactNode;
}

export function DashboardShell({ children, header }: DashboardShellProps) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
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
