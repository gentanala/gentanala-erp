'use client';

import { useState, useMemo } from 'react';
import { Wrench, Check, Package, AlertCircle, ChevronDown, Search } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { KanbanItem, WorkflowStage } from '@/lib/database.types';
import type { MasterProduct } from '@/lib/master-data';

interface BOMAssemblyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableItems: KanbanItem[];
    products: MasterProduct[];
    targetStage: WorkflowStage | null;
    onConfirm: (assembleQty: number, product: MasterProduct) => void;
}

export function BOMAssemblyDialog({ open, onOpenChange, availableItems, products, targetStage, onConfirm }: BOMAssemblyDialogProps) {
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [productPickerOpen, setProductPickerOpen] = useState(false);
    const [assembleQty, setAssembleQty] = useState(1);

    const selectedProduct = useMemo(() =>
        products.find(p => p.id === selectedProductId) || null,
        [products, selectedProductId]
    );

    // Check BOM availability against a requested assembleQty
    const bomStatus = useMemo(() => {
        if (!selectedProduct) return [];

        return selectedProduct.bom.map(component => {
            // Check if any active item has this component's SKU
            // Get all active items with this SKU
            const availableItemsWithSku = availableItems.filter(
                i => i.sku === component.materialSku && i.status === 'active'
            );
            const totalAvailableQty = availableItemsWithSku.reduce((sum, item) => sum + item.quantity, 0);

            const requiredTotal = component.qty * assembleQty;
            const isAvailable = totalAvailableQty >= requiredTotal;

            return {
                ...component,
                isAvailable,
                requiredTotal,
                availableQty: totalAvailableQty,
                itemName: availableItemsWithSku[0]?.name || component.materialName,
            };
        });
    }, [selectedProduct, availableItems, assembleQty]);

    // Calculate max possible assemblies
    const maxPossibleQty = useMemo(() => {
        if (!selectedProduct) return 0;
        let max = Infinity;
        for (const component of selectedProduct.bom) {
            const availableItemsWithSku = availableItems.filter(
                i => i.sku === component.materialSku && i.status === 'active'
            );
            const totalAvailableQty = availableItemsWithSku.reduce((sum, item) => sum + item.quantity, 0);
            const maxForThisComponent = Math.floor(totalAvailableQty / component.qty);
            if (maxForThisComponent < max) max = maxForThisComponent;
        }
        return max === Infinity ? 0 : max;
    }, [selectedProduct, availableItems]);

    const allComponentsReady = bomStatus.length > 0 && bomStatus.every(c => c.isAvailable);
    const readyCount = bomStatus.filter(c => c.isAvailable).length;

    const filteredProducts = searchQuery
        ? products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : products;

    const handleOpenChange = (o: boolean) => {
        if (o) {
            setSelectedProductId(null);
            setSearchQuery('');
            setProductPickerOpen(false);
            setAssembleQty(1);
        }
        onOpenChange(o);
    };

    const handleConfirm = () => {
        if (!selectedProduct || !allComponentsReady || assembleQty < 1) return;
        onConfirm(assembleQty, selectedProduct);
    };

    if (!targetStage) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-purple-600" />
                        Assembly / Rakit Produk
                    </DialogTitle>
                    <DialogDescription>
                        Pilih SKU produk jadi — sistem cek apakah komponen BOM tersedia
                    </DialogDescription>
                </DialogHeader>

                {/* Step 1: Select product SKU */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        1. Pilih Produk Target
                    </Label>
                    <div className="relative">
                        <button
                            onClick={() => setProductPickerOpen(!productPickerOpen)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${selectedProduct
                                ? 'border-purple-300 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                        >
                            {selectedProduct ? (
                                <div>
                                    <p className="font-bold text-sm text-gray-900">{selectedProduct.name}</p>
                                    <p className="text-[10px] font-mono text-gray-500">{selectedProduct.sku} · {selectedProduct.collection}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">Pilih produk untuk dirakit...</p>
                            )}
                            <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                        </button>

                        {productPickerOpen && (
                            <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-[250px] overflow-hidden">
                                <div className="p-2 border-b border-gray-100">
                                    <div className="relative">
                                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Cari produk..."
                                            className="h-9 pl-9 text-sm"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[180px] overflow-y-auto">
                                    {filteredProducts.length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-6">Tidak ada produk ditemukan</p>
                                    ) : (
                                        filteredProducts.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    setSelectedProductId(p.id);
                                                    setProductPickerOpen(false);
                                                    setSearchQuery('');
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${selectedProductId === p.id ? 'bg-purple-50' : ''
                                                    }`}
                                            >
                                                <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                                                <p className="text-[10px] text-gray-500">{p.sku} · {p.collection} · {p.bom.length} komponen</p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 2: Assemble Quantity */}
                {selectedProduct && (
                    <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                2. Jumlah Rakit (Max: {maxPossibleQty})
                            </Label>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Input
                                    type="number"
                                    min={1}
                                    max={Math.max(1, maxPossibleQty)}
                                    value={assembleQty}
                                    onChange={e => setAssembleQty(parseInt(e.target.value) || 0)}
                                    className="pr-12 text-lg font-medium"
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm pointer-events-none">
                                    pcs
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="shrink-0"
                                onClick={() => setAssembleQty(maxPossibleQty)}
                                disabled={maxPossibleQty === 0}
                            >
                                Max
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: BOM Checklist */}
                {selectedProduct && (
                    <div className="space-y-2 mt-4">
                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            3. Kebutuhan Komponen ({readyCount}/{bomStatus.length} ready)
                        </Label>
                        <div className="space-y-1.5 rounded-xl border border-gray-200 p-2">
                            {bomStatus.map((component, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${component.isAvailable
                                        ? 'bg-emerald-50 border border-emerald-200'
                                        : 'bg-red-50 border border-red-200'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${component.isAvailable
                                        ? 'bg-emerald-500'
                                        : 'bg-red-400'
                                        }`}>
                                        {component.isAvailable
                                            ? <Check className="h-4 w-4 text-white" />
                                            : <AlertCircle className="h-4 w-4 text-white" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${component.isAvailable ? 'text-gray-900' : 'text-red-700'}`}>
                                            {component.materialName} <span className="text-xs font-normal text-gray-500">({component.qty}x per unit)</span>
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            Butuh total: <strong className="text-gray-900">{component.requiredTotal} pcs</strong>
                                            <span className={`ml-1 ${component.isAvailable ? 'text-emerald-600' : 'text-red-600'}`}>
                                                (Tersedia: {component.availableQty})
                                            </span>
                                        </p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${component.isAvailable
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}>
                                        {component.isAvailable ? 'Cukup' : 'Kurang'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary */}
                {selectedProduct && (
                    <div className={`rounded-xl p-3 border ${allComponentsReady
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-gray-50 border-gray-200'
                        }`}>
                        {allComponentsReady ? (
                            <>
                                <p className="text-xs text-purple-700 font-bold">
                                    ✅ Semua komponen tersedia!
                                </p>
                                <p className="text-[10px] text-purple-500 mt-1">
                                    {bomStatus.map(c => c.materialName).join(' + ')} → <strong>{selectedProduct.name}</strong>
                                </p>
                                <p className="text-[10px] text-purple-500">
                                    → Masuk ke: {targetStage.name}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-xs text-red-700 font-bold">
                                    ❌ Komponen belum lengkap — tidak bisa assembly
                                </p>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Pastikan semua material yang dibutuhkan tersedia di papan produksi
                                </p>
                            </>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12">
                        Batal
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="h-12 gap-2 bg-purple-600 hover:bg-purple-700"
                        disabled={!allComponentsReady || assembleQty < 1}
                    >
                        <Wrench className="h-4 w-4" />
                        Rakit {assembleQty} Unit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
