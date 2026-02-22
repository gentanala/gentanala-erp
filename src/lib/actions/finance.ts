'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Invoice, Order, Product } from '@/lib/database.types';

// ============================================
// INVOICE ACTIONS
// ============================================

export async function getInvoices(options?: {
    status?: 'draft' | 'sent' | 'paid' | 'cancelled';
    orderId?: string;
}): Promise<Invoice[]> {
    const supabase = await createClient();

    let query = supabase.from('invoices').select('*').order('created_at', { ascending: false });

    if (options?.status) {
        query = query.eq('payment_status', options.status);
    }

    if (options?.orderId) {
        query = query.eq('order_id', options.orderId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as unknown as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice> {
    const supabase = await createClient();

    const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single();

    if (error) throw error;
    return data as unknown as Invoice;
}

interface CreateInvoiceInput {
    order_id: string;
    due_date?: string;
    notes?: string;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Get order details
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', input.order_id)
        .single();

    if (orderError) throw orderError;

    const orderData = order as unknown as Order;

    // Generate invoice number
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .like('invoice_number', `INV-${year}${month}-%`)
        .order('invoice_number', { ascending: false })
        .limit(1)
        .single();

    let nextSeq = 1;
    if (lastInvoice?.invoice_number) {
        const parts = lastInvoice.invoice_number.split('-');
        nextSeq = parseInt(parts[2]) + 1;
    }

    const invoice_number = `INV-${year}${month}-${String(nextSeq).padStart(4, '0')}`;

    // Get order items to create invoice items
    const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity, unit_price, line_total')
        .eq('order_id', input.order_id);

    // Get product names
    const productIds = (orderItems || []).map((i) => i.product_id);
    const { data: products } = await supabase.from('products').select('id, sku, name').in('id', productIds);

    const productMap = new Map((products || []).map((p) => [p.id, p]));

    const items = (orderItems || []).map((item) => {
        const product = productMap.get(item.product_id);
        return {
            sku: product?.sku || '',
            name: product?.name || 'Unknown Product',
            qty: item.quantity,
            price: item.unit_price,
            total: item.line_total,
        };
    });

    const invoiceData = {
        invoice_number,
        order_id: input.order_id,
        customer_id: orderData.customer_id,
        subtotal: orderData.subtotal,
        discount: orderData.discount_amount,
        shipping: orderData.shipping_cost,
        total: orderData.total_amount,
        items,
        payment_status: 'draft' as const,
        due_date: input.due_date || null,
        notes: input.notes || null,
        created_by: user?.id || null,
    };

    const { data, error } = await supabase.from('invoices').insert(invoiceData).select().single();

    if (error) throw error;

    revalidatePath('/dashboard/finance/invoices');
    return data as unknown as Invoice;
}

export async function updateInvoiceStatus(
    id: string,
    status: 'draft' | 'sent' | 'paid' | 'cancelled',
    extras?: { paid_at?: string; notes?: string }
): Promise<Invoice> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
        payment_status: status,
    };

    if (status === 'paid' && extras?.paid_at) {
        updateData.paid_at = extras.paid_at;
    }

    if (extras?.notes) {
        updateData.notes = extras.notes;
    }

    const { data, error } = await supabase.from('invoices').update(updateData).eq('id', id).select().single();

    if (error) throw error;

    revalidatePath('/dashboard/finance/invoices');
    return data as unknown as Invoice;
}

// ============================================
// FINANCIAL REPORTS
// ============================================

interface FinancialSummary {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    grossMargin: number;
    assetValue: number;
    pendingPayments: number;
    ordersThisMonth: number;
    avgOrderValue: number;
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
    const supabase = await createClient();

    // Get delivered orders for revenue
    const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, subtotal, status, created_at')
        .eq('status', 'delivered');

    const ordersList = (orders || []) as { total_amount: number; subtotal: number; status: string; created_at: string }[];

    const totalRevenue = ordersList.reduce((sum, o) => sum + o.total_amount, 0);

    // Get products for asset value (stock * cost)
    const { data: products } = await supabase
        .from('products')
        .select('current_stock, cost_price, sale_price')
        .eq('is_active', true);

    const productsList = (products || []) as { current_stock: number; cost_price: number; sale_price: number }[];

    const assetValue = productsList.reduce((sum, p) => sum + p.current_stock * p.cost_price, 0);

    // Estimate COGS (simplified - actual would use order items + product costs)
    const avgCostRatio = productsList.length > 0
        ? productsList.reduce((sum, p) => sum + p.cost_price / (p.sale_price || 1), 0) / productsList.length
        : 0.45;

    const totalCOGS = totalRevenue * avgCostRatio;
    const grossProfit = totalRevenue - totalCOGS;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Get pending invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select('total, payment_status')
        .in('payment_status', ['draft', 'sent']);

    const pendingPayments = (invoices || []).reduce(
        (sum, i) => sum + (i as { total: number; payment_status: string }).total,
        0
    );

    // Orders this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const ordersThisMonth = ordersList.filter(
        (o) => new Date(o.created_at) >= startOfMonth
    ).length;

    const avgOrderValue = ordersList.length > 0 ? totalRevenue / ordersList.length : 0;

    return {
        totalRevenue,
        totalCOGS,
        grossProfit,
        grossMargin,
        assetValue,
        pendingPayments,
        ordersThisMonth,
        avgOrderValue,
    };
}

interface MonthlySales {
    month: string;
    revenue: number;
    orders: number;
}

export async function getMonthlySales(months = 6): Promise<MonthlySales[]> {
    const supabase = await createClient();

    const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

    const ordersList = (orders || []) as { total_amount: number; created_at: string }[];

    // Group by month
    const monthlyData = new Map<string, { revenue: number; orders: number }>();

    ordersList.forEach((order) => {
        const date = new Date(order.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData.has(key)) {
            monthlyData.set(key, { revenue: 0, orders: 0 });
        }

        const data = monthlyData.get(key)!;
        data.revenue += order.total_amount;
        data.orders += 1;
    });

    // Convert to array and sort
    const result = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
            month,
            revenue: data.revenue,
            orders: data.orders,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-months);

    return result;
}
