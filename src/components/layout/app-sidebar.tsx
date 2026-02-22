'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Package,
    ShoppingCart,
    Factory,
    FileText,
    LayoutDashboard,
    Settings,
    LogOut,
    AlertTriangle,
    ChevronDown,
} from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const mainNavItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['super_admin', 'workshop_admin'],
    },
    {
        title: 'Inventory',
        href: '/dashboard/inventory',
        icon: Package,
        roles: ['super_admin', 'workshop_admin'],
    },
    {
        title: 'Orders',
        href: '/dashboard/orders',
        icon: ShoppingCart,
        roles: ['super_admin', 'workshop_admin'],
    },
    {
        title: 'Production',
        href: '/dashboard/production',
        icon: Factory,
        roles: ['super_admin', 'workshop_admin'],
    },
];

const financeNavItems = [
    {
        title: 'Invoices',
        href: '/dashboard/finance/invoices',
        icon: FileText,
        roles: ['super_admin'],
    },
    {
        title: 'Reports',
        href: '/dashboard/finance/reports',
        icon: LayoutDashboard,
        roles: ['super_admin'],
    },
];

const systemNavItems = [
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        roles: ['super_admin'],
    },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { profile, isSuperAdmin, signOut } = useAuth();

    const filterByRole = (items: typeof mainNavItems) => {
        return items.filter((item) =>
            item.roles.includes(profile?.role || 'workshop_admin')
        );
    };

    const getInitials = (name: string | null) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        G
                    </div>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="font-semibold">Gentanala</span>
                        <span className="text-xs text-muted-foreground">Mini ERP</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filterByRole(mainNavItems).map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                                        <Link href={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Finance Section - Super Admin Only */}
                {isSuperAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Finance</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {financeNavItems.map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton asChild isActive={pathname === item.href}>
                                            <Link href={item.href}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {/* System Section - Super Admin Only */}
                {isSuperAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>System</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {filterByRole(systemNavItems).map((item) => (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton asChild isActive={pathname === item.href}>
                                            <Link href={item.href}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                    {getInitials(profile?.full_name ?? null)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-1 flex-col items-start text-left">
                                <span className="text-sm font-medium truncate max-w-[120px]">
                                    {profile?.full_name || 'User'}
                                </span>
                                <Badge variant={isSuperAdmin ? 'default' : 'secondary'} className="text-[10px] h-4">
                                    {isSuperAdmin ? 'Super Admin' : 'Workshop Admin'}
                                </Badge>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={signOut} className="text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
