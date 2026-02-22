'use client';

import { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { KanbanItem, ActivityLog, WorkflowBlueprint } from '@/lib/database.types';
import { SALES_CHANNEL_LABELS } from '@/lib/database.types';
import { calcStats } from '@/lib/production-engine';

interface DailyRecapDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: KanbanItem[];
    logs: ActivityLog[];
    blueprint: WorkflowBlueprint;
}

export function DailyRecapDialog({ open, onOpenChange, items, logs, blueprint }: DailyRecapDialogProps) {
    const [copied, setCopied] = useState(false);

    const stats = calcStats(items, logs, blueprint);

    const dateStr = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const salesBreakdown = Object.entries(stats.salesByChannel)
        .map(([ch, count]) => `   • ${SALES_CHANNEL_LABELS[ch as keyof typeof SALES_CHANNEL_LABELS] || ch}: ${count} pcs`)
        .join('\n') || '   • (belum ada)';


    const recapText = `📊 *Laporan Harian Gentanala*
${dateStr}

🏭 Transformasi Hari Ini:
   • Split/Pecah: ${stats.splitTodayCount} batch
   • Assembly/Rakit: ${stats.mergeTodayCount} unit
💰 Terjual: ${stats.salesTodayCount} pcs
📦 Rincian Sales:
${salesBreakdown}
📋 WIP (produksi): ${stats.wipCount} pcs
📦 Ready Stock: ${stats.readyStockCount} pcs

---
_Digenerate otomatis oleh Gentanala MES_`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(recapText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = recapText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Laporan Harian
                    </DialogTitle>
                    <DialogDescription>
                        Preview laporan untuk dikirim via WhatsApp
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                    {recapText}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12">
                        Tutup
                    </Button>
                    <Button onClick={handleCopy} className="gap-2 h-12">
                        {copied ? (
                            <><Check className="h-4 w-4" /> Tersalin!</>
                        ) : (
                            <><Copy className="h-4 w-4" /> Copy ke Clipboard</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
