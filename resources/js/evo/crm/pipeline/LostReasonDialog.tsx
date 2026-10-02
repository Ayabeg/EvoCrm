/**
 * Evo Design System — LostReasonDialog
 * Registry: shadcn/ui — alert-dialog
 * License: MIT (original composition)
 */

import { useState } from 'react';
import type { LostReasonPending } from '@/evo/crm/pipeline/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/evo/ui/alert-dialog';
import { Textarea } from '@/evo/ui/textarea';
import { t } from '@/lib/i18n';

export function LostReasonDialog({
    pending,
    onCancel,
    onConfirm,
}: {
    pending: LostReasonPending | null;
    onCancel: () => void;
    onConfirm: (reason: string) => void;
}) {
    const [reason, setReason] = useState('');

    return (
        <AlertDialog
            open={pending !== null}
            onOpenChange={(open) => {
                if (!open) {
                    setReason('');
                    onCancel();
                }
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('Lost reason')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('Why did :title not close?', {
                            title: pending?.title ?? '',
                        })}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    aria-label={t('Lost reason')}
                    className="min-h-20"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel
                        onClick={() => {
                            setReason('');
                            onCancel();
                        }}
                    >
                        {t('Cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            const next = reason.trim();
                            setReason('');
                            onConfirm(next);
                        }}
                    >
                        {t('Mark lost')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
