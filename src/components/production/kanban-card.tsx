'use client';

import React, { memo } from 'react';
import { GripVertical, Package, MoreVertical, Pencil, Trash2, Wrench, ArrowRight } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { KanbanItem, WorkflowStage } from '@/lib/database.types';
import type { MasterProduct } from '@/lib/master-data';

interface KanbanCardProps {
    item: KanbanItem;
    stage: WorkflowStage;
    products: MasterProduct[];
    onDragStart: (e: React.DragEvent, itemId: string) => void;
    onEdit?: (item: KanbanItem) => void;
    onDelete?: (item: KanbanItem) => void;
    onReject?: (item: KanbanItem) => void;
    onSendToWorkflow?: (item: KanbanItem) => void;
    onAllocate?: (item: KanbanItem) => void;
}

const KanbanCardComponent = ({ item, stage, products, onDragStart, onEdit, onDelete, onReject, onSendToWorkflow, onAllocate }: KanbanCardProps) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, item.id)}
            className={`group relative cursor-grab active:cursor-grabbing rounded-lg border bg-white p-2 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:shadow-sm ${stage.color.border}`}
        >
            <div className="flex items-center gap-2">
                {/* Drag handle - extremely small and subtle */}
                <GripVertical className="h-3.5 w-3.5 text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                
                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    {/* Emoji + Name */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {(item.emoji || stage.emoji) && <span className="text-xs shrink-0">{item.emoji || stage.emoji}</span>}
                        <p className="font-bold text-[11px] text-gray-800 leading-tight">
                            {item.name}
                        </p>
                    </div>

                    {/* Quantity - Inline and Bold */}
                    <div className="shrink-0 flex items-center bg-gray-50/50 px-1.5 py-0.5 rounded border border-gray-100/50">
                        <span className="text-[10px] font-black text-gray-700">{item.quantity}</span>
                        <span className="text-[8px] font-bold text-gray-400 ml-0.5 uppercase">pcs</span>
                    </div>
                </div>

                {/* Three-dot menu - very compact */}
                {(onEdit || onDelete || onSendToWorkflow || (onAllocate && stage.logicType === 'merge' && !item.metadata?.targetBomSku)) && (
                    <div className="relative shrink-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500"
                                >
                                    <MoreVertical className="h-3 w-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] rounded-xl shadow-xl">
                                {onAllocate && stage.logicType === 'merge' && !item.metadata?.targetBomSku && (
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); onAllocate(item); }}
                                        className="gap-2.5 text-sm cursor-pointer text-purple-700"
                                    >
                                        <Wrench className="h-3.5 w-3.5" />
                                        Alokasikan ke Rakitan
                                    </DropdownMenuItem>
                                )}
                                {onSendToWorkflow && (
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); onSendToWorkflow(item); }}
                                        className="gap-2.5 text-sm cursor-pointer text-indigo-700"
                                    >
                                        <ArrowRight className="h-3.5 w-3.5" />
                                        Kirim ke Flow Lain
                                    </DropdownMenuItem>
                                )}
                                {onEdit && (
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                        className="gap-2.5 text-sm cursor-pointer text-gray-700"
                                    >
                                        <Pencil className="h-3.5 w-3.5 text-blue-500" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {onReject && (
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); onReject(item); }}
                                        className="gap-2.5 text-sm cursor-pointer text-orange-600 font-bold"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Tandai Gagal
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                        className="gap-2.5 text-sm cursor-pointer text-red-600"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Hapus
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* Complex Content (Split/Assembly) - Stays minimal unless opened */}
            {item.metadata?.bomProgress && (
                <div className="mt-1 border-t border-gray-100 pt-1">
                    <AssembleProgress 
                        item={item} 
                        product={products.find(p => p.sku === item.metadata?.targetBomSku)} 
                    />
                </div>
            )}
            
            {item.mergedFrom.length > 0 && (
                <p className="text-[8px] font-bold text-indigo-400 mt-1 pl-5 uppercase tracking-tighter">
                   ⚡ {item.mergedFrom.length} Items Merged
                </p>
            )}

            {item.parentId && !item.metadata?.bomProgress && !item.mergedFrom.length && (
                <p className="text-[7px] text-amber-500 mt-1 pl-5 opacity-60 font-bold uppercase">
                    ✂️ Form Split
                </p>
            )}
        </div>
    );
};

const AssembleProgress = ({ item, product }: { item: KanbanItem; product?: MasterProduct }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    if (!product) return <div className="mt-2 p-2 bg-purple-50 rounded-lg text-xs">Loading rakitan...</div>;

    const totalRequired = product.bom.reduce((acc, b) => acc + (b.qty * item.quantity), 0);
    const totalCurrent = product.bom.reduce((acc, b) => {
        const prog = item.metadata?.bomProgress?.[b.materialSku] || 0;
        return acc + prog;
    }, 0);

    const progressPercent = Math.min(100, (totalCurrent / totalRequired) * 100);

    return (
        <div className="mt-2.5 bg-purple-50 rounded-lg text-[10px] border border-purple-100/50 overflow-hidden">
            {/* Header / Summary */}
            <div 
                className="p-2 cursor-pointer hover:bg-purple-100/50 transition-colors"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
                <div className="flex items-center justify-between font-bold text-purple-800 mb-1">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Wrench className="h-3 w-3 shrink-0" />
                        <span className="truncate">Perakitan: {product.name}</span>
                    </div>
                    <span className="text-[8px] text-purple-400 underline shrink-0 ml-1">
                        {isExpanded ? 'Minimize' : 'Detail'}
                    </span>
                </div>

                {/* Single line progress for better UX */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-[8px] text-purple-600 font-bold uppercase tracking-wider">
                        <span>Komponen Terkumpul</span>
                        <span>{totalCurrent} / {totalRequired}</span>
                    </div>
                    <div className="h-1 w-full bg-purple-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-purple-600 transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }} 
                        />
                    </div>
                </div>
            </div>

            {/* Collapsible Details */}
            {isExpanded && (
                <div className="px-2 pb-2 space-y-1 mt-1 border-t border-purple-100/30 pt-1.5">
                    {product.bom.map(bomItem => {
                        const progress = item.metadata?.bomProgress?.[bomItem.materialSku] || 0;
                        const qtyTargetPerUnit = bomItem.qty;
                        const currentRequired = bomItem.qty * item.quantity;
                        const isComplete = progress >= currentRequired;
                        return (
                            <div key={bomItem.materialSku} className="flex items-center justify-between text-[9px] font-medium leading-[14px]">
                                <span className={`${isComplete ? 'text-gray-400 line-through' : 'text-gray-700'} break-words mr-2 flex-1`}>
                                    • {bomItem.materialName} ({qtyTargetPerUnit}/unit)
                                </span>
                                <span className={`${isComplete ? 'text-emerald-600 font-bold' : 'text-purple-600'} shrink-0`}>
                                    {progress} / {currentRequired}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const KanbanCard = memo(KanbanCardComponent, (prevProps, nextProps) => {
    // Only re-render if the item's core data or stage changes
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.quantity === nextProps.item.quantity &&
        prevProps.item.status === nextProps.item.status &&
        prevProps.item.updated_at === nextProps.item.updated_at &&
        prevProps.stage.id === nextProps.stage.id
    );
});
