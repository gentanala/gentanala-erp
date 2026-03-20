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
// DB columns: id, code, name, description, unit, cost_per_unit, current_stock, 
//             min_stock_threshold, supplier_info, is_active, created_at, updated_at
// NOTE: There is NO 'type' or 'category' column in the DB!

export async function getMaterials(): Promise<MasterMaterial[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .order('name');
        
    if (error) throw new Error(error.message);
    
    return (data || []).map(d => {
        const extraInfo = d.supplier_info || {};
        return {
            id: d.id,
            sku: d.code,
            name: d.name,
            category: (extraInfo.category as MaterialCategory) || 'raw',
            unit: d.unit,
            emoji: extraInfo.emoji || '',
            imageUrl: extraInfo.imageUrl || '',
            description: d.description || '',
            transformYields: Array.isArray(extraInfo.transformYields) ? extraInfo.transformYields : []
        };
    });
}

export async function createMaterial(data: Omit<MasterMaterial, 'id'>): Promise<MasterMaterial> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        // Only use columns that actually exist in the DB
        const insertData: Record<string, any> = {
            code: data.sku,
            name: data.name,
            unit: data.unit,
            description: data.description || null,
            min_stock_threshold: 5,
            is_active: true,
            cost_per_unit: 0,
            current_stock: 0,
            supplier_info: {
                category: data.category,
                emoji: data.emoji || '',
                imageUrl: data.imageUrl || '',
                transformYields: data.transformYields || []
            }
        };
        
        console.log('[createMaterial] Inserting:', JSON.stringify(insertData));
        
        const { data: dbData, error } = await supabase
            .from('materials')
            .insert(insertData)
            .select()
            .single();
            
        if (error) {
            console.error('[createMaterial] DB Error:', error.message, error.code);
            throw new Error(error.message);
        }
        
        console.log('[createMaterial] Success:', dbData.id);
        
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/inventory');
        revalidatePath('/dashboard/production');
        
        return {
            id: dbData.id,
            sku: dbData.code,
            name: dbData.name,
            category: data.category || 'raw',
            unit: dbData.unit,
            description: dbData.description || '',
            transformYields: data.transformYields || []
        };
    } catch (e: any) {
        console.error('[createMaterial] Error:', e.message);
        throw new Error(e.message || 'Gagal membuat material');
    }
}

export async function updateMaterial(id: string, data: Partial<MasterMaterial>): Promise<void> {
    try {
        const supabase = await createClient();
        
        // Fetch existing material first to merge supplier_info
        const { data: existingData, error: fetchErr } = await supabase
            .from('materials')
            .select('supplier_info')
            .eq('id', id)
            .single();
            
        if (fetchErr) throw new Error(fetchErr.message);
        
        const existingInfo = existingData.supplier_info || {};
        
        const newInfo = {
            ...existingInfo,
        };
        if (data.category !== undefined) newInfo.category = data.category;
        if (data.emoji !== undefined) newInfo.emoji = data.emoji;
        if (data.imageUrl !== undefined) newInfo.imageUrl = data.imageUrl;
        if (data.transformYields !== undefined) newInfo.transformYields = data.transformYields;

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
            supplier_info: newInfo
        };
        
        if (data.sku !== undefined) updateData.code = data.sku;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.unit !== undefined) updateData.unit = data.unit;
        if (data.description !== undefined) updateData.description = data.description || null;
        
        console.log('[updateMaterial] ID:', id, 'Data:', JSON.stringify(updateData));
        
        const { error } = await supabase.from('materials').update(updateData).eq('id', id);
            
        if (error) {
            console.error('[updateMaterial] DB Error:', error.message, error.code);
            throw new Error(error.message);
        }
        
        console.log('[updateMaterial] Success');
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/inventory');
    } catch (e: any) {
        console.error('[updateMaterial] Error:', e.message);
        throw new Error(e.message || 'Gagal update material');
    }
}

export async function deleteMaterialAction(id: string): Promise<void> {
    try {
        const supabase = await createClient();
        const { error } = await supabase.from('materials').update({ is_active: false }).eq('id', id);
        if (error) throw new Error(error.message);
        
        console.log('[deleteMaterial] Success:', id);
        revalidatePath('/dashboard/settings');
        revalidatePath('/dashboard/inventory');
    } catch (e: any) {
        throw new Error(e.message || 'Gagal hapus material');
    }
}

// ============================================
// PRODUCT MATERIALS (BOM)
// ============================================

export async function getProductsWithBOM(): Promise<MasterProduct[]> {
    const supabase = await createClient();
    const { data: products, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
        
    if (pErr) throw new Error(pErr.message);
    
    let boms: any[] = [];
    try {
        const { data, error } = await supabase
            .from('product_materials')
            .select('*, material:materials(id, name, code, unit)');
        if (!error && data) boms = data;
    } catch (e) {
        console.error("BOM fetch failed:", e);
    }
    
    return (products || []).map(p => {
        const productBoms = boms.filter(b => b.product_id === p.id);
        return {
            id: p.id,
            sku: p.sku,
            name: p.name,
            emoji: p.variant || '',
            imageUrl: (p.image_urls && p.image_urls[0]) || '',
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
    const { error: delErr } = await supabase.from('product_materials').delete().eq('product_id', productId);
    if (delErr) throw new Error(delErr.message);
    
    if (bom.length > 0) {
        const inserts = bom.map(b => ({
            product_id: productId,
            material_id: b.materialId,
            quantity_required: b.qty
        }));
        const { error: insErr } = await supabase.from('product_materials').insert(inserts);
        if (insErr) throw new Error(insErr.message);
    }
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/inventory');
}

// ============================================
// COLLECTIONS
// ============================================

export async function getCollections(): Promise<MasterCollection[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('master_collections').select('*').order('name');
    if (error) return [];
    
    return (data || []).map(d => ({
        id: d.id,
        name: d.name,
        color: d.color || 'gray'
    }));
}

export async function createCollectionAction(data: Omit<MasterCollection, 'id'>): Promise<MasterCollection> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const insertData = { name: data.name, color: data.color || 'gray', created_by: user?.id || null };
    
    const { data: dbData, error } = await supabase.from('master_collections').insert(insertData).select().single();
    if (error) throw new Error(error.message);
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/inventory');
    
    return { id: dbData.id, name: dbData.name, color: dbData.color };
}

export async function deleteCollectionAction(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from('master_collections').delete().eq('id', id);
    if (error) throw new Error(error.message);
    
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/inventory');
}
