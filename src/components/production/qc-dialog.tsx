'use client';

import { useState } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { completeProduction } from '@/lib/actions/production';
import type { ProductionRun } from '@/lib/database.types';

interface QCDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    run: ProductionRun | null;
    onSuccess?: () => void;
}

export function QCDialog({ open, onOpenChange, run, onSuccess }: QCDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        quantity_completed: run?.quantity_planned?.toString() || '',
        quantity_rejected: '0',
        qc_notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!run) return;

        const completed = parseInt(formData.quantity_completed) || 0;
        const rejected = parseInt(formData.quantity_rejected) || 0;

        if (completed + rejected > run.quantity_planned) {
            setError('Completed + Rejected cannot exceed planned quantity');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await completeProduction(run.id, completed, rejected, formData.qc_notes || undefined);

            setFormData({
                quantity_completed: '',
                quantity_rejected: '0',
                qc_notes: '',
            });

            onOpenChange(false);
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const completed = parseInt(formData.quantity_completed) || 0;
    const rejected = parseInt(formData.quantity_rejected) || 0;
    const total = completed + rejected;
    const remaining = run ? run.quantity_planned - total : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Complete QC
                    </DialogTitle>
                    <DialogDescription>
                        {run && (
                            <>
                                <span className="font-mono font-medium">{run.spk_number}</span>
                                <br />
                                Planned quantity: <span className="font-medium">{run.quantity_planned}</span>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity_completed">Completed *</Label>
                            <Input
                                id="quantity_completed"
                                type="number"
                                min="0"
                                max={run?.quantity_planned}
                                value={formData.quantity_completed}
                                onChange={(e) => setFormData({ ...formData, quantity_completed: e.target.value })}
                                required
                                disabled={loading}
                                className="text-green-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity_rejected">Rejected</Label>
                            <Input
                                id="quantity_rejected"
                                type="number"
                                min="0"
                                value={formData.quantity_rejected}
                                onChange={(e) => setFormData({ ...formData, quantity_rejected: e.target.value })}
                                disabled={loading}
                                className="text-red-600"
                            />
                        </div>
                    </div>

                    {run && (
                        <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span>Planned:</span>
                                <span className="font-medium">{run.quantity_planned}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Completed:</span>
                                <span className="font-medium">{completed}</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                                <span>Rejected:</span>
                                <span className="font-medium">{rejected}</span>
                            </div>
                            {remaining > 0 && (
                                <div className="flex justify-between text-muted-foreground pt-1 border-t">
                                    <span>Unaccounted:</span>
                                    <span className="font-medium">{remaining}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="qc_notes">QC Notes</Label>
                        <Textarea
                            id="qc_notes"
                            placeholder="Quality issues, defect details, etc."
                            value={formData.qc_notes}
                            onChange={(e) => setFormData({ ...formData, qc_notes: e.target.value })}
                            disabled={loading}
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !run}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Complete QC
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
