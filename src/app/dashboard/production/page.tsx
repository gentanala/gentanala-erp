'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    Plus,
    History,
    FileText,
    Hammer,
    PackageCheck,
    ShoppingBag,
    Scissors,
    Wrench,
    Pencil,
    Trash2,
    Search,
    X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KanbanBoard } from '@/components/production/kanban-board';
import { ActivityLogPanel } from '@/components/production/activity-log-panel';
import { DailyRecapDialog } from '@/components/production/daily-recap-dialog';
import { SplitDialog } from '@/components/production/split-dialog';
import { AssemblyAllocationDialog } from '@/components/production/assembly-allocation-dialog';
import { MoveDialog } from '@/components/production/move-dialog';
import { SalesExitDialog } from '@/components/production/sales-exit-dialog';
import { SendToWorkflowDialog } from '@/components/production/send-to-workflow-dialog';
import { useAuth } from '@/contexts/auth-context';
import type { KanbanItem, ActivityLog, WorkflowStage, SalesChannel, WorkflowBlueprint } from '@/lib/database.types';
import {
    getKanbanItems,
    getKanbanLogs,
    saveKanbanItem,
    deleteKanbanItem,
    createProductionLog,
    getProductsForSPK
} from '@/lib/actions/production';
import { getProducts } from '@/lib/actions/inventory';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ============================================
// AUTOCOMPLETE COMBOBOX COMPONENT
// ============================================

function AutocompleteInput({
    label,
    value,
    onChange,
    suggestions,
    placeholder,
    id,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
    id: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => { setQuery(value); }, [value]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = query
        ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
        : suggestions.slice(0, 8);

    return (
        <div ref={ref} className="relative space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                className="h-12"
                autoComplete="off"
            />
            {open && filtered.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-[200px] overflow-y-auto">
                    {filtered.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setQuery(item);
                                onChange(item);
                                setOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================
// MATERIAL SEARCH COMBOBOX — filters by stage's allowed categories
// ============================================

function MaterialSearchInput({
    materials,
    products,
    allowedCategories,
    onSelect,
    value,
    onChange,
}: {
    materials: MasterMaterial[];
    products: MasterProduct[];
    allowedCategories?: MaterialCategory[];
    onSelect: (item: { name: string; sku: string; collection?: string }) => void;
    value: string;
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Use filtered search if categories specified, otherwise show all
    const categories = allowedCategories && allowedCategories.length > 0
        ? allowedCategories
        : ['raw', 'wip', 'finished'] as MaterialCategory[];
    const results = searchByCategories(materials, products, value, categories);

    // Label based on what categories we're filtering
    const labelText = categories.length === 1 && categories[0] === 'raw'
        ? 'Cari Raw Material'
        : categories.length === 1 && categories[0] === 'finished'
            ? 'Cari Finished Product'
            : 'Cari Material / Produk';

    return (
        <div ref={ref} className="relative space-y-2">
            <Label htmlFor="search-material">
                <Search className="inline h-3.5 w-3.5 mr-1" />
                {labelText}
            </Label>
            <Input
                id="search-material"
                value={value}
                onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Ketik nama atau SKU..."
                className="h-12"
                autoComplete="off"
            />
            {open && results.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-[250px] overflow-y-auto">
                    {results.map((r, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                onSelect(r);
                                onChange(r.name);
                                setOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${r.category === 'raw' ? 'bg-amber-100 text-amber-700'
                                    : r.category === 'wip' ? 'bg-sky-100 text-sky-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {r.category === 'raw' ? 'RAW' : r.category === 'wip' ? 'WIP' : 'FG'}
                                </span>
                                <span className="text-sm font-medium text-gray-900">{r.name}</span>
                            </div>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5 ml-9">
                                {r.sku}
                                {r.collection && ` · ${r.collection}`}
                            </p>
                        </button>
                    ))}
                </div>
            )}
            {open && results.length === 0 && value.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl p-4">
                    <p className="text-sm text-gray-400 text-center">Tidak ditemukan di Master Data</p>
                    <p className="text-[10px] text-gray-400 text-center mt-1">Tambah dulu di Settings → Master Data</p>
                </div>
            )}
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ProductionPage() {
    const { profile } = useAuth();
    const userName = profile?.full_name || 'Admin';

    // Master data state (in-memory, syncs to localStorage now)
    const [materials, setMaterials] = useState<MasterMaterial[]>(DEMO_MATERIALS);
    const [products, setProducts] = useState<MasterProduct[]>(DEMO_PRODUCTS);
    const [collections, setCollections] = useState<MasterCollection[]>(DEMO_COLLECTIONS);

    // Core state
    const [blueprints, setBlueprints] = useState<WorkflowBlueprint[]>([WATCH_BLUEPRINT]);
    const [selectedBpId, setSelectedBpId] = useState<string>(WATCH_BLUEPRINT.id);
    const blueprint = useMemo(() => {
        return blueprints.find(bp => bp.id === selectedBpId) || blueprints[0];
    }, [blueprints, selectedBpId]);

    const [items, setItems] = useState<KanbanItem[]>(DEMO_ITEMS);
    const [logs, setLogs] = useState<ActivityLog[]>([]);

    const [isLoaded, setIsLoaded] = useState(false);

    // Initial Load from LocalStorage
    const handleRefresh = useCallback(async () => {
        setLoading(true);
        try {
            const [kanbanData, logsData, invProducts] = await Promise.all([
                getKanbanItems(),
                getKanbanLogs(),
                getProducts() // from inventory actions
            ]);

            // Sync with local state
            setItems(kanbanData);
            setLogs(logsData);

            // Map inventory products to master products for MES internal use
            const mappedProducts: MasterProduct[] = invProducts.map(p => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                collection: p.collection || '',
                description: p.description || '',
                bom: [] // In future, load BOM from Supabase or Master Data
            }));
            setProducts(mappedProducts);
            setCollections(DEMO_COLLECTIONS);
        } catch (error: any) {
            console.error("Gagal refresh board:", error);
            toast.error('Gagal memuat data board produksi');
        } finally {
            setLoading(false);
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);



    // History Stack for Undo
    const [history, setHistory] = useState<{ items: KanbanItem[], logs: ActivityLog[] }[]>([]);

    const saveHistory = useCallback(() => {
        setHistory(prev => [...prev, { items: [...items], logs: [...logs] }]);
    }, [items, logs]);

    const handleUndo = useCallback(() => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const newHistory = [...prev];
            const lastState = newHistory.pop()!;
            setItems(lastState.items);
            setLogs(lastState.logs);
            toast.info('↩️ Undo berhasil. State dikembalikan.');
            return newHistory;
        });
    }, []);

    // Panel states
    const [logPanelOpen, setLogPanelOpen] = useState(false);
    const [recapDialogOpen, setRecapDialogOpen] = useState(false);

    // Add dialog
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [addToStageId, setAddToStageId] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [newName, setNewName] = useState('');
    const [newEmoji, setNewEmoji] = useState('');
    const [newSku, setNewSku] = useState('');
    const [newQty, setNewQty] = useState('1');
    const [newCollection, setNewCollection] = useState('');

    // Edit dialog
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<KanbanItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editEmoji, setEditEmoji] = useState('');
    const [editSku, setEditSku] = useState('');
    const [editQty, setEditQty] = useState('1');
    const [editCollection, setEditCollection] = useState('');

    // Delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<KanbanItem | null>(null);

    // Reject dialog
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectingItem, setRejectingItem] = useState<KanbanItem | null>(null);
    const [rejectQty, setRejectQty] = useState('1');

    // Stage-specific dialog states
    const [splitDialogOpen, setSplitDialogOpen] = useState(false);
    const [mergeDialogOpen, setMergeDialogOpen] = useState(false); // Can be kept for legacy/other flows if needed
    const [assemblyAllocationDialogOpen, setAssemblyAllocationDialogOpen] = useState(false);
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [salesDialogOpen, setSalesDialogOpen] = useState(false);
    const [sendToWorkflowDialogOpen, setSendToWorkflowDialogOpen] = useState(false);
    const [pendingItem, setPendingItem] = useState<KanbanItem | null>(null);
    const [pendingTargetStage, setPendingTargetStage] = useState<WorkflowStage | null>(null);

    // Stats
    const stats = useMemo(() => calcStats(items, logs, blueprint), [items, logs, blueprint]);

    // Collection names for autocomplete
    const collectionNames = useMemo(() => collections.map(c => c.name), [collections]);

    // ===========================
    // INVENTORY SYNC
    // ===========================
    const updateInventoryOnMove = useCallback((itemSku: string, movedQty: number, fromStageName: string, toStageName: string) => {
        try {
            if (!itemSku) return;
            const isToPacking = toStageName.toLowerCase().includes('packing');
            const isFromPacking = fromStageName.toLowerCase().includes('packing');
            const isToSold = toStageName.toLowerCase().includes('sold');

            if (isToPacking && !isFromPacking) {
                const saved = localStorage.getItem('gentanala_inventory_products');
                if (saved) {
                    const invProducts = JSON.parse(saved);
                    const pIndex = invProducts.findIndex((p: any) => p.sku === itemSku);
                    if (pIndex >= 0) {
                        invProducts[pIndex].current_stock += movedQty;
                        localStorage.setItem('gentanala_inventory_products', JSON.stringify(invProducts));
                        toast.success(`📦 Stok Inventory +${movedQty} otomatis ditambahkan!`);
                    }
                }
            } else if ((isFromPacking && !isToPacking) || isToSold) {
                const saved = localStorage.getItem('gentanala_inventory_products');
                if (saved) {
                    const invProducts = JSON.parse(saved);
                    const pIndex = invProducts.findIndex((p: any) => p.sku === itemSku);
                    if (pIndex >= 0) {
                        invProducts[pIndex].current_stock = Math.max(0, invProducts[pIndex].current_stock - movedQty);
                        localStorage.setItem('gentanala_inventory_products', JSON.stringify(invProducts));
                        if (isToSold) {
                            toast.info(`📦 Stok Inventory dikurangi ${movedQty} karena barang terjual (SOLD).`);
                        } else {
                            toast.info(`📦 Stok Inventory dikurangi ${movedQty} karena kembali ke proses sebelumnya.`);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Gagal sinkronisasi inventory", e);
        }
    }, []);

    // ===========================
    // DRAG HANDLER
    // ===========================
    const handleItemDrop = useCallback(async (itemId: string, fromStageId: string, toStageId: string) => {
        const item = items.find(i => i.id === itemId);
        const targetStage = blueprint.stages.find(s => s.id === toStageId);
        if (!item || !targetStage) return;

        setPendingItem(item);
        setPendingTargetStage(targetStage);

        // Determine material category.
        let itemCategory = 'raw';
        if (item.sku?.startsWith('FG-')) {
            itemCategory = 'finished';
        } else if (item.parentId || (item.mergedFrom && item.mergedFrom.length > 0) || item.sku?.startsWith('WIP-')) {
            itemCategory = 'wip';
        }

        const isAllowed = targetStage.allowedMaterialCategories?.includes(itemCategory as any) ?? true;
        if (!isAllowed) {
            toast.error(`Stage ${targetStage.name} tidak menerima kategori material ini.`);
            return;
        }

        switch (targetStage.logicType) {
            case 'split': setSplitDialogOpen(true); break;
            case 'exit': setSalesDialogOpen(true); break;
            case 'merge': {
                const isInBOM = products.some(p => p.bom.some(b => b.materialSku === item.sku));
                if (isInBOM) {
                    setAssemblyAllocationDialogOpen(true);
                } else {
                    toast.error(`Material '${item.name}' tidak dapat dirakit (tidak ada di BOM manapun)`);
                }
                break;
            }
            case 'passthrough':
            default: {
                if (item.quantity > 1) {
                    setMoveDialogOpen(true);
                } else {
                    try {
                        const result = handlePassthrough(items, itemId, toStageId, 1, userName, blueprint.stages);
                        // PERSIST TO SUPABASE
                        for (const itm of result.items) {
                            await saveKanbanItem(itm);
                        }
                        // If item was removed/consumed in local engine logic (e.g. fully moved and merged), 
                        // we might need to delete the old one or the result logic handles it via status.
                        // Actually, our saveKanbanItem handles updates/inserts. For full moves, 
                        // handlePassthrough updates the stageId, so we just save it.
                        await createProductionLog(result.log);
                        handleRefresh();
                        toast.success(`➡️ Moved '${item.name}' → ${targetStage.name}`);
                    } catch (err) {
                        toast.error("Gagal update ke database");
                    }
                }
                break;
            }
        }
    }, [items, userName, blueprint.stages, products, handleRefresh]);

    const handleMoveConfirm = useCallback(async (movedQuantity: number) => {
        if (!pendingItem || !pendingTargetStage) return;
        try {
            const result = handlePassthrough(
                items, pendingItem.id, pendingTargetStage.id,
                movedQuantity, userName, blueprint.stages
            );

            // Persist all affected items
            for (const itm of result.items) {
                await saveKanbanItem(itm);
            }
            await createProductionLog(result.log);
            setMoveDialogOpen(false);
            handleRefresh();
            toast.success(`➡️ Moved ${movedQuantity}x '${pendingItem.name}' → ${pendingTargetStage.name}`);
        } catch (err) {
            toast.error("Gagal simpan pergerakan");
        }
    }, [items, pendingItem, pendingTargetStage, userName, blueprint.stages, handleRefresh]);

    // ===========================
    // SPLIT CONFIRM
    // ===========================
    const handleSplitConfirm = useCallback(async (consumedCount: number, yieldCount: number, childName: string, childSku: string) => {
        if (!pendingItem || !pendingTargetStage) return;
        try {
            const result = handleSplit(
                items, pendingItem.id, pendingTargetStage.id,
                consumedCount, yieldCount, childName, childSku, userName, blueprint.stages
            );
            for (const itm of result.items) {
                await saveKanbanItem(itm);
            }
            for (const l of result.logs) {
                await createProductionLog(l);
            }
            setSplitDialogOpen(false);
            handleRefresh();
            toast.success(`✂️ Split '${pendingItem.name}' → ${yieldCount} × ${childName}`);
        } catch (err) {
            toast.error("Gagal simpan split");
        }
    }, [items, pendingItem, pendingTargetStage, userName, blueprint.stages, handleRefresh]);

    // ===========================
    // ASSEMBLY ALLOCATION CONFIRM
    // ===========================
    const handleAssemblyAllocateConfirm = useCallback(async (allocateQty: number, product: MasterProduct) => {
        if (!pendingItem || !pendingTargetStage) return;
        try {
            const result = handleAssemblyAllocation(
                items, pendingItem.id, pendingTargetStage.id, allocateQty, product, userName, blueprint.stages
            );
            for (const itm of result.items) {
                if (itm.status === 'consumed') {
                    // We could either update status to consumed or delete. 
                    // Let's update status to keep historical links in DB.
                    await saveKanbanItem(itm);
                } else {
                    await saveKanbanItem(itm);
                }
            }
            for (const l of result.logs) {
                await createProductionLog(l);
            }
            setAssemblyAllocationDialogOpen(false);
            handleRefresh();
            toast.success(`🔧 Dialokasikan ${allocateQty}x ${pendingItem.name} ke Perakitan ${product.name}`);
        } catch (err) {
            toast.error("Gagal simpan alokasi perakitan");
        }
    }, [items, pendingItem, pendingTargetStage, userName, blueprint.stages, handleRefresh]);

    const handleAllocateClick = useCallback((item: KanbanItem) => {
        const targetStage = blueprint.stages.find(s => s.id === item.stageId);
        if (targetStage && targetStage.logicType === 'merge') {
            setPendingItem(item);
            setPendingTargetStage(targetStage);
            setAssemblyAllocationDialogOpen(true);
        }
    }, [blueprint.stages]);

    // ===========================
    // SALES CONFIRM
    // ===========================
    const handleSalesConfirm = useCallback(async (channel: SalesChannel) => {
        if (!pendingItem || !pendingTargetStage) return;
        try {
            const result = handleExit(
                items, pendingItem.id, pendingTargetStage.id,
                channel, 0, userName, blueprint.stages
            );
            for (const itm of result.items) {
                await saveKanbanItem(itm);
            }
            await createProductionLog(result.log);
            setSalesDialogOpen(false);
            handleRefresh();
            toast.success(`💰 Sold '${pendingItem.name}' via ${channel}`);
        } catch (err) {
            toast.error("Gagal simpan data penjualan");
        }
    }, [items, pendingItem, pendingTargetStage, userName, blueprint.stages, handleRefresh]);

    // ===========================
    // SEND TO WORKFLOW
    // ===========================
    const handleSendToWorkflowClick = useCallback((item: KanbanItem) => {
        setPendingItem(item);
        setSendToWorkflowDialogOpen(true);
    }, []);

    const handleSendToWorkflowConfirm = useCallback((targetStageId: string, movedQuantity: number) => {
        if (!pendingItem) return;
        saveHistory();

        // Find target stage details across all blueprints
        const allStages = blueprints.flatMap(bp => bp.stages);
        const toStage = allStages.find(s => s.id === targetStageId);
        if (!toStage) return;

        const targetBlueprint = blueprints.find(bp => bp.stages.some(s => s.id === targetStageId));

        // Use handlePassthrough but we provide all stages
        const result = handlePassthrough(
            items, pendingItem.id, targetStageId,
            movedQuantity, userName, allStages
        );

        setItems(result.items);
        setLogs(prev => [result.log, ...prev]);
        setSendToWorkflowDialogOpen(false);
        toast.success(`➡️ Terkirim ${movedQuantity}x '${pendingItem.name}' ke ${targetBlueprint?.name} - ${toStage.name}`);
    }, [items, pendingItem, userName, blueprints, saveHistory]);

    // ===========================
    // ADD ITEM
    // ===========================
    const handleAddItemClick = useCallback((stageId: string) => {
        setAddToStageId(stageId);
        setSearchQuery('');
        setNewName('');
        setNewEmoji('');
        setNewSku('');
        setNewQty('1');
        setNewCollection('');
        setAddDialogOpen(true);
    }, []);

    const handleSearchSelect = (item: { name: string; sku: string; collection?: string }) => {
        setNewName(item.name);
        setNewSku(item.sku);
        if (item.collection) setNewCollection(item.collection);
    };

    const handleConfirmAdd = async () => {
        if (!newName.trim()) { toast.error('Nama item harus diisi'); return; }
        try {
            const result = handleAddItem(
                items, newName.trim(), newSku, addToStageId,
                parseInt(newQty) || 1,
                newCollection.trim() || null,
                newEmoji || undefined,
                userName, blueprint.stages
            );

            for (const itm of result.items) {
                await saveKanbanItem(itm);
            }
            await createProductionLog(result.log);
            setAddDialogOpen(false);
            handleRefresh();
            const stageName = blueprint.stages.find(s => s.id === addToStageId)?.name || '';
            toast.success(`Added '${newName}' to ${stageName}`);
        } catch (err) {
            toast.error("Gagal tambah item");
        }
    };

    // ===========================
    // EDIT ITEM
    // ===========================
    const handleEditClick = useCallback((item: KanbanItem) => {
        setEditingItem(item);
        setEditName(item.name);
        setEditEmoji(item.emoji || '');
        setEditSku(item.sku || '');
        setEditQty(item.quantity.toString());
        setEditCollection(item.collection || '');
        setEditDialogOpen(true);
    }, []);

    const handleConfirmEdit = async () => {
        if (!editingItem || !editName.trim()) return;
        try {
            const result = handleEditItem(
                items, editingItem.id,
                {
                    name: editName.trim(),
                    emoji: editEmoji || undefined,
                    sku: editSku || null,
                    quantity: parseInt(editQty) || 1,
                    collection: editCollection.trim() || null,
                },
                userName, blueprint.stages
            );
            for (const itm of result.items) {
                await saveKanbanItem(itm);
            }
            await createProductionLog(result.log);
            setEditDialogOpen(false);
            handleRefresh();
            toast.success(`✏️ Updated '${editName}'`);
        } catch (err) {
            toast.error("Gagal simpan perubahan");
        }
    };

    // ===========================
    // DELETE ITEM
    // ===========================
    const handleDeleteClick = useCallback((item: KanbanItem) => {
        setDeletingItem(item);
        setDeleteDialogOpen(true);
    }, []);

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        try {
            const result = handleDeleteItem(items, deletingItem.id, userName, blueprint.stages);
            await deleteKanbanItem(deletingItem.id);
            await createProductionLog(result.log);
            setDeleteDialogOpen(false);
            handleRefresh();
            toast.success(`🗑️ Deleted '${deletingItem.name}'`);
        } catch (err) {
            toast.error("Gagal hapus item");
        }
    };

    // ===========================
    // REJECT ITEM
    // ===========================
    const handleRejectClick = useCallback((item: KanbanItem) => {
        setRejectingItem(item);
        setRejectQty(item.quantity.toString());
        setRejectDialogOpen(true);
    }, []);

    const handleConfirmReject = async () => {
        if (!rejectingItem) return;
        const qty = parseInt(rejectQty);
        if (isNaN(qty) || qty <= 0 || qty > rejectingItem.quantity) {
            toast.error('Jumlah reject tidak valid');
            return;
        }

        try {
            const result = handleRejectItem(items, rejectingItem.id, qty, userName, blueprint.stages);
            for (const itm of result.items) {
                await saveKanbanItem(itm);
            }
            await createProductionLog(result.log);
            setRejectDialogOpen(false);
            handleRefresh();
            toast.success(`⚠️ Marked ${qty}x '${rejectingItem.name}' as Reject`);
        } catch (err) {
            toast.error("Gagal tandai reject");
        }
    };

    // Items available for BOM merge (active items with stock)
    const mergeableItems = useMemo(() => {
        return items.filter(i => i.status === 'active' && i.quantity > 0);
    }, [items]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Production Board</h1>
                    <p className="text-muted-foreground text-sm">
                        {blueprint.name} — Drag kartu untuk track produksi. Semua pergerakan tercatat.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {history.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUndo}
                            className="gap-1.5 h-10 border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
                            Undo
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setLogPanelOpen(true)} className="gap-1.5 h-10">
                        <History className="h-4 w-4" />
                        Audit Trail
                        {logs.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                                {logs.length}
                            </span>
                        )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setRecapDialogOpen(true)} className="gap-1.5 h-10">
                        <FileText className="h-4 w-4" />
                        Daily Report
                    </Button>
                </div>
            </div>

            {/* Blueprint Selector */}
            {blueprints.length > 1 && (
                <div className="flex gap-1.5 p-1.5 bg-gray-100/80 border border-gray-200/50 rounded-xl overflow-x-auto max-w-max">
                    {blueprints.map(bp => (
                        <button
                            key={bp.id}
                            onClick={() => setSelectedBpId(bp.id)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${blueprint.id === bp.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                                }`}
                        >
                            {bp.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Mini Dashboard */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">WIP</CardTitle>
                        <Hammer className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.wipCount}</div>
                        <p className="text-xs text-muted-foreground">Dalam proses</p>
                    </CardContent>
                </Card>

                <Card className={stats.readyStockCount > 0 ? 'border-emerald-200 bg-emerald-50/50' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ready Stock</CardTitle>
                        <PackageCheck className={`h-4 w-4 ${stats.readyStockCount > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.readyStockCount > 0 ? 'text-emerald-600' : ''}`}>
                            {stats.readyStockCount}
                        </div>
                        <p className="text-xs text-muted-foreground">Siap jual</p>
                    </CardContent>
                </Card>

                <Card className={stats.salesTodayCount > 0 ? 'border-orange-200 bg-orange-50/50' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Sales Today</CardTitle>
                        <ShoppingBag className={`h-4 w-4 ${stats.salesTodayCount > 0 ? 'text-orange-600' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.salesTodayCount > 0 ? 'text-orange-600' : ''}`}>
                            {stats.salesTodayCount}
                        </div>
                        <p className="text-xs text-muted-foreground">Terjual hari ini</p>
                    </CardContent>
                </Card>

                <Card className={stats.rejectedCount > 0 ? 'border-red-200 bg-red-50/50' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Gagal / Reject</CardTitle>
                        <Trash2 className={`h-4 w-4 ${stats.rejectedCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.rejectedCount > 0 ? 'text-red-600' : ''}`}>
                            {stats.rejectedCount}
                        </div>
                        <p className="text-xs text-muted-foreground">Total pcs rusak</p>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Transformations */}
            {(stats.splitTodayCount > 0 || stats.mergeTodayCount > 0) && (
                <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-violet-50 border border-violet-200">
                    <span className="text-xs font-bold text-violet-700">Transformasi Hari Ini:</span>
                    {stats.splitTodayCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-700">
                            <Scissors className="h-3 w-3" /> {stats.splitTodayCount} split
                        </span>
                    )}
                    {stats.mergeTodayCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-purple-700">
                            <Wrench className="h-3 w-3" /> {stats.mergeTodayCount} merge
                        </span>
                    )}
                </div>
            )}

            {/* Kanban Board */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Production Flow — {blueprint.name}</CardTitle>
                        <span className="text-xs text-gray-400">
                            {items.filter(i => i.status === 'active').length} active items
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <KanbanBoard
                        blueprint={blueprint}
                        items={items}
                        products={products}
                        onItemDrop={handleItemDrop}
                        onAddItem={handleAddItemClick}
                        onEditItem={handleEditClick}
                        onDeleteItem={handleDeleteClick}
                        onRejectItem={handleRejectClick}
                        onSendToWorkflow={handleSendToWorkflowClick}
                        onAllocateItem={handleAllocateClick}
                    />
                </CardContent>
            </Card>

            {/* Waste Tracker Table */}
            {stats.rejectedCount > 0 && (
                <Card className="border-red-200">
                    <CardHeader className="pb-3 bg-red-50/50 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-red-500" />
                                <CardTitle className="text-base text-red-700">Tabel Gagal Proses / Waste</CardTitle>
                            </div>
                            <span className="text-xs font-bold bg-white text-red-700 border border-red-200 px-2 py-1 rounded-full">
                                Total: {stats.rejectedCount} pcs
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="rounded-xl border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b">
                                        <th className="py-2.5 px-4 text-left font-semibold text-gray-500 w-[40%]">Item & SKU</th>
                                        <th className="py-2.5 px-4 text-left font-semibold text-gray-500">Qty Gagal</th>
                                        <th className="py-2.5 px-4 text-left font-semibold text-gray-500">Stage Terakhir</th>
                                        <th className="py-2.5 px-4 text-left font-semibold text-gray-500 hidden sm:table-cell">Waktu Direject</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.rejectedItems.map(item => {
                                        const stageName = blueprint.stages.find(s => s.id === item.stageId)?.name || 'Unknown';
                                        return (
                                            <tr key={item.id} className="border-b last:border-0 hover:bg-red-50/30 transition-colors">
                                                <td className="py-2.5 px-4">
                                                    <p className="font-medium text-gray-900 leading-tight">{item.name}</p>
                                                    {item.sku && <p className="text-[10px] font-mono text-gray-400 mt-0.5">{item.sku}</p>}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <span className="inline-flex py-0.5 px-2 bg-red-100 text-red-700 font-bold rounded text-xs">
                                                        {item.quantity} pcs
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-gray-600 font-medium">
                                                    {stageName}
                                                </td>
                                                <td className="py-2.5 px-4 text-gray-400 text-[10px] hidden sm:table-cell">
                                                    {new Date(item.updated_at).toLocaleString('id-ID')}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* === PANELS & DIALOGS === */}

            <ActivityLogPanel open={logPanelOpen} onClose={() => setLogPanelOpen(false)} logs={logs} />

            <DailyRecapDialog
                open={recapDialogOpen}
                onOpenChange={setRecapDialogOpen}
                items={items}
                logs={logs}
                blueprint={blueprint}
            />

            <MoveDialog
                open={moveDialogOpen}
                onOpenChange={setMoveDialogOpen}
                item={pendingItem}
                targetStage={pendingTargetStage}
                onConfirm={handleMoveConfirm}
            />

            <SplitDialog
                open={splitDialogOpen}
                onOpenChange={setSplitDialogOpen}
                item={pendingItem}
                targetStage={pendingTargetStage}
                defaultYield={pendingTargetStage?.defaultYield || 4}
                materials={materials}
                onConfirm={handleSplitConfirm}
            />

            <AssemblyAllocationDialog
                open={assemblyAllocationDialogOpen}
                onOpenChange={setAssemblyAllocationDialogOpen}
                draggedItem={pendingItem}
                products={products}
                onConfirm={handleAssemblyAllocateConfirm}
            />

            <SalesExitDialog
                open={salesDialogOpen}
                onOpenChange={setSalesDialogOpen}
                item={pendingItem}
                onConfirm={handleSalesConfirm}
            />

            <SendToWorkflowDialog
                open={sendToWorkflowDialogOpen}
                onOpenChange={setSendToWorkflowDialogOpen}
                item={pendingItem}
                blueprints={blueprints}
                currentBlueprintId={blueprint.id}
                onConfirm={handleSendToWorkflowConfirm}
            />

            {/* ===== ADD ITEM DIALOG ===== */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle>
                            <Plus className="inline h-5 w-5 mr-2" />
                            Tambah Item — {blueprint.stages.find(s => s.id === addToStageId)?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Search from master data — filtered by stage's allowed categories */}
                        <MaterialSearchInput
                            materials={materials}
                            products={products}
                            allowedCategories={blueprint.stages.find(s => s.id === addToStageId)?.allowedMaterialCategories}
                            onSelect={handleSearchSelect}
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />

                        {newName && (
                            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                                <p className="text-xs font-bold text-blue-700 mb-1">Item yang dipilih:</p>
                                <p className="text-sm font-semibold text-gray-900">{newName}</p>
                                <p className="text-[10px] font-mono text-gray-500">{newSku}{newCollection && ` · ${newCollection}`}</p>
                            </div>
                        )}

                        <div className="border-t border-gray-100 pt-3 space-y-3">
                            <div className="grid grid-cols-4 gap-3">
                                <div className="space-y-1 col-span-1">
                                    <Label className="text-xs">Emoji</Label>
                                    <Input
                                        placeholder="📦"
                                        maxLength={2}
                                        value={newEmoji}
                                        onChange={(e) => setNewEmoji(e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1 col-span-3">
                                    <Label className="text-xs">Nama Item</Label>
                                    <Input
                                        placeholder="Sub-assembly / WIP / part"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="add-qty">Quantity</Label>
                                <Input id="add-qty" type="number" min="1" value={newQty} onChange={e => setNewQty(e.target.value)} className="h-12 text-lg font-bold text-center" />
                            </div>
                        </div>

                        {!newName && (
                            <p className="text-xs text-center text-gray-400 py-2">⬆️ Pilih item dari Master Data di atas</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="h-12">Batal</Button>
                        <Button onClick={handleConfirmAdd} className="h-12 gap-2" disabled={!newName.trim()}>
                            <Plus className="h-4 w-4" /> Tambah Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== EDIT ITEM DIALOG ===== */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>
                            <Pencil className="inline h-5 w-5 mr-2 text-blue-500" />
                            Edit Item
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1 col-span-1">
                                <Label className="text-xs">Emoji</Label>
                                <Input
                                    placeholder="📦"
                                    maxLength={2}
                                    value={editEmoji}
                                    onChange={(e) => setEditEmoji(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-1 col-span-3">
                                <Label className="text-xs">Nama Item</Label>
                                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-9" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-sku">SKU</Label>
                            <Input id="edit-sku" value={editSku} onChange={e => setEditSku(e.target.value)} className="h-12" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="edit-qty">Quantity</Label>
                                <Input id="edit-qty" type="number" min="1" value={editQty} onChange={e => setEditQty(e.target.value)} className="h-12" />
                            </div>
                            <AutocompleteInput
                                id="edit-collection"
                                label="Collection"
                                value={editCollection}
                                onChange={setEditCollection}
                                suggestions={collectionNames}
                                placeholder="e.g. Hutan Tropis"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="h-12">Batal</Button>
                        <Button onClick={handleConfirmEdit} className="h-12 gap-2 bg-blue-600 hover:bg-blue-700">
                            <Pencil className="h-4 w-4" /> Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== DELETE CONFIRMATION DIALOG ===== */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[380px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">
                            <Trash2 className="inline h-5 w-5 mr-2" />
                            Hapus Item?
                        </DialogTitle>
                    </DialogHeader>
                    {deletingItem && (
                        <div className="py-2">
                            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                                <p className="font-bold text-sm text-gray-900">{deletingItem.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {deletingItem.sku} · {deletingItem.quantity} pcs
                                    {deletingItem.collection && ` · ${deletingItem.collection}`}
                                </p>
                            </div>
                            <p className="text-sm text-gray-500 mt-3">
                                Item ini akan dihapus dari papan produksi. Aksi ini tidak bisa dibatalkan.
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="h-12">Batal</Button>
                        <Button onClick={handleConfirmDelete} variant="destructive" className="h-12 gap-2">
                            <Trash2 className="h-4 w-4" /> Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* REJECT DIALOG */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tandai Reject / Gagal</DialogTitle>
                    </DialogHeader>
                    {rejectingItem && (
                        <div className="space-y-4 py-2">
                            <p className="text-sm text-gray-500">
                                Berapa banyak <span className="font-bold text-gray-900">{rejectingItem.name}</span> yang gagal diproses / rusak?
                            </p>
                            <div className="space-y-2">
                                <Label>Jumlah (Maks {rejectingItem.quantity})</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={rejectingItem.quantity}
                                    value={rejectQty}
                                    onChange={(e) => setRejectQty(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Batal</Button>
                        <Button variant="destructive" onClick={handleConfirmReject} className="gap-2">
                            <Trash2 className="h-4 w-4" /> Reject {rejectQty} pcs
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
