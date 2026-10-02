/**
 * Evo Design System — ActivityComposer
 * Registry: custom Evo
 * License: MIT (original)
 */

import { useState } from 'react';
import { Button } from '@/evo/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/evo/ui/tabs';
import { Textarea } from '@/evo/ui/textarea';
import { t } from '@/lib/i18n';

export type ComposerKind = 'note' | 'call' | 'email' | 'task';

export function ActivityComposer({
    onSubmit,
    disabled = false,
}: {
    onSubmit?: (kind: ComposerKind, body: string) => void;
    disabled?: boolean;
}) {
    const [kind, setKind] = useState<ComposerKind>('note');
    const [body, setBody] = useState('');

    return (
        <form
            className="space-y-2"
            data-evo="activity-composer"
            onSubmit={(event) => {
                event.preventDefault();
                const next = body.trim();

                if (!next || disabled) {
                    return;
                }

                onSubmit?.(kind, next);
                setBody('');
            }}
        >
            <Tabs
                value={kind}
                onValueChange={(value) => setKind(value as ComposerKind)}
            >
                <TabsList aria-label={t('Activity type')}>
                    <TabsTrigger value="note">{t('Note')}</TabsTrigger>
                    <TabsTrigger value="call">{t('Call')}</TabsTrigger>
                    <TabsTrigger value="email">{t('Email')}</TabsTrigger>
                    <TabsTrigger value="task">{t('Task')}</TabsTrigger>
                </TabsList>
            </Tabs>
            <Textarea
                value={body}
                disabled={disabled}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t('Write a note, log a call, or create a task…')}
                aria-label={t('Activity body')}
                className="min-h-20"
            />
            <div className="flex justify-end">
                <Button
                    type="submit"
                    size="sm"
                    disabled={disabled || body.trim() === ''}
                >
                    {t('Save')}
                </Button>
            </div>
        </form>
    );
}
