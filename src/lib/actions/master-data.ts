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
        .order('name');
        
    if (error) throw error;
    
    // Map Database rows to MasterMaterial
    return (data || []).map(d => ({
        id: d.id,
        sku: d.code, // DB uses 'code'
        name: d.name,
        category: d.type as MaterialCategory, // 'raw', 'wip', 'finished'
        unit: d.unit,
        description: d.description || '',
        transformYields: [] // we can extend this later
    }));
}

export async function createMaterial(data: Omit<MasterMaterial, 'id'>): Promise<MasterMaterial> {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const insertData = {
        code: data.sku, // DB uses 'code'
        name: data.name,
        type: data.category,
        unit: data.unit,
        description: data.description || null,
        created_by: user?.id || null,
        min_stock_threshold: 5 // Default
    };
    
    const { data: dbData, error } = await supabase
        .from('materials')
        .insert(insertData)
        .select()
        .single();
        
    if (error) throw error;
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/production');
    
    return {
        id: dbData.id,
        sku: dbData.code, // DB uses 'code'
        name: dbData.name,
        category: dbData.type as MaterialCategory,
        unit: dbData.unit,
        description: dbData.description || '',
    };
}

export async function updateMaterial(id: string, data: Partial<MasterMaterial>): Promise<void> {
    const supabase = await createClient();
    
    const updateData: any = {
        updated_at: new Date().toISOString()
    };
    
    if (data.sku) updateData.code = data.sku; // DB uses 'code'
    if (data.name) updateData.name = data.name;
    if (data.category) updateData.type = data.category;
    if (data.unit) updateData.unit = data.unit;
    if (data.description !== undefined) updateData.description = data.description || null;
    
    const { error } = await supabase
        .from('materials')
        .update(updateData)
        .eq('id', id);
        
    if (error) throw error;
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/production');
}

export async function deleteMaterialAction(id: string): Promise<void> {
    const supabase = await createClient();
    // Assuming simple delete for now, might need soft delete if linked to inventory
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/production');
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

