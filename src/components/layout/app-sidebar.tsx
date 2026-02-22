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
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
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
            <SidebarHeader className="border-b border-white/20 px-4 py-4 md:pt-4">
                <div className="flex flex-col gap-4">
                    <div className="hidden md:flex justify-end min-h-6 h-6">
                        <SidebarTrigger className="text-slate-500 hover:text-slate-900 bg-white/40 hover:bg-white/60 glass shadow-none rounded-md h-7 w-7" />
                    </div>
                    <div className="flex items-center gap-2 px-1 pb-2">
                        <div className="flex flex-col group-data-[collapsible=icon]:hidden w-full">
                            <img
                                src="https://dxpjikwepbeufjieduih.supabase.co/storage/v1/object/public/logo/Logo%20gentanala.png"
                                alt="Gentanala"
                                className="h-6 w-auto object-contain object-left mb-1 drop-shadow-sm"
                            />
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest pl-0.5">GentaCore Dashboard</span>
                        </div>
                        <img
                            src="https://dxpjikwepbeufjieduih.supabase.co/storage/v1/object/public/logo/logo%20kotak%20kecil.png"
                            alt="G"
                            className="h-8 w-8 object-contain hidden group-data-[collapsible=icon]:block drop-shadow-md mx-auto"
                        />
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
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.href}
                                        className={cn(
                                            "transition-all rounded-xl hover:bg-white/40 mb-1",
                                            pathname === item.href && "glass text-primary font-bold shadow-sm"
                                        )}
                                    >
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
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.href}
                                            className={cn(
                                                "transition-all rounded-xl hover:bg-white/40 mb-1",
                                                pathname === item.href && "glass text-primary font-bold shadow-sm"
                                            )}
                                        >
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
                                        <SidebarMenuButton
                                            asChild
                                            isActive={pathname === item.href}
                                            className={cn(
                                                "transition-all rounded-xl hover:bg-white/40 mb-1",
                                                pathname === item.href && "glass text-primary font-bold shadow-sm"
                                            )}
                                        >
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
                        <button className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-white/40 transition-colors">
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
