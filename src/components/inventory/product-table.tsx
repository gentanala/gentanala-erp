'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Plus, Minus, Edit, Eye, Search, Filter, AlertTriangle, Trash2, CheckSquare, Square, ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import type { Product, ProductType } from '@/lib/database.types';

interface ProductTableProps {
    products: Product[];
    onEdit?: (product: Product) => void;
    onStockIn?: (product: Product) => void;
    onStockOut?: (product: Product) => void;
    onDelete?: (product: Product) => void;
    onBulkDelete?: (productIds: string[]) => void;
}

const productTypeLabels: Record<string, string> = {
    watch: 'Watch',
    card_holder: 'Card Holder',
    phone_case: 'Phone Case',
    accessory: 'Accessory',
    raw_material: 'Raw Material',
    wip: 'WIP (Setengah Jadi)'
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
};

export function ProductTable({ products, onEdit, onStockIn, onStockOut, onDelete, onBulkDelete }: ProductTableProps) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('name_asc');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const { isSuperAdmin } = useAuth();
    const router = useRouter();

    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.sku.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'all' || product.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const isLowStock = (product: Product) => {
        return product.current_stock < product.min_stock_threshold;
    };

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'name_asc': return a.name.localeCompare(b.name);
            case 'name_desc': return b.name.localeCompare(a.name);
            case 'stock_asc': return a.current_stock - b.current_stock;
            case 'stock_desc': return b.current_stock - a.current_stock;
            case 'price_asc': return a.sale_price - b.sale_price;
            case 'price_desc': return b.sale_price - a.sale_price;
            default: return 0;
        }
    });

    const toggleSelectAll = () => {
        if (selectedIds.length === sortedProducts.length && sortedProducts.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(sortedProducts.map(p => p.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (onBulkDelete && selectedIds.length > 0) {
            onBulkDelete(selectedIds);
            setSelectedIds([]); // Clear selection after deletion
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && isSuperAdmin && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="whitespace-nowrap h-9"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete ({selectedIds.length})
                        </Button>
                    )}

                    {/* Filter Type */}
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[140px] h-9">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="watch">Watch</SelectItem>
                            <SelectItem value="card_holder">Card Holder</SelectItem>
                            <SelectItem value="phone_case">Phone Case</SelectItem>
                            <SelectItem value="accessory">Accessory</SelectItem>
                            <SelectItem value="raw_material">Raw Material</SelectItem>
                            <SelectItem value="wip">WIP (Setengah Jadi)</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort By */}
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[160px] h-9">
                            <ArrowUpDown className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                            <SelectItem value="stock_asc">Stock (Low - High)</SelectItem>
                            <SelectItem value="stock_desc">Stock (High - Low)</SelectItem>
                            <SelectItem value="price_asc">Price (Low - High)</SelectItem>
                            <SelectItem value="price_desc">Price (High - Low)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {isSuperAdmin && (
                                <TableHead className="w-[40px] text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer align-middle"
                                        checked={sortedProducts.length > 0 && selectedIds.length === sortedProducts.length}
                                        onChange={toggleSelectAll}
                                        title="Select All"
                                    />
                                </TableHead>
                            )}
                            <TableHead>SKU</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-center">Stock</TableHead>
                            <TableHead className="text-right">Sale Price</TableHead>
                            {isSuperAdmin && <TableHead className="text-right">HPP</TableHead>}
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isSuperAdmin ? 8 : 6} className="text-center py-8 text-muted-foreground">
                                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No products found</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedProducts.map((product) => (
                                <TableRow key={product.id} className={selectedIds.includes(product.id) ? 'bg-blue-50/50' : ''}>
                                    {isSuperAdmin && (
                                        <TableCell className="text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer align-middle"
                                                checked={selectedIds.includes(product.id)}
                                                onChange={() => toggleSelect(product.id)}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{product.name}</p>
                                            {product.collection && (
                                                <p className="text-xs text-muted-foreground">{product.collection}</p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{productTypeLabels[product.type] || product.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={isLowStock(product) ? 'text-destructive font-medium' : ''}>
                                                {product.current_stock}
                                            </span>
                                            {isLowStock(product) && (
                                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(product.sale_price)}</TableCell>
                                    {isSuperAdmin && (
                                        <TableCell className="text-right text-muted-foreground">
                                            {formatCurrency(product.cost_price)}
                                        </TableCell>
                                    )}
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onStockIn?.(product)}
                                                title="Stock In"
                                            >
                                                <Plus className="h-4 w-4 text-green-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onStockOut?.(product)}
                                                title="Stock Out"
                                            >
                                                <Minus className="h-4 w-4 text-orange-600" />
                                            </Button>
                                            {isSuperAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onEdit?.(product)}
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => alert(`Coming Soon: Detail for ${product.name}`)}
                                                title="View Details (Coming Soon)"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {isSuperAdmin && onDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onDelete(product)}
                                                    title="Delete"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>Showing {sortedProducts.length} of {products.length} products</p>
                {isSuperAdmin && (
                    <p>
                        Total Asset Value:{' '}
                        <span className="font-medium text-foreground">
                            {formatCurrency(sortedProducts.reduce((sum, p) => sum + p.current_stock * p.cost_price, 0))}
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
}
