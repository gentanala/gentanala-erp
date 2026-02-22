'use client';

import { useState } from 'react';
import {
    DollarSign,
    TrendingUp,
    Package,
    ShoppingCart,
    BarChart3,
    RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

// Demo data
const demoSummary = {
    totalRevenue: 2340000,
    totalCOGS: 1053000,
    grossProfit: 1287000,
    grossMargin: 55,
    assetValue: 4750000,
    pendingPayments: 685000,
    ordersThisMonth: 12,
    avgOrderValue: 450000,
};

const demoMonthlySales = [
    { month: '2025-09', revenue: 1800000, orders: 8 },
    { month: '2025-10', revenue: 2100000, orders: 10 },
    { month: '2025-11', revenue: 1950000, orders: 9 },
    { month: '2025-12', revenue: 2400000, orders: 11 },
    { month: '2026-01', revenue: 2340000, orders: 12 },
];

const demoProductPerformance = [
    { name: 'Hutan Tropis 42mm', sold: 45, revenue: 14850000 },
    { name: 'Kaliandra 42mm', sold: 32, revenue: 11200000 },
    { name: 'Hutan Tropis 38mm', sold: 28, revenue: 8680000 },
    { name: 'Monokrom Card Holder', sold: 50, revenue: 6000000 },
    { name: 'Phone Case', sold: 22, revenue: 3960000 },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
};

export default function ReportsPage() {
    const { isSuperAdmin } = useAuth();
    const [loading, setLoading] = useState(false);

    // Redirect Workshop Admin (shouldn't see this page)
    if (!isSuperAdmin) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Access Restricted</CardTitle>
                        <CardDescription>
                            Financial reports are only available to Super Admin users.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
                    <p className="text-muted-foreground">
                        Overview of revenue, margins, and business performance.
                    </p>
                </div>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-700">
                            {formatCurrency(demoSummary.totalRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">All delivered orders</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Gross Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(demoSummary.grossProfit)}</div>
                        <p className="text-xs text-muted-foreground">
                            {demoSummary.grossMargin.toFixed(1)}% margin
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Asset Value</CardTitle>
                        <Package className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700">
                            {formatCurrency(demoSummary.assetValue)}
                        </div>
                        <p className="text-xs text-muted-foreground">Stock at HPP</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(demoSummary.avgOrderValue)}</div>
                        <p className="text-xs text-muted-foreground">{demoSummary.ordersThisMonth} this month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Monthly Sales */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                            Monthly Sales
                        </CardTitle>
                        <CardDescription>Revenue trend over the last 5 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {demoMonthlySales.map((month) => {
                                const maxRevenue = Math.max(...demoMonthlySales.map((m) => m.revenue));
                                const percentage = (month.revenue / maxRevenue) * 100;

                                return (
                                    <div key={month.month} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">
                                                {new Date(month.month + '-01').toLocaleDateString('id-ID', {
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {formatCurrency(month.revenue)} ({month.orders} orders)
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            Top Products
                        </CardTitle>
                        <CardDescription>Best selling products by units sold</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {demoProductPerformance.map((product, index) => {
                                const maxSold = Math.max(...demoProductPerformance.map((p) => p.sold));
                                const percentage = (product.sold / maxSold) * 100;

                                return (
                                    <div key={product.name} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium flex items-center gap-2">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                                    {index + 1}
                                                </span>
                                                {product.name}
                                            </span>
                                            <span className="text-muted-foreground">{product.sold} sold</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* P&L Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Profit & Loss Summary</CardTitle>
                    <CardDescription>Simplified income statement</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <table className="w-full">
                            <tbody className="divide-y">
                                <tr className="bg-green-50/50">
                                    <td className="px-4 py-3 font-medium">Revenue</td>
                                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                                        {formatCurrency(demoSummary.totalRevenue)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-muted-foreground pl-8">Less: Cost of Goods Sold</td>
                                    <td className="px-4 py-3 text-right text-red-600">
                                        ({formatCurrency(demoSummary.totalCOGS)})
                                    </td>
                                </tr>
                                <tr className="bg-blue-50/50 font-medium">
                                    <td className="px-4 py-3">Gross Profit</td>
                                    <td className="px-4 py-3 text-right text-blue-700">
                                        {formatCurrency(demoSummary.grossProfit)}
                                    </td>
                                </tr>
                                <tr className="bg-muted/50">
                                    <td className="px-4 py-3 font-medium">Gross Margin</td>
                                    <td className="px-4 py-3 text-right font-semibold">
                                        {demoSummary.grossMargin.toFixed(1)}%
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                        * COGS is estimated based on average product cost ratios. For accurate reporting, connect
                        to actual order item cost data.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
