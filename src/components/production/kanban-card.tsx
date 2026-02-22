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
            className={`group relative cursor-grab active:cursor-grabbing rounded-2xl border-2 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 active:shadow-md ${stage.color.border}`}
            style={{ minHeight: '72px' }}
        >
            <div className="flex items-start gap-3">
                <GripVertical className="h-5 w-5 mt-0.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                <div className="flex-1 min-w-0">
                    {/* Emoji + Name */}
                    <div className="flex items-start gap-2">
                        {(item.emoji || stage.emoji) && <span className="text-base leading-none pt-0.5">{item.emoji || stage.emoji}</span>}
                        <p className="font-bold text-sm text-gray-900 break-words whitespace-normal leading-tight">{item.name}</p>
                    </div>

                    {/* SKU */}
                    {item.sku && (
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">{item.sku}</p>
                    )}

                    {/* Collection + Qty row */}
                    <div className="flex items-center justify-between mt-2">
                        {item.collection ? (
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${stage.color.bg} ${stage.color.text}`}>
                                {item.collection}
                            </span>
                        ) : <span />}
                        <div className="flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs font-bold text-gray-700">{item.quantity} pcs</span>
                        </div>
                    </div>

                    {/* Merge/Split/Assembly info */}
                    {item.metadata?.bomProgress ? (
                        <div className="mt-2.5 p-2 bg-purple-50 rounded-lg text-[10px] border border-purple-100/50">
                            <div className="flex items-center gap-1.5 font-bold text-purple-800 mb-1.5 pb-1.5 border-b border-purple-100">
                                <Wrench className="h-3 w-3" />
                                Perakitan {products.find(p => p.sku === item.metadata?.targetBomSku)?.name || item.metadata?.targetBomSku}
                            </div>
                            <div className="space-y-1">
                                {products.find(p => p.sku === item.metadata?.targetBomSku)?.bom.map(bomItem => {
                                    const progress = item.metadata?.bomProgress?.[bomItem.materialSku] || 0;
                                    const required = bomItem.qty * item.quantity;
                                    const isComplete = progress >= required;
                                    return (
                                        <div key={bomItem.materialSku} className="flex items-center justify-between text-[9px] font-medium leading-[14px]">
                                            <span className={`${isComplete ? 'text-gray-400 line-through' : 'text-gray-700'} truncate mr-2 flex-1`}>
                                                {bomItem.materialName} ({required})
                                            </span>
                                            <span className={`${isComplete ? 'text-emerald-600 font-bold' : 'text-purple-600'} shrink-0`}>
                                                {isComplete ? '✓' : `${progress} / ${required}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : item.mergedFrom.length > 0 ? (
                        <p className="text-[9px] text-purple-500 mt-1">🔧 Merged from {item.mergedFrom.length} components</p>
                    ) : null}

                    {item.parentId && !item.metadata?.bomProgress && (
                        <p className="text-[9px] text-amber-500 mt-1">✂️ Split from parent</p>
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
