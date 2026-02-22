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

// Demo data - will be replaced with Supabase data
const demoProducts: Product[] = [
    {
        id: '1',
        sku: 'WTC-HT42-BLK',
        name: 'Hutan Tropis 42mm',
        description: 'Wooden watch with tropical forest design',
        type: 'watch',
        collection: 'Hutan Tropis',
        variant: 'Black',
        sale_price: 330000,
        cost_price: 145000,
        current_stock: 12,
        min_stock_threshold: 5,
        image_urls: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
    },
    {
        id: '2',
        sku: 'WTC-HT38-BRN',
        name: 'Hutan Tropis 38mm',
        description: 'Wooden watch with tropical forest design',
        type: 'watch',
        collection: 'Hutan Tropis',
        variant: 'Brown',
        sale_price: 310000,
        cost_price: 135000,
        current_stock: 3,
        min_stock_threshold: 5,
        image_urls: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
    },
    {
        id: '3',
        sku: 'WTC-KL42-NAT',
        name: 'Kaliandra 42mm',
        description: 'Elegant wooden watch',
        type: 'watch',
        collection: 'Kaliandra',
        variant: 'Natural',
        sale_price: 350000,
        cost_price: 155000,
        current_stock: 8,
        min_stock_threshold: 5,
        image_urls: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
    },
    {
        id: '4',
        sku: 'CHD-MN-BLK',
        name: 'Monokrom Card Holder',
        description: 'Minimalist card holder',
        type: 'card_holder',
        collection: 'Monokrom',
        variant: 'Black',
        sale_price: 120000,
        cost_price: 45000,
        current_stock: 1,
        min_stock_threshold: 10,
        image_urls: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
    },
    {
        id: '5',
        sku: 'PHC-HT-BLK',
        name: 'Hutan Tropis Phone Case',
        description: 'Wooden phone case with forest pattern',
        type: 'phone_case',
        collection: 'Hutan Tropis',
        variant: 'iPhone 15',
        sale_price: 180000,
        cost_price: 65000,
        current_stock: 15,
        min_stock_threshold: 5,
        image_urls: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
    },
];

export default function InventoryPage() {
    const { isSuperAdmin } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
        try {
            const savedProducts = localStorage.getItem('gentanala_inventory_products');
            let baseProducts: Product[] = savedProducts ? JSON.parse(savedProducts) : demoProducts;

            // Load materials as well so they appear in inventory
            const savedMats = localStorage.getItem('gentanala_master_materials');
            if (savedMats) {
                const materials = JSON.parse(savedMats);
                const materialProducts: Product[] = materials.map((m: any) => ({
                    id: m.id,
                    sku: m.sku,
                    name: m.name,
                    description: m.description || '',
                    type: m.category === 'wip' ? 'wip' : 'raw_material',
                    collection: null,
                    variant: null,
                    sale_price: 0,
                    cost_price: 0,
                    current_stock: m.stock || 0,
                    min_stock_threshold: 5,
                    image_urls: [],
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: null
                }));

                // Merge without duplicating SKUs (assuming we don't save materials to inventory array normally)
                const existingSkus = new Set(baseProducts.map(p => p.sku));
                const newProductsToAdd = materialProducts.filter(mp => !existingSkus.has(mp.sku));

                baseProducts = [...baseProducts, ...newProductsToAdd];
            }

            setProducts(baseProducts);
            if (!savedProducts) {
                localStorage.setItem('gentanala_inventory_products', JSON.stringify(demoProducts));
            }
        } catch (e) {
            setProducts(demoProducts);
        }
    }, []);

    useEffect(() => {
        if (isLoaded) {
            // Only save actual finished goods / watch accessories back to main array to avoid dirtying
            // the main inventory array with raw materials that should live in master materials.
            // But since this is a unified view, we'll save it all and keep it synced.
            localStorage.setItem('gentanala_inventory_products', JSON.stringify(products));
        }
    }, [products, isLoaded]);

    // Dialog states
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [stockDialogOpen, setStockDialogOpen] = useState(false);
    const [stockDirection, setStockDirection] = useState<'in' | 'out'>('in');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Stats
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + p.current_stock, 0);
    const totalAssetValue = products.reduce((sum, p) => sum + p.current_stock * p.cost_price, 0);
    const lowStockCount = products.filter((p) => p.current_stock < p.min_stock_threshold).length;

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
            setProducts(products.filter(p => p.id !== product.id));
        }
    };

    const handleBulkDelete = (productIds: string[]) => {
        if (confirm(`Are you sure you want to delete ${productIds.length} selected products?`)) {
            setProducts(products.filter(p => !productIds.includes(p.id)));
        }
    };

    const handleProductSave = (data: any) => {
        let updatedProducts = [...products];
        let pId = editingProduct?.id;

        if (editingProduct) {
            updatedProducts = updatedProducts.map(p =>
                p.id === editingProduct.id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
            );
        } else {
            pId = Math.random().toString(36).substr(2, 9);
            const newProduct = {
                id: pId,
                ...data,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: null,
            };
            updatedProducts.push(newProduct);
        }

        setProducts(updatedProducts);

        // SYNC WITH MASTER DATA
        try {
            if (data.type === 'raw_material' || data.type === 'wip') {
                const isWip = data.type === 'wip';
                const savedMat = localStorage.getItem('gentanala_master_materials');
                let masterMats = savedMat ? JSON.parse(savedMat) : [];

                if (editingProduct) {
                    masterMats = masterMats.map((mm: any) =>
                        mm.id === editingProduct.id || mm.sku === editingProduct.sku
                            ? { ...mm, name: data.name, sku: data.sku, description: data.description, category: isWip ? 'wip' : 'raw' }
                            : mm
                    );
                } else {
                    masterMats.push({
                        id: pId,
                        name: data.name,
                        sku: data.sku,
                        category: isWip ? 'wip' : 'raw',
                        unit: 'pcs',
                        description: data.description || ''
                    });
                }
                localStorage.setItem('gentanala_master_materials', JSON.stringify(masterMats));
            } else {
                const savedMaster = localStorage.getItem('gentanala_master_products');
                let masterProducts = savedMaster ? JSON.parse(savedMaster) : [];

                if (editingProduct) {
                    masterProducts = masterProducts.map((mp: any) =>
                        mp.id === editingProduct.id || mp.sku === editingProduct.sku
                            ? { ...mp, name: data.name, sku: data.sku, collection: data.collection, description: data.description }
                            : mp
                    );
                } else {
                    masterProducts.push({
                        id: pId,
                        name: data.name,
                        sku: data.sku,
                        collection: data.collection,
                        description: data.description,
                        bom: [] // Default empty BOM for new products
                    });
                }
                localStorage.setItem('gentanala_master_products', JSON.stringify(masterProducts));
            }
        } catch (e) {
            console.error("Gagal sinkronisasi ke Master Data", e);
        }

        handleRefresh();
    };

    const handleProductDialogClose = (open: boolean) => {
        setProductDialogOpen(open);
        if (!open) {
            setEditingProduct(null);
        }
    };

    const handleRefresh = () => {
        // Will reload from Supabase when connected
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
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
