'use client';

import { useState, useMemo } from 'react';
import { X, Search, ArrowRight, Clock, Scissors, Wrench, ShoppingBag, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ActivityLog } from '@/lib/database.types';
import { STAGE_LOGIC_CONFIG } from '@/lib/database.types';

interface ActivityLogPanelProps {
    open: boolean;
    onClose: () => void;
    logs: ActivityLog[];
}

function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: string) {
    return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
    moved: <ArrowRight className="h-4 w-4 text-blue-500" />,
    split: <Scissors className="h-4 w-4 text-amber-500" />,
    merged: <Wrench className="h-4 w-4 text-purple-500" />,
    sold: <ShoppingBag className="h-4 w-4 text-emerald-500" />,
    added: <Plus className="h-4 w-4 text-gray-500" />,
};

const ACTION_COLORS: Record<string, string> = {
    moved: 'bg-blue-50 border-blue-200',
    split: 'bg-amber-50 border-amber-200',
    merged: 'bg-purple-50 border-purple-200',
    sold: 'bg-emerald-50 border-emerald-200',
    added: 'bg-gray-50 border-gray-200',
};

function LogActionBadge({ action }: { action: string }) {
    const config = STAGE_LOGIC_CONFIG[action === 'moved' ? 'passthrough' : action === 'sold' ? 'exit' : action === 'split' ? 'split' : action === 'merged' ? 'merge' : 'passthrough'];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
            {config.emoji} {action}
        </span>
    );
}

export function ActivityLogPanel({ open, onClose, logs }: ActivityLogPanelProps) {
    const [search, setSearch] = useState('');

    const filteredLogs = useMemo(() => {
        if (!search.trim()) return logs;
        const q = search.toLowerCase();
        return logs.filter(log =>
            log.item_name.toLowerCase().includes(q) ||
            (log.metadata?.mergedItems?.some(m => m.toLowerCase().includes(q)))
        );
    }, [logs, search]);

    const grouped = useMemo(() => {
        const groups: Record<string, ActivityLog[]> = {};
        filteredLogs.forEach(log => {
            const dateKey = formatDate(log.timestamp);
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(log);
        });
        return groups;
    }, [filteredLogs]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Audit Trail</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{logs.length} total entries</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Search */}
                <div className="px-5 py-3 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Cari item / SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-gray-50 border-gray-200 h-11"
                        />
                    </div>
                </div>

                {/* Log List */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                    {filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Clock className="h-10 w-10 mb-3 opacity-50" />
                            <p className="text-sm font-medium">Belum ada aktivitas</p>
                            <p className="text-xs mt-1">Geser kartu untuk merekam pergerakan</p>
                        </div>
                    ) : (
                        Object.entries(grouped).map(([date, dateLogs]) => (
                            <div key={date} className="mb-4">
                                <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-1 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{date}</span>
                                </div>
                                <div className="space-y-2">
                                    {dateLogs.map((log) => (
                                        <div
                                            key={log.id}
                                            className={`flex gap-3 p-3 rounded-xl border transition-colors ${ACTION_COLORS[log.action] || 'bg-gray-50 border-gray-200'}`}
                                        >
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 shrink-0">
                                                {ACTION_ICONS[log.action] || <ArrowRight className="h-4 w-4 text-gray-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <LogActionBadge action={log.action} />
                                                    <span className="text-[10px] text-gray-400">{formatTime(log.timestamp)}</span>
                                                </div>
                                                <p className="text-sm text-gray-900 mt-1">
                                                    <span className="font-semibold">{log.user}</span>
                                                    {log.action === 'split' && (
                                                        <> pecah <strong>'{log.item_name}'</strong> → {log.metadata?.childCount} items</>
                                                    )}
                                                    {log.action === 'merged' && (
                                                        <> rakit <strong>{log.metadata?.mergedItems?.join(' + ')}</strong> → <strong>'{log.item_name}'</strong></>
                                                    )}
                                                    {log.action === 'sold' && (
                                                        <> jual <strong>'{log.item_name}'</strong> via {log.metadata?.salesChannel}</>
                                                    )}
                                                    {log.action === 'moved' && (
                                                        <> geser <strong>'{log.item_name}'</strong></>
                                                    )}
                                                    {log.action === 'added' && (
                                                        <> tambah <strong>'{log.item_name}'</strong></>
                                                    )}
                                                </p>
                                                {log.from_stage && (
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        {log.from_stage} → {log.to_stage}
                                                    </p>
                                                )}
                                                {!log.from_stage && (
                                                    <p className="text-[10px] text-gray-500 mt-1">→ {log.to_stage}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
