'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
    Factory,
    PlayCircle,
    CheckCircle,
    Package,
    Clock,
    AlertCircle,
    ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import type { ProductionRun, ProductionStatus } from '@/lib/database.types';

interface ProductionTableProps {
    runs: ProductionRun[];
    onUpdateStatus?: (run: ProductionRun, newStatus: ProductionStatus) => void;
    onComplete?: (run: ProductionRun) => void;
    onStock?: (run: ProductionRun) => void;
}

const statusConfig: Record<
    ProductionStatus,
    { label: string; color: string; icon: React.ElementType }
> = {
    planned: { label: 'Planned', color: 'bg-slate-100 text-slate-800', icon: Clock },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: PlayCircle },
    qc: { label: 'QC', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
    done: { label: 'Done', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    stocked: { label: 'Stocked', color: 'bg-emerald-100 text-emerald-800', icon: Package },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

const priorityColors: Record<string, string> = {
    normal: 'bg-slate-100 text-slate-600',
    urgent: 'bg-red-100 text-red-700',
};

export function ProductionTable({
    runs,
    onUpdateStatus,
    onComplete,
    onStock,
}: ProductionTableProps) {
    const { isSuperAdmin } = useAuth();

    const getNextStatus = (current: ProductionStatus): ProductionStatus | null => {
        const workflow: Record<ProductionStatus, ProductionStatus | null> = {
            planned: 'in_progress',
            in_progress: 'qc',
            qc: 'done', // handled by onComplete
            done: 'stocked', // handled by onStock
            stocked: null,
            cancelled: null,
        };
        return workflow[current];
    };

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>SPK Number</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {runs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                <Factory className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No production runs found</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        runs.map((run) => {
                            const StatusIcon = statusConfig[run.status].icon;
                            const nextStatus = getNextStatus(run.status);

                            return (
                                <TableRow key={run.id}>
                                    <TableCell className="font-mono text-sm font-medium">{run.spk_number}</TableCell>
                                    <TableCell>
                                        <span className="font-medium">
                                            {/* Product name would come from joined data */}
                                            Product
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-medium">{run.quantity_planned}</span>
                                            {run.quantity_completed > 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    {run.quantity_completed} done
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={priorityColors[run.priority]} variant="secondary">
                                            {run.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusConfig[run.status].color} variant="secondary">
                                            <StatusIcon className="h-3 w-3 mr-1" />
                                            {statusConfig[run.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {run.planned_end_date
                                            ? format(new Date(run.planned_end_date), 'dd MMM yyyy')
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    Actions
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {run.status === 'planned' && (
                                                    <DropdownMenuItem onClick={() => onUpdateStatus?.(run, 'in_progress')}>
                                                        <PlayCircle className="h-4 w-4 mr-2 text-blue-600" />
                                                        Start Production
                                                    </DropdownMenuItem>
                                                )}
                                                {run.status === 'in_progress' && (
                                                    <DropdownMenuItem onClick={() => onUpdateStatus?.(run, 'qc')}>
                                                        <AlertCircle className="h-4 w-4 mr-2 text-purple-600" />
                                                        Send to QC
                                                    </DropdownMenuItem>
                                                )}
                                                {run.status === 'qc' && (
                                                    <DropdownMenuItem onClick={() => onComplete?.(run)}>
                                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                                        Complete QC
                                                    </DropdownMenuItem>
                                                )}
                                                {run.status === 'done' && (
                                                    <DropdownMenuItem onClick={() => onStock?.(run)}>
                                                        <Package className="h-4 w-4 mr-2 text-emerald-600" />
                                                        Add to Stock
                                                    </DropdownMenuItem>
                                                )}
                                                {isSuperAdmin && run.status !== 'cancelled' && run.status !== 'stocked' && (
                                                    <DropdownMenuItem
                                                        onClick={() => onUpdateStatus?.(run, 'cancelled')}
                                                        className="text-destructive"
                                                    >
                                                        Cancel SPK
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
