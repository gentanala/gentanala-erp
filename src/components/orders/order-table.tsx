'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
    ShoppingCart,
    Clock,
    CheckCircle,
    Package,
    Truck,
    ChevronRight,
    Phone,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import type { Order, OrderStatus } from '@/lib/database.types';

interface OrderTableProps {
    orders: Order[];
    onUpdateStatus?: (order: Order, newStatus: OrderStatus) => void;
    onViewDetails?: (order: Order) => void;
}

// Status config matching the actual OrderStatus type: 'pending' | 'production' | 'qc' | 'packing' | 'sent' | 'cancelled'
const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> =
{
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    production: { label: 'Production', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    qc: { label: 'QC', color: 'bg-purple-100 text-purple-800', icon: Package },
    packing: { label: 'Packing', color: 'bg-indigo-100 text-indigo-800', icon: Package },
    sent: { label: 'Sent', color: 'bg-green-100 text-green-800', icon: Truck },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: Clock },
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
};

export function OrderTable({ orders, onUpdateStatus, onViewDetails }: OrderTableProps) {
    const [search, setSearch] = useState('');
    const { isSuperAdmin } = useAuth();

    const filteredOrders = orders.filter((order) => {
        if (!search) return true;
        return order.order_number.toLowerCase().includes(search.toLowerCase());
    });

    const getNextStatuses = (current: OrderStatus): OrderStatus[] => {
        const workflow: Record<OrderStatus, OrderStatus[]> = {
            pending: ['production', 'cancelled'],
            production: ['qc'],
            qc: ['packing'],
            packing: ['sent'],
            sent: [],
            cancelled: [],
        };
        return workflow[current];
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Search by order number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {/* Table */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No orders found</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => {
                                const StatusIcon = statusConfig[order.status].icon;
                                const nextStatuses = getNextStatuses(order.status);

                                return (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <span className="font-mono text-sm font-medium">{order.order_number}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{order.customer_snapshot?.name || 'Customer'}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {order.customer_snapshot?.phone || 'No phone'}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusConfig[order.status].color} variant="secondary">
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {statusConfig[order.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(order.total_amount)}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(order.created_at), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        Actions
                                                        <ChevronRight className="h-4 w-4 ml-1" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onViewDetails?.(order)}>
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {nextStatuses.map((nextStatus) => {
                                                        const config = statusConfig[nextStatus];
                                                        return (
                                                            <DropdownMenuItem
                                                                key={nextStatus}
                                                                onClick={() => onUpdateStatus?.(order, nextStatus)}
                                                                className={nextStatus === 'cancelled' ? 'text-destructive' : ''}
                                                            >
                                                                <config.icon className="h-4 w-4 mr-2" />
                                                                Mark as {config.label}
                                                            </DropdownMenuItem>
                                                        );
                                                    })}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Summary */}
            <div className="text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {orders.length} orders
                {isSuperAdmin && filteredOrders.length > 0 && (
                    <span>
                        {' '}
                        • Total value:{' '}
                        <span className="font-medium text-foreground">
                            {formatCurrency(filteredOrders.reduce((sum, o) => sum + o.total_amount, 0))}
                        </span>
                    </span>
                )}
            </div>
        </div>
    );
}
