'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Settings,
    Plus,
    Trash2,
    GripVertical,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Save,
    Database,
    Package,
    Layers,
    Pencil,
    X,
    RefreshCw,
    LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { WorkflowBlueprint, WorkflowStage, StageLogicType, SalesChannel } from '@/lib/database.types';
import { STAGE_LOGIC_CONFIG, SALES_CHANNEL_LABELS } from '@/lib/database.types';
import { WATCH_BLUEPRINT } from '@/lib/production-engine';
import {
    DEMO_COLLECTIONS,
} from '@/lib/master-data';
import type {
    MasterMaterial,
    MasterProduct,
    MasterCollection,
    MaterialCategory,
    BOMComponent,
} from '@/lib/master-data';
import { 
    getMaterials, 
    createMaterial, 
    updateMaterial, 
    deleteMaterialAction,
    getProductsWithBOM,
    updateProductBOM,
    getCollections,
    createCollectionAction,
    deleteCollectionAction 
} from '@/lib/actions/master-data';
import { createProduct, updateProduct, deleteProduct } from '@/lib/actions/inventory';
import { useAuth } from '@/contexts/auth-context';

// ==============================
// STAGE EDITOR
// ==============================

const STAGE_COLORS = [
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
    { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', dot: 'bg-sky-500' },
    { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', dot: 'bg-indigo-500' },
    { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500' },
    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
    { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', dot: 'bg-teal-500' },
];

const LOGIC_OPTIONS: { value: StageLogicType; label: string; description: string }[] = [
    { value: 'passthrough', label: '➡️ Passthrough', description: 'Pindah tanpa perubahan' },
    { value: 'split', label: '✂️ Split (1→N)', description: '1 input → banyak output' },
    { value: 'merge', label: '🔧 Merge (N→1)', description: 'Banyak input → 1 output' },
    { value: 'exit', label: '💰 Exit/Sales', description: 'Keluar dari papan, catat penjualan' },
];

const CATEGORY_OPTIONS: { value: MaterialCategory; label: string; color: string }[] = [
    { value: 'raw', label: 'Raw Material', color: 'text-amber-700 bg-amber-50' },
    { value: 'wip', label: 'WIP', color: 'text-sky-700 bg-sky-50' },
    { value: 'finished', label: 'Finished Good', color: 'text-emerald-700 bg-emerald-50' },
];

function StageEditor({
    stage,
    index,
    onChange,
    onRemove,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
}: {
    stage: WorkflowStage;
    index: number;
    onChange: (updated: WorkflowStage) => void;
    onRemove: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const logicConfig = stage?.logicType ? STAGE_LOGIC_CONFIG[stage.logicType] : null;

    return (
        <div className={`rounded-xl border-2 p-4 transition-all ${stage?.color?.border || 'border-gray-200'} ${stage?.color?.bg || 'border-gray-50'}`}>
            <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-gray-300 cursor-grab shrink-0" />
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${stage?.color?.text || 'text-gray-900'} bg-white border ${stage?.color?.border || 'border-gray-200'}`}>
                    {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{stage?.name || 'Untitled'}</p>
                    <p className="text-[10px] text-gray-500">{logicConfig ? `${logicConfig.emoji} ${logicConfig.label}` : '📋 Passthrough'}</p>
                </div>
                <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-white/50">
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="flex flex-col ml-1 bg-white/50 rounded-lg overflow-hidden border border-gray-200/50">
                    <button onClick={onMoveUp} disabled={isFirst} className="p-0.5 hover:bg-white text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronUp className="h-3 w-3" />
                    </button>
                    <button onClick={onMoveDown} disabled={isLast} className="p-0.5 hover:bg-white text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed border-t border-gray-200/50">
                        <ChevronDown className="h-3 w-3" />
                    </button>
                </div>
                <button onClick={onRemove} className="p-1.5 ml-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {expanded && (
                <div className="mt-4 space-y-3 pl-8">
                    <div className="space-y-1">
                        <Label className="text-xs">Nama Stage</Label>
                        <Input value={stage?.name || ''} onChange={e => onChange({ ...stage, name: e.target.value })} className="h-10 bg-white/80" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Emoji</Label>
                        <Input value={stage?.emoji || ''} onChange={e => onChange({ ...stage, emoji: e.target.value })} className="h-10 bg-white/80 w-20" placeholder="📦" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Tipe Logika</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {LOGIC_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => onChange({ ...stage, logicType: opt.value })}
                                    className={`p-2.5 rounded-lg text-left transition-all ${stage?.logicType === opt.value
                                        ? 'bg-white border-2 border-gray-800 shadow-sm'
                                        : 'bg-white/50 border-2 border-transparent hover:bg-white/80'
                                        }`}
                                >
                                    <p className="text-xs font-bold">{opt.label}</p>
                                    <p className="text-[10px] text-gray-500">{opt.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    {stage?.logicType === 'split' && (
                        <div className="space-y-1">
                            <Label className="text-xs">Default Yield (hasil pecah)</Label>
                            <Input type="number" min={1} value={stage?.defaultYield || 4} onChange={e => onChange({ ...stage, defaultYield: parseInt(e.target.value) || 4 })} className="h-10 bg-white/80 w-24" />
                        </div>
                    )}
                    {stage?.logicType === 'merge' && (
                        <div className="space-y-1">
                            <Label className="text-xs">Min Komponen (merge input)</Label>
                            <Input type="number" min={2} value={stage?.mergeInputCount || 2} onChange={e => onChange({ ...stage, mergeInputCount: parseInt(e.target.value) || 2 })} className="h-10 bg-white/80 w-24" />
                        </div>
                    )}

                    {/* Exit Channels Config */}
                    {stage?.logicType === 'exit' && (
                        <div className="space-y-2">
                            <Label className="text-xs font-bold">Sales Channels</Label>
                            <p className="text-[10px] text-gray-500">Pilih channel penjualan yang aktif untuk stage ini</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {(Object.entries(SALES_CHANNEL_LABELS) as [SalesChannel, string][]).map(([ch, label]) => {
                                    const active = stage?.exitChannels?.includes(ch) ?? false;
                                    return (
                                        <button
                                            key={ch}
                                            onClick={() => {
                                                const current = stage.exitChannels || [];
                                                const updated = active
                                                    ? current.filter(c => c !== ch)
                                                    : [...current, ch];
                                                onChange({ ...stage, exitChannels: updated });
                                            }}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${active
                                                ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-700'
                                                : 'bg-white/50 border-2 border-transparent text-gray-400 hover:bg-white/80'
                                                }`}
                                        >
                                            {active ? '✅ ' : ''}{label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Allowed Material Categories */}
                    {stage?.logicType !== 'exit' && (
                        <div className="space-y-2">
                            <Label className="text-xs font-bold">Kategori Input yang Diizinkan</Label>
                            <p className="text-[10px] text-gray-500">Item dari Master Data mana yang bisa di-input ke stage ini</p>
                            <div className="flex gap-2">
                                {([
                                    { cat: 'raw' as MaterialCategory, label: 'Raw Material', activeClass: 'bg-amber-100 border-2 border-amber-500 text-amber-700' },
                                    { cat: 'wip' as MaterialCategory, label: 'WIP', activeClass: 'bg-sky-100 border-2 border-sky-500 text-sky-700' },
                                    { cat: 'finished' as MaterialCategory, label: 'Finished Goods', activeClass: 'bg-emerald-100 border-2 border-emerald-500 text-emerald-700' },
                                ]).map(({ cat, label, activeClass }) => {
                                    const active = stage?.allowedMaterialCategories?.includes(cat) ?? false;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                const current = stage.allowedMaterialCategories || [];
                                                const updated = active
                                                    ? current.filter(c => c !== cat)
                                                    : [...current, cat];
                                                onChange({ ...stage, allowedMaterialCategories: updated });
                                            }}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${active
                                                ? activeClass
                                                : 'bg-white/50 border-2 border-transparent text-gray-400 hover:bg-white/80'
                                                }`}
                                        >
                                            {active ? '✅ ' : ''}{label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ==============================
// MASTER DATA TAB TYPE
// ==============================
type MasterDataTab = 'materials' | 'products' | 'collections';

// ==============================
// MAIN SETTINGS PAGE
// ==============================

export default function SettingsPage() {
    const { profile, isSuperAdmin } = useAuth();

    const handleForceLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/auth/login';
    };

    // Workflow state
    const [blueprints, setBlueprints] = useState<WorkflowBlueprint[]>([WATCH_BLUEPRINT]);
    const [selectedBpId, setSelectedBpId] = useState(WATCH_BLUEPRINT.id);
    const [editingBp, setEditingBp] = useState<WorkflowBlueprint | null>(null);

    // Master data state
    const [materials, setMaterials] = useState<MasterMaterial[]>([]);
    const [products, setProducts] = useState<MasterProduct[]>([]);
    const [collections, setCollections] = useState<MasterCollection[]>(DEMO_COLLECTIONS);
    const [masterTab, setMasterTab] = useState<MasterDataTab>('materials');

    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial Load from Cloud
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                process.env.NEXT_PUBLIC_DEBUG && console.log("SettingsPage: Loading data...");
                
                // Load Master Materials
                const mats = await getMaterials().catch(e => { console.error(e); return [] as MasterMaterial[]; });
                setMaterials(mats || []);
                
                // Load Products with BOM
                const prods = await getProductsWithBOM().catch(e => { console.error(e); return [] as MasterProduct[]; });
                setProducts(prods || []);

                // Load Blueprints & Collections from localStorage
                if (typeof window !== 'undefined') {
                    const savedBlueprints = localStorage.getItem('gentanala_master_blueprints');
                    if (savedBlueprints) {
                        try {
                            const parsed = JSON.parse(savedBlueprints);
                            if (Array.isArray(parsed)) setBlueprints(parsed);
                        } catch (e) {
                            console.error("Failed parsing blueprints from localStorage", e);
                        }
                    }
                }

                // Load Collections from database
                const dbCollections = await getCollections().catch(e => { console.error(e); return null; });
                if (dbCollections && dbCollections.length > 0) {
                    setCollections(dbCollections);
                } else if (dbCollections && dbCollections.length === 0) {
                    // It's a valid empty list from DB, respect it
                    setCollections([]);
                } else {
                    // Only if it failed (null) or first load, try fallback
                    if (typeof window !== 'undefined' && !isLoaded) {
                        const savedCollections = localStorage.getItem('gentanala_master_collections');
                        if (savedCollections) {
                            try {
                                const parsed = JSON.parse(savedCollections);
                                if (Array.isArray(parsed)) setCollections(parsed);
                                else setCollections(DEMO_COLLECTIONS);
                            } catch (e) {
                                setCollections(DEMO_COLLECTIONS);
                            }
                        } else {
                            setCollections(DEMO_COLLECTIONS);
                        }
                    } else if (isLoaded) {
                        setCollections([]);
                    }
                }
            } catch (err: any) {
                console.error("Critical fail in SettingsPage initial load:", err);
                setError(err.message || 'Unknown loading error');
                toast.error("Gagal sync data dari database");
            } finally {
                setIsLoaded(true);
            }
        };
        
        loadInitialData();
    }, []);

    // Save changes to LocalStorage
    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            localStorage.setItem('gentanala_master_collections', JSON.stringify(collections));
        }
    }, [collections, isLoaded]);

    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            localStorage.setItem('gentanala_master_blueprints', JSON.stringify(blueprints));
        }
    }, [blueprints, isLoaded]);

    // Editing state for master data
    const [editingMaterial, setEditingMaterial] = useState<MasterMaterial | null>(null);
    const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null);
    const [editingCollection, setEditingCollection] = useState<MasterCollection | null>(null);

    // New item forms
    const [newMatForm, setNewMatForm] = useState(false);
    const [newProdForm, setNewProdForm] = useState(false);
    const [newColForm, setNewColForm] = useState(false);

    const selectedBp = useMemo(() => {
        return (blueprints || []).find(b => b.id === selectedBpId);
    }, [blueprints, selectedBpId]);

    const startEdit = (bp: WorkflowBlueprint) => {
        if (!bp) return;
        setEditingBp(JSON.parse(JSON.stringify(bp)));
    };

    const addStage = () => {
        if (!editingBp) return;
        const currentStages = editingBp.stages || [];
        const order = currentStages.length + 1;
        const colorIdx = (order - 1) % STAGE_COLORS.length;
        const newStage: WorkflowStage = { 
            id: `stg-${Date.now()}`, 
            name: '', 
            order, 
            logicType: 'passthrough', 
            emoji: '📋', 
            color: STAGE_COLORS[colorIdx] 
        };
        setEditingBp({ ...editingBp, stages: [...currentStages, newStage] });
    };

    const updateStage = (index: number, updated: WorkflowStage) => {
        if (!editingBp || !editingBp.stages) return;
        const stages = [...editingBp.stages];
        stages[index] = updated;
        setEditingBp({ ...editingBp, stages });
    };

    const removeStage = (index: number) => {
        if (!editingBp || !editingBp.stages) return;
        const stages = editingBp.stages.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }));
        setEditingBp({ ...editingBp, stages });
    };

    const moveStage = (index: number, direction: 'up' | 'down') => {
        if (!editingBp || !editingBp.stages) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === editingBp.stages.length - 1) return;

        const stages = [...editingBp.stages];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap array items
        [stages[index], stages[swapIndex]] = [stages[swapIndex], stages[index]];

        // Update order properties based on their new positions
        const reorderedStages = stages.map((s, i) => ({ ...s, order: i + 1 }));
        setEditingBp({ ...editingBp, stages: reorderedStages });
    };

    const saveBlueprint = () => {
        if (!editingBp) return;
        setBlueprints(prev => (prev || []).map(bp => bp.id === editingBp.id ? editingBp : bp));
        setEditingBp(null);
        toast.success('Blueprint saved!');
    };

    const createNewBlueprint = () => {
        const newBp: WorkflowBlueprint = {
            id: `bp-${Date.now()}`, name: 'Blueprint Baru', productType: '', description: '',
            stages: [
                { id: `stg-${Date.now()}-1`, name: 'Raw Material', order: 1, logicType: 'passthrough', emoji: '📦', color: STAGE_COLORS[0] },
                { id: `stg-${Date.now()}-2`, name: 'SOLD', order: 2, logicType: 'exit', emoji: '💰', color: STAGE_COLORS[5] },
            ],
            created_at: new Date().toISOString(),
        };
        setBlueprints(prev => [...(prev || []), newBp]);
        setSelectedBpId(newBp.id);
        startEdit(newBp);
        toast.success('New blueprint created!');
    };

    if (error) {
        return (
            <div className="p-8 text-center space-y-4">
                <h1 className="text-2xl font-bold text-red-600">Terjadi Kesalahan Halaman</h1>
                <p className="text-gray-600">{error}</p>
                <Button onClick={() => window.location.reload()}>Muat Ulang</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Kelola workflow produksi, master data, dan konfigurasi sistem</p>
            </div>

            {/* ========================================== */}
            {/* MASTER DATA SECTION */}
            {/* ========================================== */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Master Data
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Database material, produk, dan koleksi sebagai sumber data utama</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.location.reload()} 
                                className="h-10 rounded-xl gap-2 font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                                <RefreshCw className="h-4 w-4" /> Sync Database
                            </Button>
                            <div className="flex flex-col items-end px-3 py-1.5 rounded-xl border border-blue-100 bg-white shadow-sm">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role Aktif</span>
                                <span className={`text-xs font-bold ${isSuperAdmin ? 'text-blue-600' : 'text-amber-600'}`}>
                                    {profile?.role || 'Guest'} ({isSuperAdmin ? 'Super Admin' : 'Workshop Admin'})
                                </span>
                            </div>
                            <Button variant="destructive" size="sm" onClick={handleForceLogout} className="h-10 rounded-xl gap-2 font-bold shadow-md hover:scale-105 transition-all">
                                <LogOut className="h-4 w-4" /> Force Logout
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 mb-4 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
                        {[
                            { key: 'materials' as const, label: 'Materials', icon: Package, count: (materials || []).length },
                            { key: 'products' as const, label: 'Products', icon: Layers, count: (products || []).length },
                            { key: 'collections' as const, label: 'Collections', icon: Database, count: (collections || []).length },
                        ].map(tab => {
                            const IconComp = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setMasterTab(tab.key)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${masterTab === tab.key
                                        ? 'bg-white shadow-sm text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <IconComp className="h-4 w-4" />
                                    {tab.label}
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">{tab.count}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ================ MATERIALS TAB ================ */}
                    {masterTab === 'materials' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Materials ({(materials || []).length})</p>
                                <Button size="sm" onClick={() => { setNewMatForm(true); setEditingMaterial(null); }} className="gap-1.5 h-9">
                                    <Plus className="h-3.5 w-3.5" /> Tambah Material
                                </Button>
                            </div>

                            {/* New / Edit Material Form */}
                            {(newMatForm || editingMaterial) && (
                                <MaterialForm
                                    material={editingMaterial}
                                    materials={materials || []}
                                    onSave={async (data) => {
                                        try {
                                            if (editingMaterial) {
                                                await updateMaterial(editingMaterial.id, data);
                                                setMaterials((materials || []).map(m => m.id === editingMaterial.id ? { ...m, ...data } : m));
                                                toast.success(`Updated '${data.name}'`);
                                            } else {
                                                const newMat = await createMaterial(data);
                                                setMaterials([...(materials || []), newMat]);
                                                toast.success(`Added '${data.name}'`);
                                            }
                                            setNewMatForm(false);
                                            setEditingMaterial(null);
                                        } catch (err: any) {
                                            const msg = err?.message || String(err) || 'Unknown error';
                                            console.error('[onSave material] Error:', err);
                                            toast.error(`Gagal simpan: ${msg}`);
                                            throw err; // Re-throw so form stays showing
                                        }
                                    }}
                                    onCancel={() => { setNewMatForm(false); setEditingMaterial(null); }}
                                />
                            )}

                            {/* Material List */}
                            <div className="space-y-1.5">
                                {(materials || []).map(mat => (
                                    <div key={mat.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_OPTIONS.find(c => c.value === mat.category)?.color || 'bg-gray-100'}`}>
                                            {(mat.category || 'raw').toUpperCase()}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 truncate">{mat?.name || 'Untitled'}</p>
                                            <p className="text-[10px] font-mono text-gray-400">{mat?.sku || '-'} · {mat?.unit || 'pcs'}</p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingMaterial(mat); setNewMatForm(false); }} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-blue-600">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={async () => { 
                                                if (typeof window !== 'undefined' && confirm(`Hapus material '${mat.name}'?\n\nSKU: ${mat.sku}\nKategori: ${mat.category.toUpperCase()}`)) {
                                                    try {
                                                        toast.loading(`Menghapus ${mat.name}...`);
                                                        await deleteMaterialAction(mat.id);
                                                        setMaterials((materials || []).filter(m => m.id !== mat.id)); 
                                                        toast.dismiss();
                                                        toast.success(`Berhasil menghapus '${mat.name}'`); 
                                                    } catch (e: any) {
                                                        toast.dismiss();
                                                        toast.error('Gagal menghapus: ' + e.message);
                                                    }
                                                }
                                            }} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-100">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ================ PRODUCTS TAB ================ */}
                    {masterTab === 'products' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Products ({(products || []).length})</p>
                                <Button size="sm" onClick={() => { setNewProdForm(true); setEditingProduct(null); }} className="gap-1.5 h-9">
                                    <Plus className="h-3.5 w-3.5" /> Tambah Product
                                </Button>
                            </div>

                            {/* New / Edit Product Form */}
                            {(newProdForm || editingProduct) && (
                                <ProductForm
                                    product={editingProduct}
                                    materials={materials || []}
                                    collections={collections || []}
                                    onSave={async (data) => {
                                        try {
                                            const dbProductInput = {
                                                sku: data.sku,
                                                name: data.name,
                                                type: 'watch' as const,
                                                collection: data.collection,
                                                description: data.description,
                                                sale_price: 0,
                                                cost_price: 0,
                                                current_stock: 0,
                                                min_stock_threshold: 5
                                            };

                                            let newId = editingProduct?.id;
                                            
                                            if (editingProduct) {
                                                await updateProduct(editingProduct.id, dbProductInput);
                                                toast.success(`Updated '${data.name}' product details`);
                                            } else {
                                                const newProd = await createProduct(dbProductInput);
                                                newId = newProd.id;
                                                toast.success(`Created '${data.name}'`);
                                            }

                                            if (newId) {
                                                const bomInput = (data.bom || []).map(b => {
                                                    const mat = (materials || []).find(m => m.sku === b.materialSku);
                                                    return {
                                                        materialId: mat ? mat.id : '',
                                                        qty: b.qty
                                                    };
                                                }).filter(b => b.materialId !== '');
                                                
                                                await updateProductBOM(newId, bomInput);
                                                const updatedProds = await getProductsWithBOM();
                                                setProducts(updatedProds || []);
                                            }

                                            setNewProdForm(false);
                                            setEditingProduct(null);
                                        } catch (err: any) {
                                            toast.error('Gagal menyimpan produk: ' + err.message);
                                        }
                                    }}
                                    onCancel={() => { setNewProdForm(false); setEditingProduct(null); }}
                                />
                            )}

                            {/* Product List */}
                            <div className="space-y-2">
                                {(products || []).map(prod => (
                                    <div key={prod.id} className="rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-gray-900 truncate">{prod?.name || 'Untitled'}</p>
                                                <p className="text-[10px] font-mono text-gray-400">{prod?.sku || '-'} · {prod?.collection || ''}</p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {(prod.bom || []).map((comp, idx) => (
                                                        <span key={idx} className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-md">
                                                            {comp.materialName} ×{comp.qty}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <button onClick={() => { setEditingProduct(prod); setNewProdForm(false); }} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-blue-600">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={async () => { 
                                                    if (typeof window !== 'undefined' && confirm(`Hapus produk '${prod.name}'?\n\nSKU: ${prod.sku}`)) {
                                                        try {
                                                            toast.loading(`Menghapus ${prod.name}...`);
                                                            await deleteProduct(prod.id);
                                                            setProducts((products || []).filter(p => p.id !== prod.id));
                                                            toast.dismiss();
                                                            toast.success(`Berhasil menghapus '${prod.name}'`);
                                                        } catch (err: any) {
                                                            toast.dismiss();
                                                            toast.error('Gagal hapus: ' + err.message);
                                                        }
                                                    }
                                                }} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-100">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ================ COLLECTIONS TAB ================ */}
                    {masterTab === 'collections' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Collections ({(collections || []).length})</p>
                                <Button size="sm" onClick={() => { setNewColForm(true); setEditingCollection(null); }} className="gap-1.5 h-9">
                                    <Plus className="h-3.5 w-3.5" /> Tambah Collection
                                </Button>
                            </div>

                            {/* New / Edit Collection Form */}
                            {(newColForm || editingCollection) && (
                                <CollectionForm
                                    collection={editingCollection}
                                    onSave={async (data) => {
                                        try {
                                            if (editingCollection) {
                                                setCollections(prev => (prev || []).map(c => c.id === editingCollection.id ? { ...c, ...data } : c));
                                                toast.success(`Updated '${data.name}' (Local)`);
                                            } else {
                                                const newCol = await createCollectionAction(data as Omit<MasterCollection, 'id'>);
                                                setCollections(prev => [...(prev || []), newCol]);
                                                toast.success(`Added '${data.name}' to database`);
                                            }
                                            setNewColForm(false);
                                            setEditingCollection(null);
                                        } catch (err: any) {
                                            toast.error('Gagal simpan collection: ' + err.message);
                                        }
                                    }}
                                    onCancel={() => { setNewColForm(false); setEditingCollection(null); }}
                                />
                            )}

                            {/* Collection List */}
                            <div className="space-y-1.5">
                                {(collections || []).map(col => (
                                    <div key={col.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                                        <div className={`w-3 h-3 rounded-full bg-${col?.color || 'gray'}-500`} />
                                        <p className="flex-1 font-semibold text-sm text-gray-900">{col?.name || 'Untitled'}</p>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingCollection(col); setNewColForm(false); }} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-blue-600">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={async () => { 
                                                if (typeof window !== 'undefined' && confirm(`Hapus collection '${col.name}'?`)) {
                                                    try {
                                                        await deleteCollectionAction(col.id);
                                                        setCollections(prev => (prev || []).filter(c => c.id !== col.id));
                                                        toast.success(`Deleted '${col.name}'`);
                                                    } catch (err: any) {
                                                        toast.error('Gagal hapus: ' + err.message);
                                                    }
                                                }
                                            }} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-600">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ========================================== */}
            {/* WORKFLOW BUILDER */}
            {/* ========================================== */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Workflow Builder
                        </CardTitle>
                        <Button onClick={createNewBlueprint} size="sm" className="gap-1.5 h-10">
                            <Plus className="h-4 w-4" />
                            Blueprint Baru
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Blueprint List */}
                    <div className="space-y-3 mb-6">
                        {(blueprints || []).map(bp => (
                            <div
                                key={bp.id}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedBpId === bp.id
                                    ? 'border-gray-900 bg-gray-50 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                onClick={() => { setSelectedBpId(bp.id); setEditingBp(null); }}
                            >
                                <div>
                                    <p className="font-bold text-sm">{bp?.name || 'Untitled'}</p>
                                    <p className="text-xs text-gray-500">
                                        {(bp?.stages || []).length} stages · {bp?.productType || 'Belum dikonfigurasi'}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                        {(bp?.stages || []).map(s => (
                                            <span key={s.id} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.color?.bg || 'bg-gray-50'} ${s.color?.text || 'text-gray-700'} ${s.color?.border || 'border-gray-200'} border`}>
                                                {s.emoji} {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); startEdit(bp); }} className="h-10 shrink-0">
                                    Edit
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Blueprint Editor */}
                    {editingBp && (
                        <div className="border-t border-gray-200 pt-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-lg">Editing: {editingBp.name}</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setEditingBp(null)} className="h-10">Cancel</Button>
                                    <Button onClick={saveBlueprint} className="gap-1.5 h-10">
                                        <Save className="h-4 w-4" /> Simpan
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nama Blueprint</Label>
                                    <Input value={editingBp.name || ''} onChange={e => setEditingBp({ ...editingBp, name: e.target.value })} className="h-12" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipe Produk</Label>
                                    <Input value={editingBp.productType || ''} onChange={e => setEditingBp({ ...editingBp, productType: e.target.value })} placeholder="e.g. watch, wallet" className="h-12" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Deskripsi</Label>
                                <Input value={editingBp.description || ''} onChange={e => setEditingBp({ ...editingBp, description: e.target.value })} placeholder="Alur produksi untuk..." className="h-12" />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold">Stages {(editingBp.stages || []).length}</Label>
                                    <Button variant="outline" size="sm" onClick={addStage} className="gap-1.5 h-9">
                                        <Plus className="h-3.5 w-3.5" /> Tambah Stage
                                    </Button>
                                </div>

                                {(editingBp.stages || []).map((stage, idx) => (
                                    <StageEditor
                                        key={stage.id}
                                        stage={stage}
                                        index={idx}
                                        onChange={(updated) => updateStage(idx, updated)}
                                        onRemove={() => removeStage(idx)}
                                        onMoveUp={() => moveStage(idx, 'up')}
                                        onMoveDown={() => moveStage(idx, 'down')}
                                        isFirst={idx === 0}
                                        isLast={idx === (editingBp.stages || []).length - 1}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ============================================
// FORM COMPONENTS
// ============================================

function MaterialForm({
    material,
    materials,
    onSave,
    onCancel,
}: {
    material: MasterMaterial | null;
    materials: MasterMaterial[];
    onSave: (data: Partial<MasterMaterial> & { name: string; sku: string; category: MaterialCategory; unit: string; transformYields?: string[] }) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(material?.name || '');
    const [sku, setSku] = useState(material?.sku || '');
    const [category, setCategory] = useState<MaterialCategory>(material?.category || 'raw');
    const [unit, setUnit] = useState(material?.unit || 'pcs');
    const [description, setDescription] = useState(material?.description || '');
    const [transformYields, setTransformYields] = useState<string[]>(material?.transformYields || []);
    const [isSaving, setIsSaving] = useState(false);

    // Yields should be anything that is NOT a raw material
    const possibleYields = (materials || []).filter(m => m.category !== 'raw' && m.sku !== sku);

    return (
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-blue-700">{material ? 'Edit Material' : 'Material Baru'}</p>
                <button onClick={onCancel} className="p-1 rounded hover:bg-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs">Nama *</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} className="h-10 bg-white" placeholder="e.g. Balok Kayu Jati" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">SKU *</Label>
                    <Input value={sku} onChange={e => setSku(e.target.value)} className="h-10 bg-white" placeholder="e.g. RAW-JATI-001" />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs">Kategori</Label>
                    <div className="flex gap-1">
                        {CATEGORY_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => setCategory(opt.value)} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${category === opt.value ? `${opt.color} border-2 border-gray-800` : 'bg-white border-2 border-transparent'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Unit</Label>
                    <Input value={unit} onChange={e => setUnit(e.target.value)} className="h-10 bg-white" placeholder="pcs" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Deskripsi</Label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} className="h-10 bg-white" placeholder="Opsional" />
                </div>
            </div>

            {/* Transform Yields */}
            <div className="space-y-2 pt-2 border-t border-blue-200/50">
                <Label className="text-xs font-bold uppercase tracking-wider text-blue-800">Target Transformasi (Bisa Jadi Apa Saja?)</Label>
                <p className="text-[10px] text-gray-500">Pilih WIP/Finished Goods yang bisa dihasilkan dari bahan mentah/material ini.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 py-1 max-h-40 overflow-y-auto pr-2">
                    {possibleYields.map(m => {
                        const isSelected = (transformYields || []).includes(m.sku);
                        return (
                            <button
                                key={m.sku}
                                onClick={() => {
                                    if (isSelected) setTransformYields(transformYields.filter(s => s !== m.sku));
                                    else setTransformYields([...(transformYields || []), m.sku]);
                                }}
                                className={`text-left p-2 rounded-lg border text-xs transition-all ${isSelected
                                    ? 'bg-blue-100 border-blue-400 text-blue-800 font-medium'
                                    : 'bg-white border-blue-100 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-1">
                                    <span className="truncate flex-1">{m.name}</span>
                                    {isSelected && <span>✓</span>}
                                </div>
                            </button>
                        );
                    })}
                    {possibleYields.length === 0 && (
                        <p className="text-xs text-blue-600 col-span-3">Belum ada data WIP atau Finished Product.</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={onCancel} className="h-9" disabled={isSaving}>Batal</Button>
                <Button 
                    size="sm" 
                    onClick={async () => { 
                        if (!name.trim()) { toast.error("Nama harus diisi"); return; }
                        if (!sku.trim()) { toast.error("SKU harus diisi"); return; }
                        
                        setIsSaving(true);
                        try {
                            await onSave({ 
                                name: name.trim(), 
                                sku: sku.trim(), 
                                category, 
                                unit: unit.trim() || 'pcs', 
                                description: description.trim(), 
                                transformYields: transformYields.length > 0 ? transformYields : undefined 
                            });
                        } catch (err) {
                            // error is handled in parent toast, just stop loading
                        } finally {
                            setIsSaving(false);
                        }
                    }} 
                    className="h-9 gap-1.5" 
                    disabled={isSaving || !name.trim() || !sku.trim()}
                >
                    {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                </Button>
            </div>
        </div>
    );
}

function ProductForm({
    product,
    materials,
    collections,
    onSave,
    onCancel,
}: {
    product: MasterProduct | null;
    materials: MasterMaterial[];
    collections: MasterCollection[];
    onSave: (data: Partial<MasterProduct> & { name: string; sku: string; collection: string; bom: BOMComponent[] }) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(product?.name || '');
    const [sku, setSku] = useState(product?.sku || '');
    const [collection, setCollection] = useState(product?.collection || '');
    const [description, setDescription] = useState(product?.description || '');
    const [bom, setBom] = useState<BOMComponent[]>(product?.bom || []);

    const addBomRow = () => {
        setBom([...(bom || []), { materialSku: '', materialName: '', qty: 1 }]);
    };

    const updateBomRow = (idx: number, field: keyof BOMComponent, value: string | number) => {
        const updated = [...(bom || [])];
        if (field === 'materialSku') {
            const isDuplicate = (bom || []).some((r, i) => i !== idx && r.materialSku === value);
            if (isDuplicate && value !== '') {
                toast.error('Material ini sudah ada di daftar BOM');
                return;
            }

            const mat = (materials || []).find(m => m.sku === value);
            updated[idx] = { ...updated[idx], materialSku: value as string, materialName: mat?.name || '' };
        } else if (field === 'qty') {
            updated[idx] = { ...updated[idx], qty: value as number };
        }
        setBom(updated);
    };

    const removeBomRow = (idx: number) => {
        setBom((bom || []).filter((_, i) => i !== idx));
    };

    return (
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-emerald-700">{product ? 'Edit Product' : 'Product Baru'}</p>
                <button onClick={onCancel} className="p-1 rounded hover:bg-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs">Nama *</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} className="h-10 bg-white" placeholder="e.g. Hutan Tropis 42mm" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">SKU *</Label>
                    <Input value={sku} onChange={e => setSku(e.target.value)} className="h-10 bg-white" placeholder="e.g. FG-HT42-BLK" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Collection *</Label>
                    <select value={collection} onChange={e => setCollection(e.target.value)} className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm">
                        <option value="">Pilih...</option>
                        {(collections || []).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Deskripsi</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} className="h-10 bg-white" placeholder="Opsional" />
            </div>

            {/* BOM Editor */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-purple-600">Bill of Materials (BOM)</Label>
                    <Button variant="outline" size="sm" onClick={addBomRow} className="h-8 text-xs gap-1">
                        <Plus className="h-3 w-3" /> Komponen
                    </Button>
                </div>
                {(bom || []).length === 0 && (
                    <p className="text-[10px] text-gray-400 text-center py-4">Belum ada komponen. Klik &quot;+ Komponen&quot; untuk menambahkan.</p>
                )}
                {(bom || []).map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-100">
                        <select
                            value={row.materialSku}
                            onChange={e => updateBomRow(idx, 'materialSku', e.target.value)}
                            className="flex-1 h-9 rounded-lg border border-gray-200 px-2 text-sm bg-white"
                        >
                            <option value="">Pilih material...</option>
                            {(materials || []).map(m => <option key={m.id} value={m.sku}>{m.name} ({m.sku})</option>)}
                        </select>
                        <Input
                            type="number"
                            min={1}
                            value={row.qty}
                            onChange={e => updateBomRow(idx, 'qty', parseInt(e.target.value) || 1)}
                            className="w-16 h-9 text-center"
                        />
                        <button onClick={() => removeBomRow(idx)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={onCancel} className="h-9">Batal</Button>
                <Button size="sm" onClick={() => { if (name && sku && collection) onSave({ name, sku, collection, description, bom }); }} className="h-9 gap-1.5" disabled={!name || !sku || !collection}>
                    <Save className="h-3.5 w-3.5" /> Simpan
                </Button>
            </div>
        </div>
    );
}

function CollectionForm({
    collection,
    onSave,
    onCancel,
}: {
    collection: MasterCollection | null;
    onSave: (data: { name: string; color?: string }) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(collection?.name || '');
    const [color, setColor] = useState(collection?.color || '');

    const colorOptions = ['emerald', 'amber', 'indigo', 'sky', 'rose', 'violet', 'teal', 'orange'];

    return (
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-indigo-700">{collection ? 'Edit Collection' : 'Collection Baru'}</p>
                <button onClick={onCancel} className="p-1 rounded hover:bg-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Nama *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="h-10 bg-white" placeholder="e.g. Archipelago" />
            </div>
            <div className="space-y-1">
                <Label className="text-xs">Warna</Label>
                <div className="flex gap-2">
                    {colorOptions.map(c => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-8 h-8 rounded-full bg-${c}-500 transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-800 scale-110' : 'hover:scale-110'}`}
                        />
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={onCancel} className="h-9">Batal</Button>
                <Button size="sm" onClick={() => { if (name) onSave({ name, color }); }} className="h-9 gap-1.5" disabled={!name}>
                    <Save className="h-3.5 w-3.5" /> Simpan
                </Button>
            </div>
        </div>
    );
}
