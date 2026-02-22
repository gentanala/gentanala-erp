'use client';

import { useState } from 'react';
import { Scissors, ArrowRight, Package } from 'lucide-react';
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
import type { MasterMaterial } from '@/lib/master-data';

interface SplitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: KanbanItem | null;
    targetStage: WorkflowStage | null;
    defaultYield: number;
    materials: MasterMaterial[];
    onConfirm: (consumedCount: number, yieldCount: number, childName: string, childSku: string) => void;
}

export function SplitDialog({ open, onOpenChange, item, targetStage, defaultYield, materials, onConfirm }: SplitDialogProps) {
    const [consumedCount, setConsumedCount] = useState(1);
    const [yieldCount, setYieldCount] = useState(defaultYield);
    const [childName, setChildName] = useState('');
    const [childSku, setChildSku] = useState('');

    const parentMaterial = item?.sku ? materials.find(m => m.sku === item.sku) : undefined;

    // Auto-select list
    const transformOptions = parentMaterial?.transformYields
        ? parentMaterial.transformYields.map(sku => materials.find(m => m.sku === sku)).filter(Boolean) as MasterMaterial[]
        : materials.filter(m => m.category === 'wip' || m.category === 'finished');

    // Reset on open
    const handleOpenChange = (o: boolean) => {
        if (o && item) {
            setConsumedCount(item.quantity);
            setYieldCount(defaultYield);

            // Set first option as default if available
            if (transformOptions.length > 0) {
                setChildName(transformOptions[0].name);
                setChildSku(transformOptions[0].sku);
            } else {
                setChildName(`${item.name} (Processed)`);
                setChildSku(`WIP-${Date.now().toString(36).toUpperCase()}`);
            }
        }
        onOpenChange(o);
    };

    if (!item || !targetStage) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-amber-600" />
                        Split / Transformasi
                    </DialogTitle>
                    <DialogDescription>
                        Pecah 1 item induk menjadi beberapa item anak
                    </DialogDescription>
                </DialogHeader>

                {/* Parent Info */}
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-2xl">
                            🪵
                        </div>
                        <div>
                            <p className="font-bold text-sm text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.sku} · {item.quantity} pcs</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center py-1">
                    <ArrowRight className="h-5 w-5 text-gray-300 rotate-90" />
                </div>

                {/* Output Config */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="consumed">Jumlah Induk yang Diproses</Label>
                        <Input
                            id="consumed"
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={consumedCount}
                            onChange={(e) => setConsumedCount(Math.min(Math.max(1, parseInt(e.target.value) || 1), item.quantity))}
                            className="text-lg font-bold text-center h-12"
                        />
                        <p className="text-xs text-amber-600">Sisa induk di board: {item.quantity - consumedCount} pcs</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="yield">Hasil Pecah (Yield)</Label>
                        <Input
                            id="yield"
                            type="number"
                            min={1}
                            max={100}
                            value={yieldCount}
                            onChange={(e) => setYieldCount(Math.max(1, parseInt(e.target.value) || 1))}
                            className="text-lg font-bold text-center h-12"
                        />
                        <p className="text-xs text-gray-500">{consumedCount} {item.name} → {yieldCount} items</p>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Pilih Target Transformasi
                        </Label>

                        {transformOptions.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                                {transformOptions.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            setChildName(m.name);
                                            setChildSku(m.sku);
                                        }}
                                        className={`text-left p-2.5 rounded-xl border transition-all ${childSku === m.sku
                                                ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600'
                                                : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <p className="text-sm font-bold text-gray-900">{m.name}</p>
                                        <p className="text-xs text-gray-500">{m.sku} • {m.category.toUpperCase()}</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-xs text-red-600">Material ini tidak memiliki target transformasi (Yield) di Master Data.</p>
                            </div>
                        )}

                        {/* Custom Fallback Input */}
                        {!parentMaterial?.transformYields && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Atau Input Manual
                                </Label>
                                <Input
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    placeholder="Nama Item (Custom)"
                                    className="h-10 text-sm"
                                />
                                <Input
                                    value={childSku}
                                    onChange={(e) => setChildSku(e.target.value)}
                                    placeholder="SKU (Custom)"
                                    className="h-10 text-sm"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview */}
                <div className="rounded-xl bg-sky-50 border border-sky-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-2">Preview Hasil</p>
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-sky-500" />
                        <span className="text-sm font-medium text-gray-700">
                            {yieldCount}× {childName || '...'}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                        → Masuk ke stage: {targetStage.name}
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12">
                        Batal
                    </Button>
                    <Button
                        onClick={() => onConfirm(consumedCount, yieldCount, childName, childSku)}
                        className="h-12 gap-2 bg-amber-600 hover:bg-amber-700"
                        disabled={!childName.trim() || consumedCount < 1 || consumedCount > item.quantity}
                    >
                        <Scissors className="h-4 w-4" />
                        Pecah ({yieldCount} items)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
