'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Package, AlertTriangle, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductTable } from '@/components/inventory/product-table';
import { ProductDialog } from '@/components/inventory/product-dialog';
import { StockMovementDialog } from '@/components/inventory/stock-movement-dialog';
import { useAuth } from '@/contexts/auth-context';
import type { Product } from '@/lib/database.types';
import { MasterCollection, DEMO_COLLECTIONS } from '@/lib/master-data';
import { getProducts, createProduct, updateProduct, getInventoryStats } from '@/lib/actions/inventory';
import { toast } from 'sonner';

export default function InventoryPage() {
    const { isSuperAdmin } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [collections, setCollections] = useState<MasterCollection[]>([]);
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalUnits: 0,
        totalAssetValue: 0,
        lowStockCount: 0
    });

    const handleRefresh = useCallback(async () => {
        setLoading(true);
        try {
            const [data, inventoryStats] = await Promise.all([
                getProducts(),
                getInventoryStats()
            ]);
            setProducts(data);
            setStats(inventoryStats);

            // Load collections (static for now, can be moved to Supabase later)
            setCollections(DEMO_COLLECTIONS);
        } catch (error: any) {
            console.error('Failed to fetch inventory:', error);
            toast.error('Gagal mengambil data inventory');
        } finally {
            setLoading(false);
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);

    // Dialog states
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [stockDialogOpen, setStockDialogOpen] = useState(false);
    const [stockDirection, setStockDirection] = useState<'in' | 'out'>('in');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Stats
    const { totalProducts, totalUnits, totalAssetValue, lowStockCount } = stats;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setProductDialogOpen(true);
    };

    const handleStockIn = (product: Product) => {
        setSelectedProduct(product);
        setStockDirection('in');
        setStockDialogOpen(true);
    };

    const handleStockOut = (product: Product) => {
        setSelectedProduct(product);
        setStockDirection('out');
        setStockDialogOpen(true);
    };

    const handleDelete = (product: Product) => {
        if (confirm(`Are you sure you want to delete ${product.name} (${product.sku})?`)) {
            // In a real app, you'd call deleteProduct(product.id)
            setProducts(products.filter(p => p.id !== product.id));
        }
    };

    const handleBulkDelete = (productIds: string[]) => {
        if (confirm(`Are you sure you want to delete ${productIds.length} selected products?`)) {
            setProducts(products.filter(p => !productIds.includes(p.id)));
        }
    };

    const handleProductSave = async (data: any) => {
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, data);
                toast.success('Produk berhasil diperbarui');
            } else {
                await createProduct(data);
                toast.success('Produk berhasil ditambahkan');
            }
            handleRefresh();
        } catch (error: any) {
            console.error('Failed to save product:', error);
            toast.error(error.message || 'Gagal menyimpan produk');
        }
    };

    const handleProductDialogClose = (open: boolean) => {
        setProductDialogOpen(open);
        if (!open) {
            setEditingProduct(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-muted-foreground">
                        Manage products, stock levels, and inventory movements.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    {isSuperAdmin && (
                        <Button onClick={() => setProductDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Products
                        </CardTitle>
                        <Package className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                        <p className="text-xs text-muted-foreground">Active SKUs</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Units
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUnits}</div>
                        <p className="text-xs text-muted-foreground">In stock</p>
                    </CardContent>
                </Card>

                {isSuperAdmin && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Asset Value
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalAssetValue)}</div>
                            <p className="text-xs text-muted-foreground">Based on HPP</p>
                        </CardContent>
                    </Card>
                )}

                <Card className={lowStockCount > 0 ? 'border-orange-200 bg-orange-50/50' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Low Stock
                        </CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${lowStockCount > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-orange-600' : ''}`}>
                            {lowStockCount}
                        </div>
                        <p className="text-xs text-muted-foreground">Need restock</p>
                    </CardContent>
                </Card>
            </div>

            {/* Product Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <ProductTable
                        products={products}
                        onEdit={handleEdit}
                        onStockIn={handleStockIn}
                        onStockOut={handleStockOut}
                        onDelete={handleDelete}
                        onBulkDelete={handleBulkDelete}
                    />
                </CardContent>
            </Card>

            {/* Dialogs */}
            <ProductDialog
                open={productDialogOpen}
                onOpenChange={handleProductDialogClose}
                product={editingProduct}
                collections={collections}
                onSuccess={handleProductSave}
            />

            <StockMovementDialog
                open={stockDialogOpen}
                onOpenChange={setStockDialogOpen}
                product={selectedProduct}
                direction={stockDirection}
                onSuccess={handleRefresh}
            />
        </div>
    );
}
