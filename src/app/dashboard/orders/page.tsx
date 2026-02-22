'use client';

import { useState } from 'react';
import { Plus, ShoppingCart, Clock, CheckCircle, Truck, Package, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderTable } from '@/components/orders/order-table';
import { useAuth } from '@/contexts/auth-context';
import type { Order, OrderStatus } from '@/lib/database.types';
import { toast } from 'sonner';

// Demo data matching the exact Order type
const demoOrders: Order[] = [
    {
        id: '1',
        order_number: 'ORD-2026-0015',
        customer_id: '1',
        customer_snapshot: {
            name: 'John Doe',
            phone: '08123456789',
            address: 'Jl. Contoh No. 123, Jakarta',
        },
        source: 'whatsapp',
        type: 'stock',
        status: 'pending',
        subtotal: 660000,
        discount_amount: 0,
        shipping_cost: 25000,
        total_amount: 685000,
        shipping_address: 'Jl. Contoh No. 123, Jakarta',
        shipping_method: 'JNE',
        tracking_number: null,
        order_date: new Date().toISOString(),
        shipped_date: null,
        internal_notes: null,
        customer_notes: 'Gift wrap please',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
    },
    {
        id: '2',
        order_number: 'ORD-2026-0014',
        customer_id: '2',
        customer_snapshot: {
            name: 'Jane Smith',
            phone: '08198765432',
            address: 'Jl. Test No. 456, Bandung',
        },
        source: 'custom',
        type: 'custom',
        status: 'production',
        subtotal: 450000,
        discount_amount: 50000,
        shipping_cost: 20000,
        total_amount: 420000,
        shipping_address: 'Jl. Test No. 456, Bandung',
        shipping_method: 'JNE',
        tracking_number: null,
        order_date: new Date(Date.now() - 86400000).toISOString(),
        shipped_date: null,
        internal_notes: 'Repeat customer - VIP',
        customer_notes: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
    },
    {
        id: '3',
        order_number: 'ORD-2026-0013',
        customer_id: '3',
        customer_snapshot: {
            name: 'Budi Santoso',
            phone: '08112233445',
            address: 'Jl. Sample No. 789, Surabaya',
        },
        source: 'tokopedia',
        type: 'stock',
        status: 'sent',
        subtotal: 330000,
        discount_amount: 0,
        shipping_cost: 15000,
        total_amount: 345000,
        shipping_address: 'Jl. Sample No. 789, Surabaya',
        shipping_method: 'JNE',
        tracking_number: 'JNE123456789',
        order_date: new Date(Date.now() - 259200000).toISOString(),
        shipped_date: new Date(Date.now() - 86400000).toISOString(),
        internal_notes: null,
        customer_notes: null,
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
    },
    {
        id: '4',
        order_number: 'ORD-2026-0012',
        customer_id: '4',
        customer_snapshot: {
            name: 'Siti Rahma',
            phone: '08156789012',
            address: 'Jl. Finished No. 999, Yogyakarta',
        },
        source: 'shopee',
        type: 'stock',
        status: 'packing',
        subtotal: 990000,
        discount_amount: 100000,
        shipping_cost: 0,
        total_amount: 890000,
        shipping_address: 'Jl. Finished No. 999, Yogyakarta',
        shipping_method: 'SiCepat',
        tracking_number: 'SCP88776655',
        order_date: new Date(Date.now() - 691200000).toISOString(),
        shipped_date: null,
        internal_notes: null,
        customer_notes: null,
        created_at: new Date(Date.now() - 691200000).toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
    },
];

export default function OrdersPage() {
    const { isSuperAdmin } = useAuth();
    const [orders, setOrders] = useState<Order[]>(demoOrders);
    const [loading, setLoading] = useState(false);

    // Stats
    const pending = orders.filter((o) => o.status === 'pending').length;
    const production = orders.filter((o) => o.status === 'production').length;
    const packing = orders.filter((o) => o.status === 'packing' || o.status === 'qc').length;
    const sent = orders.filter((o) => o.status === 'sent').length;

    const totalRevenue = orders
        .filter((o) => o.status === 'sent')
        .reduce((sum, o) => sum + o.total_amount, 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleUpdateStatus = async (order: Order, newStatus: OrderStatus) => {
        try {
            setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
            toast.success(`Order ${order.order_number} updated to ${newStatus}`);
        } catch {
            toast.error('Failed to update order status');
        }
    };

    const handleViewDetails = (order: Order) => {
        toast.info(`Order details: ${order.order_number}`);
    };

    const handleRefresh = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
                    <p className="text-muted-foreground">
                        Manage customer orders, track status, and process shipments.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Order
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className={pending > 0 ? 'border-yellow-200 bg-yellow-50/50' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                        <Clock
                            className={`h-4 w-4 ${pending > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}
                        />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${pending > 0 ? 'text-yellow-600' : ''}`}>
                            {pending}
                        </div>
                        <p className="text-xs text-muted-foreground">Awaiting production</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Production</CardTitle>
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{production}</div>
                        <p className="text-xs text-muted-foreground">Being made</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Packing</CardTitle>
                        <Package className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{packing}</div>
                        <p className="text-xs text-muted-foreground">QC / Packing</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
                        <Truck className="h-4 w-4 text-cyan-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sent}</div>
                        <p className="text-xs text-muted-foreground">Shipped</p>
                    </CardContent>
                </Card>

                {isSuperAdmin && (
                    <Card className="border-green-200 bg-green-50/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
                            <p className="text-xs text-muted-foreground">From shipped orders</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Order Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <OrderTable
                        orders={orders}
                        onUpdateStatus={handleUpdateStatus}
                        onViewDetails={handleViewDetails}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
