'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, Factory, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

// Demo data - will be replaced with real data from Supabase
const statsData = {
    superAdmin: [
        { title: 'Total Products', value: '42', change: '+3 this week', icon: Package, color: 'text-blue-500' },
        { title: 'Active Orders', value: '12', change: '4 pending', icon: ShoppingCart, color: 'text-green-500' },
        { title: 'Production', value: '5', change: '2 in QC', icon: Factory, color: 'text-purple-500' },
        { title: 'Low Stock', value: '3', change: 'needs restock', icon: AlertTriangle, color: 'text-orange-500' },
    ],
    workshopAdmin: [
        { title: 'My Tasks', value: '5', change: '2 urgent', icon: Clock, color: 'text-blue-500' },
        { title: 'In Production', value: '3', change: '1 for QC', icon: Factory, color: 'text-purple-500' },
        { title: 'Completed Today', value: '7', change: '+2 from yesterday', icon: TrendingUp, color: 'text-green-500' },
    ],
};

const recentOrders = [
    { id: 'ORD-2026-0012', customer: 'John Doe', status: 'pending', total: 'Rp 660.000' },
    { id: 'ORD-2026-0011', customer: 'Jane Smith', status: 'production', total: 'Rp 330.000' },
    { id: 'ORD-2026-0010', customer: 'Bob Wilson', status: 'sent', total: 'Rp 990.000' },
];

const activeSPK = [
    { spk: 'SPK-2026-0042', product: 'Hutan Tropis 42mm', qty: 25, status: 'in_progress' },
    { spk: 'SPK-2026-0041', product: 'Kaliandra 38mm', qty: 15, status: 'qc' },
];

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    production: 'bg-blue-100 text-blue-800',
    qc: 'bg-purple-100 text-purple-800',
    packing: 'bg-indigo-100 text-indigo-800',
    sent: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
};

export default function DashboardPage() {
    const { profile, isSuperAdmin } = useAuth();
    const stats = isSuperAdmin ? statsData.superAdmin : statsData.workshopAdmin;

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Welcome back, {profile?.full_name || 'User'}
                </h1>
                <p className="text-muted-foreground">
                    {isSuperAdmin
                        ? "Here's an overview of your business today."
                        : "Here's your task overview for today."}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.change}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Orders - Super Admin Only */}
                {isSuperAdmin && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>Latest orders from all channels</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                                    >
                                        <div>
                                            <p className="font-medium">{order.id}</p>
                                            <p className="text-sm text-muted-foreground">{order.customer}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge className={statusColors[order.status]} variant="secondary">
                                                {order.status}
                                            </Badge>
                                            <p className="text-sm font-medium mt-1">{order.total}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Active Production */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Production</CardTitle>
                        <CardDescription>
                            {isSuperAdmin ? 'All work orders in progress' : 'Your assigned work orders'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activeSPK.map((spk) => (
                                <div
                                    key={spk.spk}
                                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                                >
                                    <div>
                                        <p className="font-medium">{spk.spk}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {spk.product} × {spk.qty}
                                        </p>
                                    </div>
                                    <Badge className={statusColors[spk.status]} variant="secondary">
                                        {spk.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Alert - Super Admin Only */}
                {isSuperAdmin && (
                    <Card className="border-orange-200 bg-orange-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-700">
                                <AlertTriangle className="h-5 w-5" />
                                Low Stock Alert
                            </CardTitle>
                            <CardDescription>Products below minimum threshold</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Hutan Tropis 38mm</span>
                                    <Badge variant="destructive">2 left</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Kaliandra Card Holder</span>
                                    <Badge variant="destructive">4 left</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Monokrom Phone Case</span>
                                    <Badge variant="destructive">1 left</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
