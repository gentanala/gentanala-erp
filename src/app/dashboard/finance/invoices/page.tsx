'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
    FileText,
    DollarSign,
    Clock,
    CheckCircle,
    RefreshCw,
    Send,
    Download,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/auth-context';
import type { Invoice } from '@/lib/database.types';
import { toast } from 'sonner';

// Demo data matching the Invoice type
const demoInvoices: Invoice[] = [
    {
        id: '1',
        invoice_number: 'INV-202601-0003',
        type: 'invoice',
        order_id: '1',
        customer_snapshot: { name: 'John Doe', phone: '08123456789', address: 'Jakarta' },
        subtotal: 660000,
        discount: 0,
        tax: 0,
        total: 685000,
        items: [
            { sku: 'WTC-HT42-BLK', name: 'Hutan Tropis 42mm', qty: 2, price: 330000, total: 660000 },
        ],
        status: 'sent',
        issued_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 604800000).toISOString(),
        paid_date: null,
        pdf_url: null,
        notes: null,
        terms: null,
        created_at: new Date().toISOString(),
        created_by: null,
    },
    {
        id: '2',
        invoice_number: 'INV-202601-0002',
        type: 'invoice',
        order_id: '2',
        customer_snapshot: { name: 'Jane Smith', phone: '08198765432', address: 'Bandung' },
        subtotal: 450000,
        discount: 50000,
        tax: 0,
        total: 420000,
        items: [{ sku: 'WTC-KL42-NAT', name: 'Kaliandra 42mm', qty: 1, price: 350000, total: 350000 }],
        status: 'paid',
        issued_date: new Date(Date.now() - 259200000).toISOString(),
        due_date: new Date(Date.now() - 86400000).toISOString(),
        paid_date: new Date(Date.now() - 172800000).toISOString(),
        pdf_url: null,
        notes: null,
        terms: null,
        created_at: new Date(Date.now() - 259200000).toISOString(),
        created_by: null,
    },
    {
        id: '3',
        invoice_number: 'INV-202601-0001',
        type: 'invoice',
        order_id: '3',
        customer_snapshot: { name: 'Budi Santoso', phone: '08112233445', address: 'Surabaya' },
        subtotal: 330000,
        discount: 0,
        tax: 0,
        total: 345000,
        items: [{ sku: 'WTC-HT38-BRN', name: 'Hutan Tropis 38mm', qty: 1, price: 310000, total: 310000 }],
        status: 'paid',
        issued_date: new Date(Date.now() - 518400000).toISOString(),
        due_date: null,
        paid_date: new Date(Date.now() - 432000000).toISOString(),
        pdf_url: null,
        notes: null,
        terms: null,
        created_at: new Date(Date.now() - 518400000).toISOString(),
        created_by: null,
    },
];

const statusConfig = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-800', icon: FileText },
    sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
    paid: { label: 'Paid', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: Clock },
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
};

export default function InvoicesPage() {
    const { isSuperAdmin } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>(demoInvoices);
    const [loading, setLoading] = useState(false);

    // Stats
    const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const totalPending = invoices
        .filter((i) => ['draft', 'sent'].includes(i.status))
        .reduce((sum, i) => sum + i.total, 0);
    const paidCount = invoices.filter((i) => i.status === 'paid').length;
    const pendingCount = invoices.filter((i) => ['draft', 'sent'].includes(i.status)).length;

    const handleMarkPaid = async (invoice: Invoice) => {
        setInvoices((prev) =>
            prev.map((i) =>
                i.id === invoice.id
                    ? { ...i, status: 'paid' as const, paid_date: new Date().toISOString() }
                    : i
            )
        );
        toast.success(`Invoice ${invoice.invoice_number} marked as paid`);
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
                    <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
                    <p className="text-muted-foreground">Manage invoices and track payments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-green-200 bg-green-50/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                        <p className="text-xs text-muted-foreground">{paidCount} invoices</p>
                    </CardContent>
                </Card>

                <Card className={pendingCount > 0 ? 'border-yellow-200 bg-yellow-50/50' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                        <Clock
                            className={`h-4 w-4 ${pendingCount > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}
                        />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-xl font-bold ${pendingCount > 0 ? 'text-yellow-600' : ''}`}>
                            {formatCurrency(totalPending)}
                        </div>
                        <p className="text-xs text-muted-foreground">{pendingCount} invoices</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{invoices.length}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">
                            {formatCurrency(
                                invoices.length > 0 ? (totalPaid + totalPending) / invoices.length : 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Per invoice</p>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice) => {
                                    const status = statusConfig[invoice.status];
                                    const StatusIcon = status.icon;

                                    return (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-mono text-sm font-medium">
                                                {invoice.invoice_number}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{invoice.customer_snapshot.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {invoice.customer_snapshot.phone}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(invoice.total)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={status.color} variant="secondary">
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(invoice.issued_date), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="sm">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    {['draft', 'sent'].includes(invoice.status) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleMarkPaid(invoice)}
                                                        >
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
