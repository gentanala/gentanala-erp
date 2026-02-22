import { AuthProvider } from '@/contexts/auth-context';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <DashboardShell>{children}</DashboardShell>
        </AuthProvider>
    );
}
