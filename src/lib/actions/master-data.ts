'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { 
    MasterMaterial, 
    MasterProduct, 
    MaterialCategory,
    MasterCollection
} from '@/lib/master-data';

// ============================================
// MATERIALS
// ============================================

export async function getMaterials(): Promise<MasterMaterial[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true) // Only active materials
        .order('name');
        
    if (error) throw error;
    
    // Map Database rows to MasterMaterial
    return (data || []).map(d => ({
        id: d.id,
        sku: d.code, // DB uses 'code'
        name: d.name,
        category: (d.type || d.category || 'raw') as MaterialCategory, // Handle both type and legacy category
        unit: d.unit,
        description: d.description || '',
        transformYields: [] // we can extend this later
    }));
}

export async function createMaterial(data: Omit<MasterMaterial, 'id'>): Promise<MasterMaterial> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        console.log('[createMaterial] Auth:', { user: user?.id, error: authError?.message });
        
        const insertData: any = {
            code: data.sku,
            name: data.name,
            unit: data.unit,
            description: data.description || null,
            created_by: user?.id || null,
            min_stock_threshold: 5,
            is_active: true,
            cost_per_unit: 0,
            current_stock: 0
        };
        
        if (data.category) insertData.type = data.category;
        
        console.log('[createMaterial] Inserting:', insertData);
        
        const { data: dbData, error } = await supabase
            .from('materials')
            .insert(insertData)
            .select()
            .single();
            
        if (error) {
            console.error('[createMaterial] Database Error:', error);
            throw new Error(`DB Error: ${error.message}`);
        }
        
        console.log('[createMaterial] Success:', dbData.id);
        
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/production');
        
        return {
            id: dbData.id,
            sku: dbData.code,
            name: dbData.name,
            category: (dbData.type || 'raw') as MaterialCategory,
            unit: dbData.unit,
            description: dbData.description || '',
        };
    } catch (e: any) {
        console.error('[createMaterial] Catch-all Error:', e);
        throw new Error(e.message || 'Gagal membuat material (Server Error 500)');
    }
}

export async function updateMaterial(id: string, data: Partial<MasterMaterial>): Promise<void> {
    try {
        const supabase = await createClient();
        console.log('[updateMaterial] Processing ID:', id);
        
        const updateData: any = {
            updated_at: new Date().toISOString()
        };
        
        if (data.sku !== undefined) updateData.code = data.sku;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.category !== undefined) updateData.type = data.category;
        if (data.unit !== undefined) updateData.unit = data.unit;
        if (data.description !== undefined) updateData.description = data.description || null;
        
        const { error } = await supabase
            .from('materials')
            .update(updateData)
            .eq('id', id);
            
        if (error) {
            if (error.message.includes('type') && error.message.includes('not exist')) {
                console.warn('[updateMaterial] Retrying without "type" column...');
                const { type, ...safeUpdateData } = updateData;
                const { error: retryError } = await supabase
                    .from('materials')
                    .update(safeUpdateData)
                    .eq('id', id);
                if (retryError) throw new Error(retryError.message);
            } else {
                throw error;
            }
        }
        
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/inventory');
    } catch (e: any) {
        console.error('[updateMaterial] Catch-all Error:', e);
        throw new Error(e.message || 'Gagal update material (Server Error 500)');
    }
}

export async function deleteMaterialAction(id: string): Promise<void> {
    try {
        const supabase = await createClient();
        console.log('[deleteMaterialAction] ID:', id);
        
        const { error } = await supabase
            .from('materials')
            .update({ is_active: false })
            .eq('id', id);
            
        if (error) throw error;
        
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/inventory');
    } catch (e: any) {
        console.error('[deleteMaterialAction] Error:', e);
        throw new Error(e.message || 'Gagal hapus material');
    }
}

export async function getProfilesDiagnostic(): Promise<any[]> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data || [];
    } catch (e: any) {
        return [{ error: e.message }];
    }
}

// ============================================
// PRODUCT MATERIALS (BOM)
// ============================================

export async function getProductsWithBOM(): Promise<MasterProduct[]> {
    const supabase = await createClient();
    
    // Get products
    const { data: products, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
        
    if (pErr) throw pErr;
    
    // Get all bill of materials - wrap in try-catch to be resilient
    let boms: any[] = [];
    try {
        const { data, error } = await supabase
            .from('product_materials')
            .select('*, material:materials(id, name, type, unit)');
        if (!error && data) boms = data;
    } catch (e) {
        console.error("BOM fetch failed, returning products without BOM:", e);
    }
    
    // Merge them
    return (products || []).map(p => {
        const productBoms = boms.filter(b => b.product_id === p.id);
        
        return {
            id: p.id,
            sku: p.sku,
            name: p.name,
            collection: p.collection || '',
            description: p.description || '',
            bom: productBoms.map(b => ({
                materialSku: b.material?.code || '',
                materialName: b.material?.name || 'Unknown',
                qty: b.quantity_required
            }))
        };
    });
}

export async function updateProductBOM(productId: string, bom: {materialId: string, qty: number}[]): Promise<void> {
    const supabase = await createClient();
    
    // 1. Delete existing BOM for this product
    const { error: delErr } = await supabase
        .from('product_materials')
        .delete()
        .eq('product_id', productId);
        
    if (delErr) throw delErr;
    
    // 2. Insert new BOM if any
    if (bom.length > 0) {
        const inserts = bom.map(b => ({
            product_id: productId,
            material_id: b.materialId,
            quantity_required: b.qty // DB uses 'quantity_required'
        }));
        
        const { error: insErr } = await supabase
            .from('product_materials')
            .insert(inserts);
            
        if (insErr) throw insErr;
    }
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/production');
}

// ============================================
// COLLECTIONS
// ============================================

export async function getCollections(): Promise<MasterCollection[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('master_collections')
        .select('*')
        .order('name');
        
    if (error) {
        console.error("Error fetching collections:", error);
        return [];
    }
    
    return (data || []).map(d => ({
        id: d.id,
        name: d.name,
        color: d.color || 'gray'
    }));
}

export async function createCollectionAction(data: Omit<MasterCollection, 'id'>): Promise<MasterCollection> {
    const supabase = await createClient();
    
    // Get user for created_by
    const { data: { user } } = await supabase.auth.getUser();
    
    const insertData = {
        name: data.name,
        color: data.color || 'gray',
        created_by: user?.id || null
    };
    
    const { data: dbData, error } = await supabase
        .from('master_collections')
        .insert(insertData)
        .select()
        .single();
        
    if (error) {
        console.error("Error creating collection:", error);
        throw error;
    }
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/inventory');
    
    return {
        id: dbData.id,
        name: dbData.name,
        color: dbData.color
    };
}

export async function deleteCollectionAction(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('master_collections').delete().eq('id', id);
    if (error) throw error;
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/production');
    revalidatePath('/dashboard');
}

