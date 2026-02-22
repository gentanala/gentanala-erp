'use client';

import { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { KanbanItem, SalesChannel } from '@/lib/database.types';
import { SALES_CHANNEL_LABELS } from '@/lib/database.types';

interface SalesExitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: KanbanItem | null;
    onConfirm: (channel: SalesChannel) => void;
}

const CHANNEL_OPTIONS: { value: SalesChannel; emoji: string }[] = [
    { value: 'shopee', emoji: '🟠' },
    { value: 'tokopedia', emoji: '🟢' },
    { value: 'whatsapp', emoji: '💬' },
    { value: 'offline', emoji: '🏪' },
    { value: 'b2b', emoji: '🏢' },
    { value: 'kol_gift', emoji: '🎁' },
];

export function SalesExitDialog({ open, onOpenChange, item, onConfirm }: SalesExitDialogProps) {
    const [channel, setChannel] = useState<SalesChannel | null>(null);

    const handleOpenChange = (o: boolean) => {
        if (o) {
            setChannel(null);
        }
        onOpenChange(o);
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-emerald-600" />
                        Catat Penjualan
                    </DialogTitle>
                    <DialogDescription>
                        Pilih channel penjualan untuk item ini
                    </DialogDescription>
                </DialogHeader>

                {/* Item Info */}
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {item.sku} · {item.quantity} pcs
                        {item.collection && ` · ${item.collection}`}
                    </p>
                </div>

                {/* Channel Selection */}
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Channel Penjualan
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {CHANNEL_OPTIONS.map(opt => {
                            const isSelected = channel === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setChannel(opt.value)}
                                    className={`flex items-center gap-2.5 p-3.5 rounded-xl transition-all text-left ${isSelected
                                        ? 'bg-emerald-100 border-2 border-emerald-400 shadow-sm'
                                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="text-xl">{opt.emoji}</span>
                                    <div>
                                        <p className="font-semibold text-sm">{SALES_CHANNEL_LABELS[opt.value]}</p>
                                    </div>
                                    {isSelected && (
                                        <Check className="h-4 w-4 text-emerald-600 ml-auto" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12">
                        Batal
                    </Button>
                    <Button
                        onClick={() => channel && onConfirm(channel)}
                        className="h-12 gap-2 bg-emerald-600 hover:bg-emerald-700"
                        disabled={!channel}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Konfirmasi Penjualan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
