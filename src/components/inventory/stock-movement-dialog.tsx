'use client';

import { useState } from 'react';
import { Loader2, Plus, Minus } from 'lucide-react';

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createStockMovement } from '@/lib/actions/inventory';
import type { Product, MovementType } from '@/lib/database.types';

interface StockMovementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
    direction: 'in' | 'out';
    onSuccess?: () => void;
}

const reasons = {
    in: [
        { value: 'purchase', label: 'Purchase / Restock' },
        { value: 'return', label: 'Customer Return' },
        { value: 'production', label: 'Production Result' },
        { value: 'adjustment', label: 'Stock Adjustment' },
        { value: 'other', label: 'Other' },
    ],
    out: [
        { value: 'sale', label: 'Sale' },
        { value: 'damage', label: 'Damaged / Defect' },
        { value: 'sample', label: 'Sample / Gift' },
        { value: 'adjustment', label: 'Stock Adjustment' },
        { value: 'other', label: 'Other' },
    ],
};

export function StockMovementDialog({
    open,
    onOpenChange,
    product,
    direction,
    onSuccess,
}: StockMovementDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            setError('Please enter a valid quantity');
            return;
        }

        if (direction === 'out' && qty > product.current_stock) {
            setError(`Cannot remove more than current stock (${product.current_stock})`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const movementType: MovementType = direction === 'in' ? 'in' : 'out';
            const adjustedQuantity = direction === 'in' ? qty : -qty;

            await createStockMovement({
                product_id: product.id,
                type: movementType,
                quantity: adjustedQuantity,
                reason: reason || undefined,
                notes: notes || undefined,
            });

            // Reset form
            setQuantity('');
            setReason('');
            setNotes('');
            onOpenChange(false);
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const Icon = direction === 'in' ? Plus : Minus;
    const iconColor = direction === 'in' ? 'text-green-600' : 'text-orange-600';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                        Stock {direction === 'in' ? 'In' : 'Out'}
                    </DialogTitle>
                    <DialogDescription>
                        {product ? (
                            <>
                                <span className="font-medium">{product.name}</span>
                                <span className="text-muted-foreground"> ({product.sku})</span>
                                <br />
                                Current stock: <span className="font-medium">{product.current_stock}</span>
                            </>
                        ) : (
                            'Select a product'
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            placeholder="Enter quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Select value={reason} onValueChange={setReason} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select reason..." />
                            </SelectTrigger>
                            <SelectContent>
                                {reasons[direction].map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Additional notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={loading}
                            rows={2}
                        />
                    </div>

                    {quantity && !isNaN(parseInt(quantity)) && (
                        <div className="rounded-lg bg-muted p-3 text-sm">
                            <p>
                                New stock:{' '}
                                <span className="font-medium">
                                    {product!.current_stock + (direction === 'in' ? parseInt(quantity) : -parseInt(quantity))}
                                </span>
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !product}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm {direction === 'in' ? 'Stock In' : 'Stock Out'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
