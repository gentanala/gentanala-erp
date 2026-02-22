'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Order, OrderStatus, OrderItem, Product, OrderSource, OrderType } from '@/lib/database.types';

// ============================================
// ORDER ACTIONS
// ============================================

export async function getOrders(options?: {
    status?: OrderStatus;
    customerId?: string;
    search?: string;
}): Promise<Order[]> {
    const supabase = await createClient();

    let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (options?.status) {
        query = query.eq('status', options.status);
    }

    if (options?.customerId) {
        query = query.eq('customer_id', options.customerId);
    }

    if (options?.search) {
        query = query.or(`order_number.ilike.%${options.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as unknown as Order[];
}

export async function getOrder(id: string): Promise<Order> {
    const supabase = await createClient();

    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();

    if (error) throw error;
    return data as unknown as Order;
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at');

    if (error) throw error;
    return (data || []) as unknown as OrderItem[];
}

interface OrderItemInput {
    product_id: string;
    quantity: number;
    unit_price: number;
}

interface CreateOrderInput {
    customer_name: string;
    customer_phone: string;
    customer_address?: string;
    customer_notes?: string;
    items: OrderItemInput[];
    source?: OrderSource;
    type?: OrderType;
    internal_notes?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Generate order number
    const year = new Date().getFullYear();
    const { data: lastOrder } = await supabase
        .from('orders')
        .select('order_number')
        .like('order_number', `ORD-${year}-%`)
        .order('order_number', { ascending: false })
        .limit(1)
        .single();

    let nextSeq = 1;
    if (lastOrder?.order_number) {
        const parts = lastOrder.order_number.split('-');
        nextSeq = parseInt(parts[2]) + 1;
    }

    const order_number = `ORD-${year}-${String(nextSeq).padStart(4, '0')}`;

    // Calculate totals
    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    // Get or create customer
    let customer_id = null;
    const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', input.customer_phone)
        .single();

    if (existing) {
        customer_id = existing.id;
    } else {
        const { data: newCustomer } = await supabase
            .from('customers')
            .insert({
                name: input.customer_name,
                phone: input.customer_phone,
                whatsapp: input.customer_phone,
                address: input.customer_address || null,
            })
            .select('id')
            .single();
        customer_id = newCustomer?.id || null;
    }

    const orderData = {
        order_number,
        customer_id,
        customer_snapshot: {
            name: input.customer_name,
            phone: input.customer_phone,
            address: input.customer_address,
        },
        source: input.source || 'whatsapp' as OrderSource,
        type: input.type || 'stock' as OrderType,
        status: 'pending' as OrderStatus,
        subtotal,
        discount_amount: 0,
        shipping_cost: 0,
        total_amount: subtotal,
        shipping_address: input.customer_address || null,
        customer_notes: input.customer_notes || null,
        internal_notes: input.internal_notes || null,
        order_date: new Date().toISOString(),
        created_by: user?.id || null,
    };

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

    if (orderError) throw orderError;

    const orderResult = order as unknown as Order;

    // Create order items
    const itemsData = input.items.map((item) => ({
        order_id: orderResult.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(itemsData);

    if (itemsError) throw itemsError;

    revalidatePath('/dashboard/orders');
    return orderResult;
}

export async function updateOrderStatus(
    id: string,
    status: OrderStatus,
    extras?: {
        tracking_number?: string;
        shipping_method?: string;
        internal_notes?: string;
    }
): Promise<Order> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
    };

    // Set shipped date when status changes to sent
    if (status === 'sent') {
        updateData.shipped_date = new Date().toISOString();
        if (extras?.tracking_number) {
            updateData.tracking_number = extras.tracking_number;
        }
        if (extras?.shipping_method) {
            updateData.shipping_method = extras.shipping_method;
        }
    }

    if (extras?.internal_notes) {
        updateData.internal_notes = extras.internal_notes;
    }

    const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/dashboard/orders');
    revalidatePath(`/dashboard/orders/${id}`);
    return data as unknown as Order;
}

// ============================================
// DASHBOARD STATS
// ============================================

interface OrderStats {
    pending: number;
    production: number;
    packing: number;
    sent: number;
    totalRevenue: number;
}

export async function getOrderStats(): Promise<OrderStats> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('orders')
        .select('status, total_amount')
        .in('status', ['pending', 'production', 'qc', 'packing', 'sent']);

    if (error) throw error;

    const orders = (data || []) as { status: string; total_amount: number }[];

    return {
        pending: orders.filter((o) => o.status === 'pending').length,
        production: orders.filter((o) => o.status === 'production').length,
        packing: orders.filter((o) => o.status === 'qc' || o.status === 'packing').length,
        sent: orders.filter((o) => o.status === 'sent').length,
        totalRevenue: orders
            .filter((o) => o.status === 'sent')
            .reduce((sum, o) => sum + o.total_amount, 0),
    };
}

// Helper to get products for order creation
export async function getProductsForOrder(): Promise<
    Pick<Product, 'id' | 'sku' | 'name' | 'sale_price' | 'current_stock'>[]
> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('products')
        .select('id, sku, name, sale_price, current_stock')
        .eq('is_active', true)
        .gt('current_stock', 0)
        .order('name');

    if (error) throw error;
    return (data || []) as Pick<Product, 'id' | 'sku' | 'name' | 'sale_price' | 'current_stock'>[];
}
