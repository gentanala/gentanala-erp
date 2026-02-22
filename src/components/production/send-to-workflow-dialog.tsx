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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { KanbanItem, WorkflowBlueprint, WorkflowStage } from '@/lib/database.types';

interface SendToWorkflowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: KanbanItem | null;
    blueprints: WorkflowBlueprint[];
    currentBlueprintId: string;
    onConfirm: (targetStageId: string, movedQuantity: number) => void;
}

export function SendToWorkflowDialog({
    open,
    onOpenChange,
    item,
    blueprints,
    currentBlueprintId,
    onConfirm
}: SendToWorkflowDialogProps) {
    const [movedQuantity, setMovedQuantity] = useState(1);
    const [targetWorkflowId, setTargetWorkflowId] = useState<string>('');
    const [targetStageId, setTargetStageId] = useState<string>('');

    // Reset on open
    const handleOpenChange = (o: boolean) => {
        if (o && item) {
            setMovedQuantity(item.quantity);
            setTargetWorkflowId('');
            setTargetStageId('');
        }
        onOpenChange(o);
    };

    if (!item) return null;

    const availableBlueprints = blueprints.filter(bp => bp.id !== currentBlueprintId);
    const selectedWorkflow = blueprints.find(bp => bp.id === targetWorkflowId);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-indigo-600" />
                        Kirim ke Workflow Lain
                    </DialogTitle>
                    <DialogDescription>
                        Kirim item ini ke tahap produksi di workflow lain. Sering digunakan untuk sub-assembly atau bahan jadi.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <Package className="h-4 w-4 text-indigo-700" />
                        <span className="text-sm font-medium text-indigo-900">Item Saat Ini</span>
                        {item.sku && (
                            <span className="ml-auto text-xs bg-white/50 px-2 py-0.5 rounded text-indigo-800 font-mono">
                                {item.sku}
                            </span>
                        )}
                    </div>
                    <p className="text-lg font-bold text-indigo-950">{item.name}</p>
                    <div className="mt-1 flex items-center justify-between text-sm">
                        <span className="text-indigo-700/80">Tersedia</span>
                        <span className="font-semibold text-indigo-800">{item.quantity} pcs</span>
                    </div>
                </div>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Pilih Tujuan Workflow <span className="text-red-500">*</span></Label>
                        <Select value={targetWorkflowId} onValueChange={(val) => {
                            setTargetWorkflowId(val);
                            setTargetStageId('');
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="-- Pilih Workflow --" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableBlueprints.map(bp => (
                                    <SelectItem key={bp.id} value={bp.id}>
                                        {bp.name}
                                    </SelectItem>
                                ))}
                                {availableBlueprints.length === 0 && (
                                    <SelectItem value="none" disabled>Tidak ada workflow lain</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedWorkflow && (
                        <div className="grid gap-2">
                            <Label>Pilih Stage Tujuan <span className="text-red-500">*</span></Label>
                            <Select value={targetStageId} onValueChange={setTargetStageId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="-- Pilih Stage --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedWorkflow.stages.map(stage => (
                                        <SelectItem key={stage.id} value={stage.id}>
                                            {stage.emoji} {stage.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label>Jumlah yang Dikirim <span className="text-red-500">*</span></Label>
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
                            Bisa dikirim sebagian.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button
                        onClick={() => onConfirm(targetStageId, movedQuantity)}
                        disabled={movedQuantity < 1 || movedQuantity > item.quantity || !targetStageId}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        Konfirmasi Kirim
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
