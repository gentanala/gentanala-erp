'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

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
import { createProduct, updateProduct } from '@/lib/actions/inventory';
import type { Product, ProductType } from '@/lib/database.types';

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
    onSuccess?: (data: any) => void;
}

export function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
    const isEdit = !!product;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        sku: product?.sku || '',
        name: product?.name || '',
        type: (product?.type || 'watch') as ProductType,
        description: product?.description || '',
        collection: product?.collection || '',
        variant: product?.variant || '',
        sale_price: product?.sale_price?.toString() || '',
        cost_price: product?.cost_price?.toString() || '',
        current_stock: product?.current_stock?.toString() || '0',
        min_stock_threshold: product?.min_stock_threshold?.toString() || '5',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = {
                sku: formData.sku,
                name: formData.name,
                type: formData.type,
                description: formData.description || undefined,
                collection: formData.collection || undefined,
                variant: formData.variant || undefined,
                sale_price: parseFloat(formData.sale_price) || 0,
                cost_price: parseFloat(formData.cost_price) || 0,
                current_stock: parseInt(formData.current_stock) || 0,
                min_stock_threshold: parseInt(formData.min_stock_threshold) || 5,
            };

            onOpenChange(false);
            onSuccess?.(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update product details below.' : 'Fill in the product details below.'}
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
                            <Label htmlFor="sku">SKU *</Label>
                            <Input
                                id="sku"
                                placeholder="WTC-HT42-BLK"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type *</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: ProductType) => setFormData({ ...formData, type: value })}
                                disabled={loading}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="watch">Watch</SelectItem>
                                    <SelectItem value="card_holder">Card Holder</SelectItem>
                                    <SelectItem value="phone_case">Phone Case</SelectItem>
                                    <SelectItem value="accessory">Accessory</SelectItem>
                                    <SelectItem value="raw_material">Raw Material</SelectItem>
                                    <SelectItem value="wip">WIP (Setengah Jadi)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                            id="name"
                            placeholder="Hutan Tropis 42mm"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="collection">Collection</Label>
                            <Input
                                id="collection"
                                placeholder="Hutan Tropis"
                                value={formData.collection}
                                onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="variant">Variant</Label>
                            <Input
                                id="variant"
                                placeholder="Black / 42mm"
                                value={formData.variant}
                                onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Product description..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            disabled={loading}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sale_price">Sale Price (Rp) *</Label>
                            <Input
                                id="sale_price"
                                type="number"
                                placeholder="330000"
                                value={formData.sale_price}
                                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost_price">HPP / Cost (Rp) *</Label>
                            <Input
                                id="cost_price"
                                type="number"
                                placeholder="150000"
                                value={formData.cost_price}
                                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="current_stock">Initial Stock</Label>
                            <Input
                                id="current_stock"
                                type="number"
                                placeholder="0"
                                value={formData.current_stock}
                                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                                disabled={loading || isEdit}
                            />
                            {isEdit && (
                                <p className="text-xs text-muted-foreground">Use Stock In/Out to adjust</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="min_stock_threshold">Min. Threshold</Label>
                            <Input
                                id="min_stock_threshold"
                                type="number"
                                placeholder="5"
                                value={formData.min_stock_threshold}
                                onChange={(e) => setFormData({ ...formData, min_stock_threshold: e.target.value })}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Save Changes' : 'Create Product'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
