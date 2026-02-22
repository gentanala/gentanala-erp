'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Product, ProductType, InventoryMovement, MovementType } from '@/lib/database.types';

// ============================================
// PRODUCT ACTIONS
// ============================================

export async function getProducts(options?: {
    search?: string;
    type?: ProductType;
    lowStockOnly?: boolean;
}): Promise<Product[]> {
    const supabase = await createClient();

    let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,sku.ilike.%${options.search}%`);
    }

    if (options?.type) {
        query = query.eq('type', options.type);
    }

    const { data, error } = await query;

    if (error) throw error;

    const products = (data || []) as unknown as Product[];

    // Filter low stock in JS since we can't compare columns in Supabase client
    if (options?.lowStockOnly) {
        return products.filter((p) => p.current_stock < p.min_stock_threshold);
    }

    return products;
}

export async function getProduct(id: string): Promise<Product> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as unknown as Product;
}

interface CreateProductInput {
    sku: string;
    name: string;
    type: ProductType;
    description?: string;
    collection?: string;
    variant?: string;
    sale_price: number;
    cost_price: number;
    current_stock: number;
    min_stock_threshold: number;
}

export async function createProduct(product: CreateProductInput): Promise<Product> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const insertData = {
        sku: product.sku,
        name: product.name,
        type: product.type,
        description: product.description || null,
        collection: product.collection || null,
        variant: product.variant || null,
        sale_price: product.sale_price,
        cost_price: product.cost_price,
        current_stock: product.current_stock,
        min_stock_threshold: product.min_stock_threshold,
        image_urls: [],
        is_active: true,
        created_by: user?.id || null,
    };

    const { data, error } = await supabase.from('products').insert(insertData).select().single();

    if (error) throw error;

    revalidatePath('/dashboard/inventory');
    return data as unknown as Product;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const supabase = await createClient();

    const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/dashboard/inventory');
    revalidatePath(`/dashboard/inventory/${id}`);
    return data as unknown as Product;
}

export async function deleteProduct(id: string): Promise<void> {
    const supabase = await createClient();

    // Soft delete by setting is_active to false
    const { error } = await supabase
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/inventory');
}

// ============================================
// INVENTORY MOVEMENT ACTIONS
// ============================================

export async function getInventoryMovements(
    productId: string,
    limit = 20
): Promise<InventoryMovement[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data || []) as unknown as InventoryMovement[];
}

interface CreateMovementInput {
    product_id: string;
    type: MovementType;
    quantity: number;
    reason?: string;
    notes?: string;
    reference_type?: string;
    reference_id?: string;
}

export async function createStockMovement(input: CreateMovementInput): Promise<InventoryMovement> {
    // Check if we're in demo mode (placeholder Supabase config)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const isDemoMode = supabaseUrl.includes('placeholder') || supabaseUrl === '';

    if (isDemoMode) {
        // Return a mock movement for demo mode
        const mockMovement: InventoryMovement = {
            id: `demo-${Date.now()}`,
            product_id: input.product_id,
            material_id: null,
            type: input.type,
            quantity: input.quantity,
            stock_before: 10,
            stock_after: 10 + input.quantity,
            unit_cost: 150000,
            total_cost: Math.abs(input.quantity) * 150000,
            reason: input.reason || null,
            notes: input.notes || null,
            reference_type: input.reference_type || null,
            reference_id: input.reference_id || null,
            created_by: 'demo-user',
            created_at: new Date().toISOString(),
        };

        // Note: In demo mode, stock doesn't actually persist
        revalidatePath('/dashboard/inventory');
        return mockMovement;
    }

    const supabase = await createClient();

    // Get current stock
    const { data: productData, error: productError } = await supabase
        .from('products')
        .select('current_stock, cost_price')
        .eq('id', input.product_id)
        .single();

    if (productError) {
        throw new Error(`Failed to get product: ${productError.message}`);
    }

    const product = productData as { current_stock: number; cost_price: number };
    const stock_before = product.current_stock;
    const stock_after = stock_before + input.quantity;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const insertData = {
        product_id: input.product_id,
        material_id: null,
        type: input.type,
        quantity: input.quantity,
        stock_before,
        stock_after,
        unit_cost: product.cost_price,
        total_cost: Math.abs(input.quantity) * product.cost_price,
        reason: input.reason || null,
        notes: input.notes || null,
        reference_type: input.reference_type || null,
        reference_id: input.reference_id || null,
        created_by: user?.id || null,
    };

    // Create movement record - trigger will update product stock
    const { data, error } = await supabase
        .from('inventory_movements')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        throw new Error(`Failed to create stock movement: ${error.message}`);
    }

    revalidatePath('/dashboard/inventory');
    revalidatePath(`/dashboard/inventory/${input.product_id}`);
    return data as unknown as InventoryMovement;
}

// ============================================
// LOW STOCK ALERTS
// ============================================

interface LowStockProduct {
    id: string;
    sku: string;
    name: string;
    current_stock: number;
    min_stock_threshold: number;
}

export async function getLowStockProducts(): Promise<LowStockProduct[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('products')
        .select('id, sku, name, current_stock, min_stock_threshold')
        .eq('is_active', true);

    if (error) throw error;

    const products = (data || []) as unknown as LowStockProduct[];
    // Filter in JS since we can't compare columns directly
    return products.filter((p) => p.current_stock < p.min_stock_threshold);
}

// ============================================
// DASHBOARD STATS
// ============================================

interface InventoryStats {
    totalProducts: number;
    totalUnits: number;
    totalAssetValue: number;
    lowStockCount: number;
}

export async function getInventoryStats(): Promise<InventoryStats> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('products')
        .select('id, current_stock, cost_price, sale_price, type, min_stock_threshold')
        .eq('is_active', true);

    if (error) throw error;

    const products = (data || []) as unknown as {
        id: string;
        current_stock: number;
        cost_price: number;
        sale_price: number;
        type: string;
        min_stock_threshold: number;
    }[];

    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + p.current_stock, 0);
    const totalAssetValue = products.reduce((sum, p) => sum + p.current_stock * p.cost_price, 0);
    const lowStockCount = products.filter((p) => p.current_stock < p.min_stock_threshold).length;

    return {
        totalProducts,
        totalUnits,
        totalAssetValue,
        lowStockCount,
    };
}
