'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, Factory, AlertTriangle, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { getInventoryStats, getLowStockProducts } from '@/lib/actions/inventory';
import { getOrderStats, getOrders } from '@/lib/actions/orders';
import { getProductionStats, getProductionRuns } from '@/lib/actions/production';

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
    
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [activeSPK, setActiveSPK] = useState<any[]>([]);
    const [lowStock, setLowStock] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [
                inventoryStats, 
                orderStats, 
                prodStats, 
                allOrders, 
                allRuns, 
                lowStockProds
            ] = await Promise.all([
                getInventoryStats().catch(() => ({ totalProducts: 0, lowStockCount: 0 })),
                getOrderStats().catch(() => ({ pending: 0, production: 0 })),
                getProductionStats().catch(() => ({ inProgress: 0, inQC: 0, completed: 0 })),
                getOrders().catch(() => []), 
                getProductionRuns().catch(() => []),
                getLowStockProducts().catch(() => [])
            ]);

            setStats({
                inventory: inventoryStats,
                orders: orderStats,
                production: prodStats
            });

            // Top 5 recent orders
            setRecentOrders(allOrders.slice(0, 5));
            // Active SPK (in progress or qc)
            setActiveSPK(allRuns.filter(r => r.status === 'in_progress' || r.status === 'qc').slice(0, 5));
            // Low stock
            setLowStock(lowStockProds.slice(0, 5));
        } catch (error) {
            console.error("Failed to load dashboard data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (profile) {
            fetchData();
        }
    }, [profile, fetchData]);

    if (!profile || loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const statsData = {
        superAdmin: [
            { title: 'Total Products', value: stats?.inventory.totalProducts || '0', change: 'Active items', icon: Package, color: 'text-blue-500' },
            { title: 'Active Orders', value: (stats?.orders.pending + stats?.orders.production) || '0', change: 'Needs processing', icon: ShoppingCart, color: 'text-green-500' },
            { title: 'Production', value: (stats?.production.inProgress + stats?.production.inQC) || '0', change: 'Currently active', icon: Factory, color: 'text-purple-500' },
            { title: 'Low Stock', value: stats?.inventory.lowStockCount || '0', change: 'Needs restock', icon: AlertTriangle, color: 'text-orange-500' },
        ],
        workshopAdmin: [
            { title: 'My Tasks', value: stats?.production.inProgress || '0', change: 'Assigned to you', icon: Clock, color: 'text-blue-500' },
            { title: 'In QC', value: stats?.production.inQC || '0', change: 'Waiting inspection', icon: Factory, color: 'text-purple-500' },
            { title: 'Completed Today', value: stats?.production.completed || '0', change: 'Total done', icon: TrendingUp, color: 'text-green-500' },
        ],
    };

    const displayStats = isSuperAdmin ? statsData.superAdmin : statsData.workshopAdmin;

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
                {displayStats.map((stat) => (
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
                                {recentOrders.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No recent orders.</p>
                                ) : recentOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                                    >
                                        <div>
                                            <p className="font-medium">{order.order_number}</p>
                                            <p className="text-sm text-muted-foreground">{order.customer_snapshot?.name || 'Customer'}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge className={statusColors[order.status] || ''} variant="secondary">
                                                {order.status}
                                            </Badge>
                                            <p className="text-sm font-medium mt-1">{formatCurrency(order.total_amount || 0)}</p>
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
                            {activeSPK.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No active production runs.</p>
                            ) : activeSPK.map((spk) => (
                                <div
                                    key={spk.id}
                                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                                >
                                    <div>
                                        <p className="font-medium">{spk.spk_number}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Qty: {spk.quantity_planned}
                                        </p>
                                    </div>
                                    <Badge className={statusColors[spk.status] || ''} variant="secondary">
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
                                {lowStock.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">All stocks are good.</p>
                                ) : lowStock.map(p => (
                                    <div key={p.id} className="flex items-center justify-between">
                                        <span className="text-sm">{p.name} {p.variant ? `(${p.variant})` : ''}</span>
                                        <Badge variant="destructive">{p.current_stock} left</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
