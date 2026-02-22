'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
    ProductionRun,
    ProductionStatus,
    PriorityLevel,
    Product,
} from '@/lib/database.types';

// ============================================
// PRODUCTION RUN (SPK) ACTIONS
// ============================================

export async function getProductionRuns(options?: {
    status?: ProductionStatus;
    assignedTo?: string;
}): Promise<ProductionRun[]> {
    const supabase = await createClient();

    let query = supabase
        .from('production_runs')
        .select('*')
        .order('created_at', { ascending: false });

    if (options?.status) {
        query = query.eq('status', options.status);
    }

    if (options?.assignedTo) {
        query = query.eq('assigned_to', options.assignedTo);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as unknown as ProductionRun[];
}

export async function getProductionRun(id: string): Promise<ProductionRun> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('production_runs')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as unknown as ProductionRun;
}

interface CreateSPKInput {
    product_id: string;
    quantity_planned: number;
    priority: PriorityLevel;
    planned_start_date?: string;
    planned_end_date?: string;
    assigned_to?: string;
    production_notes?: string;
    order_id?: string;
}

export async function createProductionRun(input: CreateSPKInput): Promise<ProductionRun> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Generate SPK number
    const year = new Date().getFullYear();
    const { data: lastSPK } = await supabase
        .from('production_runs')
        .select('spk_number')
        .like('spk_number', `SPK-${year}-%`)
        .order('spk_number', { ascending: false })
        .limit(1)
        .single();

    let nextSeq = 1;
    if (lastSPK?.spk_number) {
        const parts = lastSPK.spk_number.split('-');
        nextSeq = parseInt(parts[2]) + 1;
    }

    const spk_number = `SPK-${year}-${String(nextSeq).padStart(4, '0')}`;

    const insertData = {
        spk_number,
        product_id: input.product_id,
        quantity_planned: input.quantity_planned,
        quantity_completed: 0,
        quantity_rejected: 0,
        status: 'planned' as ProductionStatus,
        priority: input.priority,
        order_id: input.order_id || null,
        assigned_to: input.assigned_to || null,
        planned_start_date: input.planned_start_date || null,
        planned_end_date: input.planned_end_date || null,
        production_notes: input.production_notes || null,
        qc_notes: null,
        created_by: user?.id || null,
    };

    const { data, error } = await supabase
        .from('production_runs')
        .insert(insertData)
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/dashboard/production');
    return data as unknown as ProductionRun;
}

export async function updateProductionStatus(
    id: string,
    status: ProductionStatus,
    extras?: {
        quantity_completed?: number;
        quantity_rejected?: number;
        qc_notes?: string;
    }
): Promise<ProductionRun> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
    };

    // Set actual dates based on status
    if (status === 'in_progress') {
        updateData.actual_start_date = new Date().toISOString();
    }

    if (status === 'done' || status === 'stocked') {
        updateData.actual_end_date = new Date().toISOString();
    }

    if (extras?.quantity_completed !== undefined) {
        updateData.quantity_completed = extras.quantity_completed;
    }

    if (extras?.quantity_rejected !== undefined) {
        updateData.quantity_rejected = extras.quantity_rejected;
    }

    if (extras?.qc_notes) {
        updateData.qc_notes = extras.qc_notes;
    }

    const { data, error } = await supabase
        .from('production_runs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/dashboard/production');
    revalidatePath(`/dashboard/production/${id}`);
    return data as unknown as ProductionRun;
}

export async function completeProduction(
    id: string,
    quantityCompleted: number,
    quantityRejected: number,
    qcNotes?: string
): Promise<ProductionRun> {
    const supabase = await createClient();

    // First update the production run
    const run = await updateProductionStatus(id, 'done', {
        quantity_completed: quantityCompleted,
        quantity_rejected: quantityRejected,
        qc_notes: qcNotes,
    });

    return run;
}

export async function stockProductionResult(id: string): Promise<void> {
    const supabase = await createClient();

    // Get production run details
    const { data: run, error: runError } = await supabase
        .from('production_runs')
        .select('*')
        .eq('id', id)
        .single();

    if (runError) throw runError;

    const productionRun = run as unknown as ProductionRun;

    if (productionRun.status !== 'done') {
        throw new Error('Production run must be completed before stocking');
    }

    // Get current product stock
    const { data: product, error: productError } = await supabase
        .from('products')
        .select('current_stock, cost_price')
        .eq('id', productionRun.product_id)
        .single();

    if (productError) throw productError;

    const productData = product as { current_stock: number; cost_price: number };

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Create inventory movement
    const movementData = {
        product_id: productionRun.product_id,
        material_id: null,
        type: 'prod_result',
        quantity: productionRun.quantity_completed,
        stock_before: productData.current_stock,
        stock_after: productData.current_stock + productionRun.quantity_completed,
        unit_cost: productData.cost_price,
        total_cost: productionRun.quantity_completed * productData.cost_price,
        reason: 'Production completed',
        notes: `SPK: ${productionRun.spk_number}`,
        reference_type: 'production',
        reference_id: id,
        created_by: user?.id || null,
    };

    const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert(movementData);

    if (movementError) throw movementError;

    // Update production run status to stocked
    await updateProductionStatus(id, 'stocked');

    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/production');
}

// ============================================
// DASHBOARD STATS
// ============================================

interface ProductionStats {
    planned: number;
    inProgress: number;
    inQC: number;
    completed: number;
}

export async function getProductionStats(): Promise<ProductionStats> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('production_runs')
        .select('status')
        .in('status', ['planned', 'in_progress', 'qc', 'done']);

    if (error) throw error;

    const runs = (data || []) as { status: string }[];

    return {
        planned: runs.filter((r) => r.status === 'planned').length,
        inProgress: runs.filter((r) => r.status === 'in_progress').length,
        inQC: runs.filter((r) => r.status === 'qc').length,
        completed: runs.filter((r) => r.status === 'done').length,
    };
}

// Helper to get products for SPK creation dropdown
export async function getProductsForSPK(): Promise<
    Pick<Product, 'id' | 'sku' | 'name' | 'current_stock' | 'min_stock_threshold'>[]
> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('products')
        .select('id, sku, name, current_stock, min_stock_threshold')
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return (data || []) as Pick<
        Product,
        'id' | 'sku' | 'name' | 'current_stock' | 'min_stock_threshold'
    >[];
}
