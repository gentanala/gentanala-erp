import React, { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wrench, ArrowRight } from 'lucide-react';
import type { KanbanItem } from '@/lib/database.types';
import type { MasterProduct } from '@/lib/master-data';

export interface AssemblyAllocationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    draggedItem: KanbanItem | null;
    products: MasterProduct[];
    onConfirm: (quantity: number, product: MasterProduct) => void;
}

export function AssemblyAllocationDialog({ open, onOpenChange, draggedItem, products, onConfirm }: AssemblyAllocationDialogProps) {
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [allocateQty, setAllocateQty] = useState(1);

    // Only show products that have the dragged item's SKU in their BOM
    const compatibleProducts = useMemo(() => {
        if (!draggedItem || !draggedItem.sku) return [];
        return products.filter(p => p.bom.some(b => b.materialSku === draggedItem.sku));
    }, [draggedItem, products]);

    // Reset state when opening/closing or when item changes
    useEffect(() => {
        if (open && compatibleProducts.length > 0) {
            // Auto-select the first compatible product
            setSelectedProductId(compatibleProducts[0].id);
            setAllocateQty(draggedItem?.quantity ? Math.min(1, draggedItem.quantity) : 1);
        } else if (!open) {
            setSelectedProductId(null);
            setAllocateQty(1);
        }
    }, [open, compatibleProducts, draggedItem]);

    const P = compatibleProducts.find(p => p.id === selectedProductId);

    const handleConfirm = () => {
        if (!P || allocateQty < 1 || allocateQty > (draggedItem?.quantity || 0)) return;
        onConfirm(allocateQty, P);
        onOpenChange(false);
    };

    if (!draggedItem) return null;

    if (compatibleProducts.length === 0) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Tidak dapat dialokasikan</DialogTitle>
                        <DialogDescription className="text-red-600 mt-2">
                            Item <strong>{draggedItem.name}</strong> tidak ditemukan di BOM (Bill of Materials) produk apapun. Item ini tidak bisa dirakit.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                            <Wrench className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Alokasi Perakitan</DialogTitle>
                            <DialogDescription className="mt-1">
                                Mau dirakit jadi produk apa?
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                    {/* Component Info */}
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{draggedItem.name}</p>
                            <p className="text-xs text-gray-500">Jumlah terbawa: {draggedItem.quantity} pcs</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Target Produk (Pilih Salah Satu)
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                            {compatibleProducts.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedProductId(p.id)}
                                    className={`text-left p-3 rounded-xl border transition-all ${selectedProductId === p.id
                                            ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600'
                                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                                    <p className="text-xs text-gray-500">{p.sku} • {p.collection || 'No Collection'}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity Allocation */}
                    {P && (
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Jumlah Part yang Dimasukkan
                            </Label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={draggedItem.quantity}
                                        value={allocateQty}
                                        onChange={e => setAllocateQty(parseInt(e.target.value) || 0)}
                                        className="pr-12 text-lg font-medium h-12"
                                    />
                                    <div className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm pointer-events-none">
                                        pcs
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="shrink-0 h-12"
                                    onClick={() => setAllocateQty(draggedItem.quantity)}
                                >
                                    Max
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-6 pt-4 border-t border-gray-100">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11">
                        Batal
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="h-11 gap-2 bg-purple-600 hover:bg-purple-700"
                        disabled={!P || allocateQty < 1 || allocateQty > draggedItem.quantity}
                    >
                        Masuk Meja Rakit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
