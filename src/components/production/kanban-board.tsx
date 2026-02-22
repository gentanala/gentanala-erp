'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanCard } from './kanban-card';
import type { MasterProduct } from '@/lib/master-data';
import type { KanbanItem, WorkflowStage, WorkflowBlueprint } from '@/lib/database.types';
import { STAGE_LOGIC_CONFIG } from '@/lib/database.types';

interface KanbanBoardProps {
    blueprint: WorkflowBlueprint;
    items: KanbanItem[];
    products: MasterProduct[];
    onItemDrop: (itemId: string, fromStageId: string, toStageId: string) => void;
    onAddItem?: (stageId: string) => void;
    onEditItem?: (item: KanbanItem) => void;
    onDeleteItem?: (item: KanbanItem) => void;
    onRejectItem?: (item: KanbanItem) => void;
    onSendToWorkflow?: (item: KanbanItem) => void;
    onAllocateItem?: (item: KanbanItem) => void;
    onOpenMergeDialog?: (stageId: string) => void;
}

export function KanbanBoard({ blueprint, items, products, onItemDrop, onAddItem, onEditItem, onDeleteItem, onRejectItem, onSendToWorkflow, onAllocateItem, onOpenMergeDialog }: KanbanBoardProps) {
    const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, itemId: string) => {
        e.dataTransfer.setData('text/plain', itemId);
        setDraggedItemId(itemId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverStageId(stageId);
    };

    const handleDragLeave = () => {
        setDragOverStageId(null);
    };

    const handleDrop = (e: React.DragEvent, toStageId: string) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        const item = items.find(i => i.id === itemId);
        if (item && item.stageId !== toStageId) {
            onItemDrop(itemId, item.stageId, toStageId);
        }
        setDragOverStageId(null);
        setDraggedItemId(null);
    };

    const sortedStages = [...blueprint.stages].sort((a, b) => a.order - b.order);

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x" style={{ minHeight: '500px' }}>
            {sortedStages.map((stage) => {
                const stageItems = items.filter(i => i.stageId === stage.id && i.status === 'active');
                const isDragOver = dragOverStageId === stage.id;
                const logicConfig = STAGE_LOGIC_CONFIG[stage.logicType];

                // Count total quantity for the stage
                const totalQty = stageItems.reduce((sum, i) => sum + i.quantity, 0);

                return (
                    <div
                        key={stage.id}
                        className={`flex-shrink-0 w-[240px] rounded-2xl border-2 transition-all duration-200 snap-start ${isDragOver
                            ? `${stage.color.border} ${stage.color.bg} border-solid scale-[1.01] shadow-lg`
                            : 'border-dashed border-gray-200 bg-gray-50/60'
                            }`}
                        onDragOver={(e) => handleDragOver(e, stage.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, stage.id)}
                    >
                        {/* Column Header */}
                        <div className="p-4 pb-2">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    {stage.emoji && <span className="text-lg">{stage.emoji}</span>}
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                        {stage.name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.color.bg} ${stage.color.text}`}>
                                        {stageItems.length}
                                    </span>
                                    {totalQty > stageItems.length && (
                                        <span className="text-[10px] text-gray-400">
                                            ({totalQty} pcs)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Logic Type Badge */}
                            <div className="flex items-center gap-1 mb-2">
                                <span className="text-[10px]">{logicConfig.emoji}</span>
                                <span className={`text-[10px] font-semibold ${logicConfig.color}`}>
                                    {logicConfig.label}
                                </span>
                            </div>

                            {onAddItem && stage.logicType !== 'exit' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full h-9 text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 hover:border-gray-300 rounded-xl"
                                    onClick={() => onAddItem(stage.id)}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Tambah
                                </Button>
                            )}

                        </div>

                        {/* Cards List */}
                        <div className="px-3 pb-4 space-y-3 max-h-[400px] overflow-y-auto">
                            {stageItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`transition-opacity duration-200 ${draggedItemId === item.id ? 'opacity-30' : 'opacity-100'
                                        }`}
                                >
                                    <KanbanCard
                                        item={item}
                                        stage={stage}
                                        products={products}
                                        onDragStart={handleDragStart}
                                        onEdit={onEditItem}
                                        onDelete={onDeleteItem}
                                        onReject={onRejectItem}
                                        onSendToWorkflow={onSendToWorkflow}
                                        onAllocate={onAllocateItem}
                                    />
                                </div>
                            ))}
                            {stageItems.length === 0 && !isDragOver && (
                                <p className="text-center text-xs text-gray-400 py-8">
                                    Drop items here
                                </p>
                            )}
                            {isDragOver && (
                                <div className={`rounded-2xl border-2 border-dashed ${stage.color.border} p-6 text-center`}>
                                    <p className={`text-sm font-bold ${stage.color.text}`}>
                                        {stage.emoji} Drop here
                                    </p>
                                    {stage.logicType !== 'passthrough' && (
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {logicConfig.emoji} {logicConfig.label}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
