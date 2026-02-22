// ============================================
// PRODUCTION ENGINE — In-Memory MES State Manager
// ============================================

import type {
    WorkflowBlueprint,
    WorkflowStage,
    KanbanItem,
    ActivityLog,
    SalesChannel,
    StageLogicType,
} from './database.types';
import type { MasterProduct } from './master-data';

// ============================================
// DEFAULT BLUEPRINT: JAM TANGAN (WATCH)
// ============================================

export const WATCH_BLUEPRINT: WorkflowBlueprint = {
    id: 'bp-watch-001',
    name: 'Jam Tangan',
    productType: 'watch',
    description: 'Alur produksi jam tangan kayu Gentanala',
    stages: [
        {
            id: 'stg-raw',
            name: 'Raw Material',
            order: 1,
            logicType: 'passthrough',
            allowedMaterialCategories: ['raw'],
            emoji: '🪵',
            color: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
        },
        {
            id: 'stg-cnc',
            name: 'CNC / Processing',
            order: 2,
            logicType: 'split',
            defaultYield: 4,
            allowedMaterialCategories: ['raw', 'wip'],
            emoji: '⚙️',
            color: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', dot: 'bg-sky-500' },
        },
        {
            id: 'stg-finishing',
            name: 'Finishing & Polish',
            order: 3,
            logicType: 'passthrough',
            allowedMaterialCategories: ['wip'],
            emoji: '✨',
            color: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500' },
        },
        {
            id: 'stg-assembly',
            name: 'Assembly',
            order: 4,
            logicType: 'merge',
            mergeInputCount: 2,
            allowedMaterialCategories: ['wip', 'raw'],
            emoji: '🔧',
            color: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500' },
        },
        {
            id: 'stg-packing',
            name: 'Packing Ready',
            order: 5,
            logicType: 'passthrough',
            allowedMaterialCategories: ['finished'],
            emoji: '📦',
            color: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
        },
        {
            id: 'stg-sold',
            name: 'SOLD',
            order: 6,
            logicType: 'exit',
            exitChannels: ['shopee', 'tokopedia', 'whatsapp', 'offline', 'b2b', 'kol_gift'],
            emoji: '💰',
            color: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
        },
    ],
    created_at: new Date().toISOString(),
};

// ============================================
// DEMO ITEMS
// ============================================

export const DEMO_ITEMS: KanbanItem[] = [
    // Pre-loaded components in Assembly for testing
    { id: 'test-comp-1', name: 'Casing Hutan Tropis', sku: 'WIP-CASE-HT', stageId: 'stg-assembly', quantity: 15, price: 0, collection: 'Hutan Tropis', thumbnailUrl: null, parentId: null, childIds: [], mergedFrom: [], status: 'active', salesChannel: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'test-comp-2', name: 'Strap Kulit Brown', sku: 'WIP-STRAP-BR', stageId: 'stg-assembly', quantity: 10, price: 0, collection: 'Hutan Tropis', thumbnailUrl: null, parentId: null, childIds: [], mergedFrom: [], status: 'active', salesChannel: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'test-comp-3', name: 'Mesin Miyota 2035', sku: 'RAW-MIYOTA-001', stageId: 'stg-assembly', quantity: 20, price: 0, collection: null, thumbnailUrl: null, parentId: null, childIds: [], mergedFrom: [], status: 'active', salesChannel: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'test-comp-4', name: 'Kaca Sapphire 42mm', sku: 'RAW-SAPH-42', stageId: 'stg-assembly', quantity: 12, price: 0, collection: null, thumbnailUrl: null, parentId: null, childIds: [], mergedFrom: [], status: 'active', salesChannel: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'test-comp-5', name: 'Crown Stainless', sku: 'RAW-CROWN-SS', stageId: 'stg-assembly', quantity: 30, price: 0, collection: null, thumbnailUrl: null, parentId: null, childIds: [], mergedFrom: [], status: 'active', salesChannel: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'test-comp-6', name: 'Buckle Stainless', sku: 'RAW-BUCKLE-SS', stageId: 'stg-assembly', quantity: 30, price: 0, collection: null, thumbnailUrl: null, parentId: null, childIds: [], mergedFrom: [], status: 'active', salesChannel: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    {
        id: 'item-001',
        name: 'Balok Kayu Jati',
        sku: 'RAW-JATI-001',
        stageId: 'stg-raw',
        quantity: 5,
        price: 0,
        collection: null,
        thumbnailUrl: null,
        parentId: null,
        childIds: [],
        mergedFrom: [],
        status: 'active',
        salesChannel: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'item-002',
        name: 'Lembaran Kulit Sapi',
        sku: 'RAW-KULIT-001',
        stageId: 'stg-raw',
        quantity: 10,
        price: 0,
        collection: null,
        thumbnailUrl: null,
        parentId: null,
        childIds: [],
        mergedFrom: [],
        status: 'active',
        salesChannel: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'item-003',
        name: 'Casing Hutan Tropis',
        sku: 'WIP-CASE-HT',
        stageId: 'stg-finishing',
        quantity: 4,
        price: 0,
        collection: 'Hutan Tropis',
        thumbnailUrl: null,
        parentId: null,
        childIds: [],
        mergedFrom: [],
        status: 'active',
        salesChannel: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'item-004',
        name: 'Strap Kulit Brown',
        sku: 'WIP-STRAP-BR',
        stageId: 'stg-finishing',
        quantity: 6,
        price: 0,
        collection: 'Hutan Tropis',
        thumbnailUrl: null,
        parentId: null,
        childIds: [],
        mergedFrom: [],
        status: 'active',
        salesChannel: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'item-005',
        name: 'Hutan Tropis 42mm',
        sku: 'FG-HT42-BLK',
        stageId: 'stg-packing',
        quantity: 3,
        price: 0,
        collection: 'Hutan Tropis',
        thumbnailUrl: null,
        parentId: null,
        childIds: [],
        mergedFrom: [],
        status: 'active',
        salesChannel: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'item-006',
        name: 'Kaliandra 38mm',
        sku: 'FG-KL38-NAT',
        stageId: 'stg-packing',
        quantity: 5,
        price: 0,
        collection: 'Kaliandra',
        thumbnailUrl: null,
        parentId: null,
        childIds: [],
        mergedFrom: [],
        status: 'active',
        salesChannel: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'item-007',
        name: 'Mesin Miyota 2035',
        sku: 'RAW-MIYOTA-001',
        stageId: 'stg-raw',
        quantity: 20,
        price: 0,
        collection: null,
        thumbnailUrl: null,
        parentId: null,
        childIds: [],
        mergedFrom: [],
        status: 'active',
        salesChannel: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'item-008',
        name: 'Kaca Sapphire 42mm',
        sku: 'RAW-SAPH-42',
        stageId: 'stg-raw',
        quantity: 15,
        price: 0,
        collection: null,
        thumbnailUrl: null,
        parentId: null,
        childIds: [],
        mergedFrom: [],
        status: 'active',
        salesChannel: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'item-009',
        name: 'Crown Stainless',
        sku: 'RAW-CROWN-SS',
        stageId: 'stg-raw',
        quantity: 30,
        price: 0,
        collection: null,
        thumbnailUrl: null,
        parentId: null,
        childIds: [],
        mergedFrom: [],
        status: 'active',
        salesChannel: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'item-010',
        name: 'Buckle Stainless',
        sku: 'RAW-BUCKLE-SS',
        stageId: 'stg-raw',
        quantity: 30,
        price: 0,
        collection: null,
        thumbnailUrl: null,
        parentId: null,
        childIds: [],
        mergedFrom: [],
        status: 'active',
        salesChannel: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// ============================================
// ENGINE FUNCTIONS
// ============================================

let _counter = 100;
function nextId(prefix: string) {
    _counter++;
    return `${prefix}-${Date.now()}-${_counter}`;
}

/** Passthrough: Move item to next stage, no transformation */
export function handlePassthrough(
    items: KanbanItem[],
    itemId: string,
    toStageId: string,
    movedQuantity: number,
    user: string,
    stages: WorkflowStage[],
): { items: KanbanItem[]; log: ActivityLog } {
    const item = items.find(i => i.id === itemId)!;
    const fromStage = stages.find(s => s.id === item.stageId);
    const toStage = stages.find(s => s.id === toStageId);

    let updatedList = [...items];

    const existingIdx = updatedList.findIndex(i =>
        i.stageId === toStageId &&
        i.sku === item.sku &&
        i.status === 'active' &&
        !i.metadata?.targetBomSku &&
        i.id !== itemId // Ensure not merging to itself if full move is mapped later
    );

    if (existingIdx >= 0) {
        // Target stage already has this SKU, we append the qty
        updatedList[existingIdx] = {
            ...updatedList[existingIdx],
            quantity: updatedList[existingIdx].quantity + movedQuantity,
            updated_at: new Date().toISOString()
        };

        if (movedQuantity < item.quantity) {
            // Reduce origin
            updatedList = updatedList.map(i =>
                i.id === itemId ? { ...i, quantity: i.quantity - movedQuantity, updated_at: new Date().toISOString() } : i
            );
        } else {
            // Moved all, origin is consumed/removed
            updatedList = updatedList.filter(i => i.id !== itemId);
        }
    } else {
        // No existing item in target, move normally
        if (movedQuantity < item.quantity) {
            // Decrease original item qty
            updatedList = updatedList.map(i =>
                i.id === itemId ? { ...i, quantity: i.quantity - movedQuantity, updated_at: new Date().toISOString() } : i
            );

            // Add a new item for the moved portion
            const newMovedItem: KanbanItem = {
                ...item,
                id: nextId('itm'),
                stageId: toStageId,
                quantity: movedQuantity,
                status: 'active',
                parentId: item.id,
                childIds: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            updatedList.push(newMovedItem);
        } else {
            // Full move directly to the same card
            updatedList = updatedList.map(i =>
                i.id === itemId ? { ...i, stageId: toStageId, updated_at: new Date().toISOString() } : i
            );
        }
    }

    const log: ActivityLog = {
        id: nextId('log'),
        timestamp: new Date().toISOString(),
        user,
        action: 'moved',
        item_name: item.name,
        from_stage: fromStage?.name || null,
        to_stage: toStage?.name || toStageId,
        logicType: 'passthrough',
        metadata: {
            yield: movedQuantity // Record qty moved
        }
    };

    return { items: updatedList, log };
}

/** Split: Consume parent → create N children */
export function handleSplit(
    items: KanbanItem[],
    itemId: string,
    toStageId: string,
    consumedCount: number,
    yieldCount: number,
    childName: string,
    childSku: string,
    user: string,
    stages: WorkflowStage[],
): { items: KanbanItem[]; logs: ActivityLog[] } {
    const parent = items.find(i => i.id === itemId)!;
    const fromStage = stages.find(s => s.id === parent.stageId);
    const toStage = stages.find(s => s.id === toStageId);

    const childIds: string[] = [];
    const children: KanbanItem[] = [];

    // Instead of creating N separate cards, create 1 card with quantity = yieldCount
    const childId = nextId('item');
    childIds.push(childId);
    children.push({
        id: childId,
        name: childName,
        sku: childSku,
        stageId: toStageId,
        quantity: yieldCount,
        price: 0,
        collection: parent.collection,
        thumbnailUrl: null,
        parentId: parent.id,
        childIds: [],
        mergedFrom: [],
        status: 'active',
        salesChannel: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    const remainingQty = Math.max(0, parent.quantity - consumedCount);

    // Parent item logic: if remainingQty is 0, mark as consumed. Otherwise, just reduce quantity.
    const updated = items.map(i => {
        if (i.id === itemId) {
            return {
                ...i,
                quantity: remainingQty,
                status: remainingQty === 0 ? 'consumed' as const : 'active' as const,
                childIds: remainingQty === 0 ? childIds : [...i.childIds, ...childIds],
                updated_at: new Date().toISOString()
            };
        }
        return i;
    });

    const log: ActivityLog = {
        id: nextId('log'),
        timestamp: new Date().toISOString(),
        user,
        action: 'split',
        item_name: parent.name,
        from_stage: fromStage?.name || null,
        to_stage: toStage?.name || toStageId,
        logicType: 'split',
        metadata: { consumed: consumedCount, yield: yieldCount, childCount: yieldCount },
    };

    return { items: [...updated, ...children], logs: [log] };
}

/** 
 * Assembly Allocation: Dedicate components to a WIP Assembly card.
 * Automatically completes units if BOM requirements are met.
 */
export function handleAssemblyAllocation(
    items: KanbanItem[],
    draggedItemId: string,
    toStageId: string,
    allocateQty: number,
    product: MasterProduct,
    user: string,
    stages: WorkflowStage[],
): { items: KanbanItem[]; logs: ActivityLog[] } {
    const toStage = stages.find(s => s.id === toStageId);
    let currentItems = [...items];
    const logBatch: ActivityLog[] = [];

    const draggedItemIndex = currentItems.findIndex(i => i.id === draggedItemId);
    const draggedItem = currentItems[draggedItemIndex];

    // 1. Deduct qty from draggedItem
    const remainingQty = draggedItem.quantity - allocateQty;
    currentItems[draggedItemIndex] = {
        ...draggedItem,
        quantity: Math.max(0, remainingQty),
        status: remainingQty <= 0 ? 'consumed' as const : 'active' as const,
        updated_at: new Date().toISOString()
    };

    // 2. Find or create WIP Assembly Card for this product in the target stage
    const wipSku = `WIP-${product.sku}`;
    let wipCardIndex = currentItems.findIndex(i =>
        i.stageId === toStageId &&
        i.metadata?.targetBomSku === product.sku &&
        i.status === 'active'
    );

    let wipCard: KanbanItem;

    if (wipCardIndex >= 0) {
        wipCard = currentItems[wipCardIndex];
    } else {
        wipCard = {
            id: nextId('item'),
            name: `[Perakitan] ${product.name}`,
            sku: wipSku,
            stageId: toStageId,
            quantity: 1, // Container card
            price: 0,
            collection: product.collection,
            thumbnailUrl: null,
            parentId: null,
            childIds: [],
            mergedFrom: [],
            status: 'active',
            salesChannel: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
                targetBomSku: product.sku,
                bomProgress: {}
            }
        };
        currentItems.push(wipCard);
        wipCardIndex = currentItems.length - 1;
    }

    // 3. Add progress
    const compSku = draggedItem.sku!;
    const currentProgress = wipCard.metadata?.bomProgress || {};
    const newProgress = {
        ...currentProgress,
        [compSku]: (currentProgress[compSku] || 0) + allocateQty
    };

    // Update the card progress
    wipCard = {
        ...wipCard,
        metadata: {
            ...wipCard.metadata,
            bomProgress: newProgress
        },
        updated_at: new Date().toISOString()
    };
    currentItems[wipCardIndex] = wipCard;

    logBatch.push({
        id: nextId('log'),
        timestamp: new Date().toISOString(),
        user,
        action: 'moved',
        item_name: `${draggedItem.name} (${allocateQty}x) → Perakitan ${product.name}`,
        from_stage: stages.find(s => s.id === draggedItem.stageId)?.name || null,
        to_stage: toStage?.name || toStageId,
        logicType: 'merge',
        metadata: { consumed: allocateQty }
    });

    // 4. CHECK BOM COMPLETION
    let possibleCompletions = Infinity;
    for (const req of product.bom) {
        const available = newProgress[req.materialSku] || 0;
        const possibleUnits = Math.floor(available / req.qty);
        if (possibleUnits < possibleCompletions) {
            possibleCompletions = possibleUnits;
        }
    }

    if (possibleCompletions > 0 && possibleCompletions !== Infinity) {
        // We can fulfill `possibleCompletions` units!

        // Deduct component quantities from bomProgress
        for (const req of product.bom) {
            newProgress[req.materialSku] -= (req.qty * possibleCompletions);
        }

        const hasRemainingParts = false; // We will refund them instead of keeping them

        wipCard = {
            ...wipCard,
            metadata: {
                ...wipCard.metadata,
                bomProgress: {} // clear it
            },
            status: 'consumed',
            updated_at: new Date().toISOString()
        };
        currentItems[wipCardIndex] = wipCard;

        // Refund excess items back to stage
        for (const [sku, qty] of Object.entries(newProgress)) {
            const numQty = qty as number;
            if (numQty > 0) {
                const materialName = product.bom.find(b => b.materialSku === sku)?.materialName || sku;
                // Check if there is an existing loose item
                const existingIdx = currentItems.findIndex(i => i.sku === sku && i.stageId === toStageId && i.status === 'active' && !i.metadata?.targetBomSku);
                if (existingIdx >= 0) {
                    currentItems[existingIdx] = {
                        ...currentItems[existingIdx],
                        quantity: currentItems[existingIdx].quantity + numQty,
                        updated_at: new Date().toISOString()
                    };
                } else {
                    currentItems.push({
                        id: nextId('item'),
                        name: materialName,
                        sku: sku,
                        stageId: toStageId,
                        quantity: numQty,
                        price: 0,
                        collection: null,
                        thumbnailUrl: null,
                        parentId: null,
                        childIds: [],
                        mergedFrom: [],
                        status: 'active',
                        salesChannel: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                }
            }
        }

        // Create or Top-Up Finished Good card
        const fgIndex = currentItems.findIndex(i =>
            i.stageId === toStageId &&
            i.sku === product.sku &&
            i.status === 'active' &&
            !i.metadata?.targetBomSku // Must NOT be a WIP card
        );

        if (fgIndex >= 0) {
            currentItems[fgIndex] = {
                ...currentItems[fgIndex],
                quantity: currentItems[fgIndex].quantity + possibleCompletions,
                updated_at: new Date().toISOString()
            };
        } else {
            const fgCard: KanbanItem = {
                id: nextId('item'),
                name: product.name,
                sku: product.sku,
                stageId: toStageId,
                quantity: possibleCompletions,
                price: 0,
                collection: product.collection,
                thumbnailUrl: null,
                parentId: null,
                childIds: [],
                mergedFrom: [wipCard.id],
                status: 'active',
                salesChannel: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            currentItems.push(fgCard);
        }

        logBatch.push({
            id: nextId('log'),
            timestamp: new Date().toISOString(),
            user,
            action: 'merged',
            item_name: product.name,
            from_stage: 'Meja Perakitan',
            to_stage: toStage?.name || toStageId,
            logicType: 'merge',
            metadata: { yield: possibleCompletions, mergedItems: product.bom.map(b => b.materialName) }
        });
    }

    return { items: currentItems, logs: logBatch };
}

/** Exit/Sales: Remove item from board, record sale */
export function handleExit(
    items: KanbanItem[],
    itemId: string,
    toStageId: string,
    channel: SalesChannel,
    salePrice: number,
    user: string,
    stages: WorkflowStage[],
): { items: KanbanItem[]; log: ActivityLog } {
    const item = items.find(i => i.id === itemId)!;
    const fromStage = stages.find(s => s.id === item.stageId);
    const toStage = stages.find(s => s.id === toStageId);

    const updated = items.map(i =>
        i.id === itemId
            ? { ...i, stageId: toStageId, status: 'sold' as const, salesChannel: channel, price: salePrice, updated_at: new Date().toISOString() }
            : i
    );

    const log: ActivityLog = {
        id: nextId('log'),
        timestamp: new Date().toISOString(),
        user,
        action: 'sold',
        item_name: item.name,
        from_stage: fromStage?.name || null,
        to_stage: toStage?.name || toStageId,
        logicType: 'exit',
        metadata: { salesChannel: channel, salePrice },
    };

    return { items: updated, log };
}

/** Add new item to a stage */
export function handleAddItem(
    items: KanbanItem[],
    name: string,
    sku: string,
    stageId: string,
    quantity: number,
    collection: string | null,
    emoji: string | undefined,
    user: string,
    stages: WorkflowStage[],
): { items: KanbanItem[]; log: ActivityLog } {
    const toStage = stages.find(s => s.id === stageId);

    // Check if same SKU already exists in this stage — merge quantity
    const existingIdx = items.findIndex(i => i.sku === sku && i.stageId === stageId && i.status === 'active');
    let updatedItems: KanbanItem[];

    if (existingIdx >= 0 && sku) {
        updatedItems = items.map((item, idx) =>
            idx === existingIdx
                ? { ...item, quantity: item.quantity + quantity, updated_at: new Date().toISOString() }
                : item
        );
    } else {
        const newItem: KanbanItem = {
            id: nextId('item'),
            name,
            sku,
            emoji,
            stageId,
            quantity,
            price: 0,
            collection,
            thumbnailUrl: null,
            parentId: null,
            childIds: [],
            mergedFrom: [],
            status: 'active',
            salesChannel: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        updatedItems = [...items, newItem];
    }

    const log: ActivityLog = {
        id: nextId('log'),
        timestamp: new Date().toISOString(),
        user,
        action: 'added',
        item_name: name,
        from_stage: null,
        to_stage: toStage?.name || stageId,
        logicType: 'passthrough',
    };

    return { items: updatedItems, log };
}

/** Edit an existing item */
export function handleEditItem(
    items: KanbanItem[],
    itemId: string,
    updates: { name?: string; sku?: string | null; quantity?: number; collection?: string | null; emoji?: string },
    user: string,
    stages: WorkflowStage[],
): { items: KanbanItem[]; log: ActivityLog } {
    const item = items.find(i => i.id === itemId)!;
    const stage = stages.find(s => s.id === item.stageId);

    const updated = items.map(i =>
        i.id === itemId
            ? { ...i, ...updates, updated_at: new Date().toISOString() }
            : i
    );

    const log: ActivityLog = {
        id: nextId('log'),
        timestamp: new Date().toISOString(),
        user,
        action: 'moved' as const,
        item_name: updates.name || item.name,
        from_stage: stage?.name || null,
        to_stage: stage?.name || item.stageId,
        logicType: 'passthrough',
        metadata: { yield: undefined, childCount: undefined },
    };

    return { items: updated, log };
}

/** Delete an item completely */
export function handleDeleteItem(
    items: KanbanItem[],
    itemId: string,
    user: string,
    stages: WorkflowStage[],
): { items: KanbanItem[]; log: ActivityLog } {
    const item = items.find(i => i.id === itemId)!;
    const stage = stages.find(s => s.id === item.stageId);

    const updated = items.filter(i => i.id !== itemId);

    const log: ActivityLog = {
        id: nextId('log'),
        timestamp: new Date().toISOString(),
        user,
        action: 'moved' as const,
        item_name: `[DELETED] ${item.name}`,
        from_stage: stage?.name || null,
        to_stage: 'Deleted',
        logicType: 'passthrough',
    };

    return { items: updated, log };
}

/** Reject / Waste an item */
export function handleRejectItem(
    items: KanbanItem[],
    itemId: string,
    rejectQty: number,
    user: string,
    stages: WorkflowStage[],
): { items: KanbanItem[]; log: ActivityLog } {
    const item = items.find(i => i.id === itemId)!;
    const stage = stages.find(s => s.id === item.stageId);

    const remainingQty = item.quantity - rejectQty;

    const updated = items.map(i =>
        i.id === itemId
            ? {
                ...i,
                quantity: Math.max(0, remainingQty),
                status: remainingQty <= 0 ? 'rejected' as const : 'active' as const,
                updated_at: new Date().toISOString()
            }
            : i
    );

    // If partial reject, create a rejected clone of the item for history/stats
    if (remainingQty > 0) {
        updated.push({
            ...item,
            id: nextId('item'),
            quantity: rejectQty,
            status: 'rejected',
            updated_at: new Date().toISOString()
        });
    }

    const log: ActivityLog = {
        id: nextId('log'),
        timestamp: new Date().toISOString(),
        user,
        action: 'rejected' as const,
        item_name: `[REJECT/GAGAL] ${item.name} (${rejectQty}x)`,
        from_stage: stage?.name || null,
        to_stage: 'Waste / Reject',
        logicType: 'exit',
        metadata: { rejectedQty: rejectQty }
    };

    return { items: updated, log };
}

// ============================================
// STATS HELPERS
// ============================================

export function calcStats(items: KanbanItem[], logs: ActivityLog[], blueprint: WorkflowBlueprint) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = items.filter(i => i.status === 'active');
    const packingStage = blueprint.stages.find(s => s.logicType === 'passthrough' && s.name.toLowerCase().includes('pack'));
    const exitStage = blueprint.stages.find(s => s.logicType === 'exit');

    const wipStageIds = blueprint.stages
        .filter(s => s.logicType !== 'exit' && s.id !== packingStage?.id)
        .map(s => s.id);

    const wip = active.filter(i => wipStageIds.includes(i.stageId));
    const readyStock = packingStage ? active.filter(i => i.stageId === packingStage.id) : [];

    const todayLogs = logs.filter(l => new Date(l.timestamp) >= today);
    const salesToday = todayLogs.filter(l => l.action === 'sold');
    const splitToday = todayLogs.filter(l => l.action === 'split');
    const mergeToday = todayLogs.filter(l => l.action === 'merged');

    // Sales by channel
    const salesByChannel: Record<string, number> = {};
    salesToday.forEach(l => {
        const ch = l.metadata?.salesChannel || 'unknown';
        salesByChannel[ch] = (salesByChannel[ch] || 0) + 1;
    });

    const bpStageIds = blueprint.stages.map(s => s.id);
    const rejectedItems = items.filter(i => i.status === 'rejected' && bpStageIds.includes(i.stageId));

    return {
        wipCount: wip.reduce((s, i) => s + i.quantity, 0),
        readyStockCount: readyStock.reduce((s, i) => s + i.quantity, 0),
        stockValue: readyStock.reduce((s, i) => s + i.quantity * i.price, 0),
        salesTodayCount: salesToday.length,
        splitTodayCount: splitToday.length,
        mergeTodayCount: mergeToday.length,
        rejectedCount: rejectedItems.reduce((s, i) => s + i.quantity, 0),
        rejectedItems,
        salesByChannel,
    };
}
