import { router } from '@inertiajs/react';
import { PencilSimple } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Input } from '@/evo/ui/input';

export function InlineRecordField({
    label,
    value,
    name,
    action,
    extra = {},
    type = 'text',
}: {
    label: string;
    value?: string | null;
    name: string;
    action: string;
    extra?: Record<string, string | number | null | undefined>;
    type?: string;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? '');

    useEffect(() => {
        setDraft(value ?? '');
    }, [value]);

    function save() {
        setEditing(false);
        if (draft === (value ?? '')) {
            return;
        }

        router.put(
            action,
            { ...extra, [name]: draft },
            { preserveScroll: true },
        );
    }

    return (
        <div className="group flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
                <p className="text-[11px] text-mute">{label}</p>
                {editing ? (
                    <Input
                        autoFocus
                        value={draft}
                        type={type}
                        onChange={(event) => setDraft(event.target.value)}
                        onBlur={save}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.currentTarget.blur();
                            }
                            if (event.key === 'Escape') {
                                setDraft(value ?? '');
                                setEditing(false);
                            }
                        }}
                        className="mt-0.5 h-8"
                        aria-label={label}
                    />
                ) : (
                    <p className="truncate text-[13px] text-ink">
                        {value || '—'}
                    </p>
                )}
            </div>
            <button
                type="button"
                className="mt-3 text-mute hover:text-ink focus-visible:text-ink focus-visible:outline-none"
                aria-label={`Edit ${label}`}
                onClick={() => setEditing(true)}
            >
                <PencilSimple className="size-3.5" aria-hidden />
            </button>
        </div>
    );
}
