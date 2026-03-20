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
            className={`group relative cursor-grab active:cursor-grabbing rounded-xl border-2 bg-white p-2.5 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:shadow-md ${stage.color.border}`}
            style={{ minHeight: '60px' }}
        >
            <div className="flex items-start gap-3">
                <GripVertical className="h-5 w-5 mt-0.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                <div className="flex-1 min-w-0">
                    {/* Emoji + Name */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        {(item.emoji || stage.emoji) && <span className="text-sm shrink-0">{item.emoji || stage.emoji}</span>}
                        <p className={`font-bold text-xs text-gray-900 ${item.name.length > 25 ? 'leading-tight' : ''}`}>{item.name}</p>
                    </div>

                    {/* SKU */}
                    {item.sku && (
                        <p className="text-[9px] font-mono text-gray-400 mt-0.5 break-all">{item.sku}</p>
                    )}

                    {/* Collection + Qty row */}
                    <div className="flex items-center justify-between mt-1.5">
                        {item.collection ? (
                            <span className={`inline-block text-[9px] font-semibold px-1.5 py-px rounded-full ${stage.color.bg} ${stage.color.text} truncate max-w-[80px]`}>
                                {item.collection}
                            </span>
                        ) : <span />}
                        <div className="flex items-center gap-1 shrink-0">
                            <Package className="h-3 w-3 text-gray-400" />
                            <span className="text-[11px] font-bold text-gray-700">{item.quantity} pcs</span>
                        </div>
                    </div>

                    {/* Merge/Split/Assembly info */}
                    {item.metadata?.bomProgress ? (
                        <AssembleProgress 
                            item={item} 
                            product={products.find(p => p.sku === item.metadata?.targetBomSku)} 
                        />
                    ) : item.mergedFrom.length > 0 ? (
                        <p className="text-[9px] text-purple-500 mt-1">🔧 Merged from {item.mergedFrom.length} components</p>
                    ) : null}

                    {item.parentId && !item.metadata?.bomProgress && !item.mergedFrom.length && (
                        <p className="text-[8px] text-amber-500 mt-1 opacity-70">✂️ Split from parent</p>
                    )}
                </div>

                {/* Three-dot menu */}
                {(onEdit || onDelete || onSendToWorkflow || (onAllocate && stage.logicType === 'merge' && !item.metadata?.targetBomSku)) && (
                    <div className="relative shrink-0 flex items-start">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] rounded-xl shadow-xl">
                                {onAllocate && stage.logicType === 'merge' && !item.metadata?.targetBomSku && (
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); onAllocate(item); }}
                                        className="gap-2.5 text-sm cursor-pointer text-purple-700 focus:text-purple-800 focus:bg-purple-50"
                                    >
                                        <Wrench className="h-3.5 w-3.5" />
                                        Alokasikan ke Rakitan
                                    </DropdownMenuItem>
                                )}
                                {onSendToWorkflow && (
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); onSendToWorkflow(item); }}
                                        className="gap-2.5 text-sm cursor-pointer text-indigo-700 focus:text-indigo-800 focus:bg-indigo-50"
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
                                        className="gap-2.5 text-sm cursor-pointer text-orange-600 focus:text-orange-700 focus:bg-orange-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Tandai Gagal
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem
                                        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                        className="gap-2.5 text-sm cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
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
