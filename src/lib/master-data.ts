// ============================================
// MASTER DATA — Materials, Products & Collections
// In-memory database for production reference
// ============================================

// ============================================
// TYPES
// ============================================

export type MaterialCategory = 'raw' | 'wip' | 'finished';

export interface MasterMaterial {
    id: string;
    name: string;
    sku: string;
    category: MaterialCategory;
    unit: string;           // pcs, sheet, block, unit
    description?: string;
    transformYields?: string[]; // Array of SKUs this material can be transformed into
}

export interface BOMComponent {
    materialSku: string;    // SKU of the required material
    materialName: string;   // Display name
    qty: number;            // How many needed (usually 1)
}

export interface MasterProduct {
    id: string;
    name: string;
    sku: string;
    collection: string;
    bom: BOMComponent[];    // Bill of Materials — what's needed for assembly
    description?: string;
}

export interface MasterCollection {
    id: string;
    name: string;
    color?: string;         // Optional badge color
}

// ============================================
// ID GENERATOR
// ============================================
let _masterCounter = Date.now();
function nextMasterId(prefix: string) {
    _masterCounter++;
    return `${prefix}-${_masterCounter.toString(36)}`;
}

// ============================================
// DEMO DATA — GENTANALA WATCHES
// ============================================

export const DEMO_MATERIALS: MasterMaterial[] = [
    { id: 'mat-001', name: 'Balok Kayu Jati', sku: 'RAW-JATI-001', category: 'raw', unit: 'block', description: 'Kayu jati grade A untuk casing', transformYields: ['WIP-CASE-HT'] },
    { id: 'mat-002', name: 'Balok Kayu Sono', sku: 'RAW-SONO-001', category: 'raw', unit: 'block', description: 'Kayu sonokeling untuk casing premium', transformYields: ['WIP-CASE-KL'] },
    { id: 'mat-003', name: 'Lembaran Kulit Sapi', sku: 'RAW-KULIT-001', category: 'raw', unit: 'sheet', description: 'Kulit sapi genuine leather untuk strap', transformYields: ['WIP-STRAP-BR', 'WIP-STRAP-BK'] },
    { id: 'mat-004', name: 'Mesin Miyota 2035', sku: 'RAW-MIYOTA-001', category: 'raw', unit: 'pcs', description: 'Movement Miyota Japan' },
    { id: 'mat-005', name: 'Mesin Seiko NH35', sku: 'RAW-SEIKO-001', category: 'raw', unit: 'pcs', description: 'Movement Seiko automatic' },
    { id: 'mat-006', name: 'Kaca Sapphire 42mm', sku: 'RAW-SAPH-42', category: 'raw', unit: 'pcs', description: 'Kaca sapphire crystal 42mm' },
    { id: 'mat-007', name: 'Kaca Sapphire 38mm', sku: 'RAW-SAPH-38', category: 'raw', unit: 'pcs', description: 'Kaca sapphire crystal 38mm' },
    { id: 'mat-008', name: 'Crown Stainless', sku: 'RAW-CROWN-SS', category: 'raw', unit: 'pcs', description: 'Crown stainless steel' },
    { id: 'mat-009', name: 'Buckle Stainless', sku: 'RAW-BUCKLE-SS', category: 'raw', unit: 'pcs', description: 'Buckle strap stainless' },
    // WIP components
    { id: 'mat-010', name: 'Casing Hutan Tropis', sku: 'WIP-CASE-HT', category: 'wip', unit: 'pcs', description: 'Casing kayu jati finish Hutan Tropis' },
    { id: 'mat-011', name: 'Casing Kaliandra', sku: 'WIP-CASE-KL', category: 'wip', unit: 'pcs', description: 'Casing kayu sono finish Kaliandra' },
    { id: 'mat-012', name: 'Strap Kulit Brown', sku: 'WIP-STRAP-BR', category: 'wip', unit: 'pcs', description: 'Strap kulit sapi warna brown' },
    { id: 'mat-013', name: 'Strap Kulit Black', sku: 'WIP-STRAP-BK', category: 'wip', unit: 'pcs', description: 'Strap kulit sapi warna black' },
];

export const DEMO_COLLECTIONS: MasterCollection[] = [
    { id: 'col-001', name: 'Hutan Tropis', color: 'emerald' },
    { id: 'col-002', name: 'Kaliandra', color: 'amber' },
    { id: 'col-003', name: 'Nusantara', color: 'indigo' },
    { id: 'col-004', name: 'Archipelago', color: 'sky' },
];

export const DEMO_PRODUCTS: MasterProduct[] = [
    {
        id: 'prod-001',
        name: 'Hutan Tropis 42mm',
        sku: 'FG-HT42-BLK',
        collection: 'Hutan Tropis',
        description: 'Jam tangan kayu jati 42mm collection Hutan Tropis',
        bom: [
            { materialSku: 'WIP-CASE-HT', materialName: 'Casing Hutan Tropis', qty: 1 },
            { materialSku: 'WIP-STRAP-BR', materialName: 'Strap Kulit Brown', qty: 1 },
            { materialSku: 'RAW-MIYOTA-001', materialName: 'Mesin Miyota 2035', qty: 1 },
            { materialSku: 'RAW-SAPH-42', materialName: 'Kaca Sapphire 42mm', qty: 1 },
            { materialSku: 'RAW-CROWN-SS', materialName: 'Crown Stainless', qty: 1 },
            { materialSku: 'RAW-BUCKLE-SS', materialName: 'Buckle Stainless', qty: 1 },
        ],
    },
    {
        id: 'prod-002',
        name: 'Kaliandra 38mm',
        sku: 'FG-KL38-NAT',
        collection: 'Kaliandra',
        description: 'Jam tangan kayu sono 38mm collection Kaliandra',
        bom: [
            { materialSku: 'WIP-CASE-KL', materialName: 'Casing Kaliandra', qty: 1 },
            { materialSku: 'WIP-STRAP-BK', materialName: 'Strap Kulit Black', qty: 1 },
            { materialSku: 'RAW-SEIKO-001', materialName: 'Mesin Seiko NH35', qty: 1 },
            { materialSku: 'RAW-SAPH-38', materialName: 'Kaca Sapphire 38mm', qty: 1 },
            { materialSku: 'RAW-CROWN-SS', materialName: 'Crown Stainless', qty: 1 },
            { materialSku: 'RAW-BUCKLE-SS', materialName: 'Buckle Stainless', qty: 1 },
        ],
    },
    {
        id: 'prod-003',
        name: 'Hutan Tropis 42mm Auto',
        sku: 'FG-HT42-AUTO',
        collection: 'Hutan Tropis',
        description: 'Jam tangan kayu jati 42mm automatic',
        bom: [
            { materialSku: 'WIP-CASE-HT', materialName: 'Casing Hutan Tropis', qty: 1 },
            { materialSku: 'WIP-STRAP-BR', materialName: 'Strap Kulit Brown', qty: 1 },
            { materialSku: 'RAW-SEIKO-001', materialName: 'Mesin Seiko NH35', qty: 1 },
            { materialSku: 'RAW-SAPH-42', materialName: 'Kaca Sapphire 42mm', qty: 1 },
            { materialSku: 'RAW-CROWN-SS', materialName: 'Crown Stainless', qty: 1 },
            { materialSku: 'RAW-BUCKLE-SS', materialName: 'Buckle Stainless', qty: 1 },
        ],
    },
];

// ============================================
// CRUD HELPERS (in-memory)
// ============================================

// --- Materials ---
export function addMaterial(
    list: MasterMaterial[],
    data: Omit<MasterMaterial, 'id'>
): MasterMaterial[] {
    return [...list, { ...data, id: nextMasterId('mat') }];
}

export function updateMaterial(
    list: MasterMaterial[],
    id: string,
    data: Partial<Omit<MasterMaterial, 'id'>>
): MasterMaterial[] {
    return list.map(m => m.id === id ? { ...m, ...data } : m);
}

export function deleteMaterial(list: MasterMaterial[], id: string): MasterMaterial[] {
    return list.filter(m => m.id !== id);
}

// --- Products ---
export function addProduct(
    list: MasterProduct[],
    data: Omit<MasterProduct, 'id'>
): MasterProduct[] {
    return [...list, { ...data, id: nextMasterId('prod') }];
}

export function updateProduct(
    list: MasterProduct[],
    id: string,
    data: Partial<Omit<MasterProduct, 'id'>>
): MasterProduct[] {
    return list.map(p => p.id === id ? { ...p, ...data } : p);
}

export function deleteProduct(list: MasterProduct[], id: string): MasterProduct[] {
    return list.filter(p => p.id !== id);
}

// --- Collections ---
export function addCollection(
    list: MasterCollection[],
    data: Omit<MasterCollection, 'id'>
): MasterCollection[] {
    return [...list, { ...data, id: nextMasterId('col') }];
}

export function updateCollection(
    list: MasterCollection[],
    id: string,
    data: Partial<Omit<MasterCollection, 'id'>>
): MasterCollection[] {
    return list.map(c => c.id === id ? { ...c, ...data } : c);
}

export function deleteCollection(list: MasterCollection[], id: string): MasterCollection[] {
    return list.filter(c => c.id !== id);
}

// ============================================
// SEARCH / AUTOCOMPLETE HELPERS
// ============================================

export function searchMaterials(list: MasterMaterial[], query: string): MasterMaterial[] {
    const q = query.toLowerCase().trim();
    if (!q) return list.slice(0, 10);
    return list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.category.includes(q)
    ).slice(0, 10);
}

export function searchProducts(list: MasterProduct[], query: string): MasterProduct[] {
    const q = query.toLowerCase().trim();
    if (!q) return list.slice(0, 10);
    return list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.collection.toLowerCase().includes(q)
    ).slice(0, 10);
}

export function searchCollections(list: MasterCollection[], query: string): MasterCollection[] {
    const q = query.toLowerCase().trim();
    if (!q) return list;
    return list.filter(c => c.name.toLowerCase().includes(q));
}

/** Combined search across materials and products for autocomplete */
export function searchAll(
    materials: MasterMaterial[],
    products: MasterProduct[],
    query: string
): Array<{ type: 'material' | 'product'; name: string; sku: string; collection?: string; category?: MaterialCategory }> {
    const q = query.toLowerCase().trim();
    const results: Array<{ type: 'material' | 'product'; name: string; sku: string; collection?: string; category?: MaterialCategory }> = [];

    const matchedMats = q
        ? materials.filter(m => m.name.toLowerCase().includes(q) || m.sku.toLowerCase().includes(q))
        : materials;
    matchedMats.slice(0, 6).forEach(m => {
        results.push({ type: 'material', name: m.name, sku: m.sku, category: m.category });
    });

    const matchedProds = q
        ? products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
        : products;
    matchedProds.slice(0, 4).forEach(p => {
        results.push({ type: 'product', name: p.name, sku: p.sku, collection: p.collection });
    });

    return results.slice(0, 10);
}

/**
 * Filtered search: only returns items matching the allowed material categories.
 * - 'raw' and 'wip' categories filter master materials
 * - 'finished' category returns master products (finished goods)
 */
export function searchByCategories(
    materials: MasterMaterial[],
    products: MasterProduct[],
    query: string,
    allowedCategories: MaterialCategory[]
): Array<{ type: 'material' | 'product'; name: string; sku: string; collection?: string; category?: MaterialCategory }> {
    const q = query.toLowerCase().trim();
    const results: Array<{ type: 'material' | 'product'; name: string; sku: string; collection?: string; category?: MaterialCategory }> = [];

    // Filter materials by allowed categories (raw, wip)
    const matCategories = allowedCategories.filter((c): c is 'raw' | 'wip' => c === 'raw' || c === 'wip');
    if (matCategories.length > 0) {
        const filteredMats = materials.filter(m => (matCategories as MaterialCategory[]).includes(m.category));
        const matchedMats = q
            ? filteredMats.filter(m => m.name.toLowerCase().includes(q) || m.sku.toLowerCase().includes(q))
            : filteredMats;
        matchedMats.slice(0, 8).forEach(m => {
            results.push({ type: 'material', name: m.name, sku: m.sku, category: m.category });
        });
    }

    // If 'finished' is allowed, show products
    if (allowedCategories.includes('finished')) {
        const matchedProds = q
            ? products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
            : products;
        matchedProds.slice(0, 6).forEach(p => {
            results.push({ type: 'product', name: p.name, sku: p.sku, collection: p.collection, category: 'finished' });
        });
    }

    return results.slice(0, 10);
}

