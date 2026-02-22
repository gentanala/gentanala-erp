'use client';

import { useState } from 'react';
import { ArrowRight, Package } from 'lucide-react';
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

interface MoveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: KanbanItem | null;
    targetStage: WorkflowStage | null;
    onConfirm: (movedQuantity: number) => void;
}

export function MoveDialog({ open, onOpenChange, item, targetStage, onConfirm }: MoveDialogProps) {
    const [movedQuantity, setMovedQuantity] = useState(1);

    // Reset on open
    const handleOpenChange = (o: boolean) => {
        if (o && item) {
            setMovedQuantity(item.quantity);
        }
        onOpenChange(o);
    };

    if (!item || !targetStage) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-blue-600" />
                        Pindah Stage
                    </DialogTitle>
                    <DialogDescription>
                        Pindahkan item ke stage <strong>{targetStage.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <Package className="h-4 w-4 text-blue-700" />
                        <span className="text-sm font-medium text-blue-900">Item Saat Ini</span>
                        <span className="ml-auto text-xs bg-white/50 px-2 py-0.5 rounded text-blue-800 font-mono">
                            {item.sku || 'No SKU'}
                        </span>
                    </div>
                    <p className="text-lg font-bold text-blue-950">{item.name}</p>
                    <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-blue-700/80">Tersedia</span>
                        <span className="font-semibold text-blue-800">{item.quantity} pcs</span>
                    </div>
                </div>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Jumlah yang Dipindah <span className="text-red-500">*</span></Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min={1}
                                max={item.quantity}
                                value={movedQuantity}
                                onChange={(e) => setMovedQuantity(parseInt(e.target.value) || 0)}
                                className="pr-12 text-lg font-medium"
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm pointer-events-none">
                                pcs
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Bisa pindah sebagian. Sisa barang akan tetap di stage asal.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button
                        onClick={() => onConfirm(movedQuantity)}
                        disabled={movedQuantity < 1 || movedQuantity > item.quantity}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Konfirmasi Pindah
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
