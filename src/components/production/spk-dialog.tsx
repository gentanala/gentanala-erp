'use client';

import { useState, useEffect } from 'react';
import { Loader2, Calendar } from 'lucide-react';

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
import { createProductionRun, getProductsForSPK } from '@/lib/actions/production';
import type { PriorityLevel, Product } from '@/lib/database.types';

interface SPKDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    preselectedProductId?: string;
}

type ProductOption = Pick<Product, 'id' | 'sku' | 'name' | 'current_stock' | 'min_stock_threshold'>;

export function SPKDialog({ open, onOpenChange, onSuccess, preselectedProductId }: SPKDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const [formData, setFormData] = useState({
        product_id: preselectedProductId || '',
        quantity_planned: '',
        priority: 'normal' as PriorityLevel,
        planned_end_date: '',
        production_notes: '',
    });

    useEffect(() => {
        if (open) {
            setLoadingProducts(true);
            getProductsForSPK()
                .then(setProducts)
                .catch(console.error)
                .finally(() => setLoadingProducts(false));
        }
    }, [open]);

    useEffect(() => {
        if (preselectedProductId) {
            setFormData((prev) => ({ ...prev, product_id: preselectedProductId }));
        }
    }, [preselectedProductId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createProductionRun({
                product_id: formData.product_id,
                quantity_planned: parseInt(formData.quantity_planned) || 0,
                priority: formData.priority,
                planned_end_date: formData.planned_end_date || undefined,
                production_notes: formData.production_notes || undefined,
            });

            // Reset form
            setFormData({
                product_id: '',
                quantity_planned: '',
                priority: 'normal',
                planned_end_date: '',
                production_notes: '',
            });

            onOpenChange(false);
            onSuccess?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const selectedProduct = products.find((p) => p.id === formData.product_id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Create Production Order (SPK)</DialogTitle>
                    <DialogDescription>
                        Create a new work order for production. An SPK number will be generated automatically.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="product_id">Product *</Label>
                        {loadingProducts ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading products...
                            </div>
                        ) : (
                            <Select
                                value={formData.product_id}
                                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a product..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                            <span className="font-mono text-xs mr-2">{product.sku}</span>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {selectedProduct && (
                            <p className="text-xs text-muted-foreground">
                                Current stock: <span className="font-medium">{selectedProduct.current_stock}</span>{' '}
                                (min: {selectedProduct.min_stock_threshold})
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity_planned">Quantity *</Label>
                            <Input
                                id="quantity_planned"
                                type="number"
                                min="1"
                                placeholder="10"
                                value={formData.quantity_planned}
                                onChange={(e) => setFormData({ ...formData, quantity_planned: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value: PriorityLevel) =>
                                    setFormData({ ...formData, priority: value })
                                }
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="planned_end_date">Due Date</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="planned_end_date"
                                type="date"
                                value={formData.planned_end_date}
                                onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                                disabled={loading}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="production_notes">Notes</Label>
                        <Textarea
                            id="production_notes"
                            placeholder="Special instructions, material requirements, etc."
                            value={formData.production_notes}
                            onChange={(e) => setFormData({ ...formData, production_notes: e.target.value })}
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
                        <Button type="submit" disabled={loading || !formData.product_id}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create SPK
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
