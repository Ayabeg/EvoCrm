import type { InboxQueueItem } from '@/evo/inbox/types';
import { cn } from '@/evo/lib/cn';
import { t } from '@/lib/i18n';
import { MOTION_HOVER_CLASS } from '@/lib/motion';

export function QueueNavigation({
    queues,
    activeKey,
    onSelect,
}: {
    queues: InboxQueueItem[];
    activeKey: string;
    onSelect: (key: string) => void;
}) {
    return (
        <nav
            aria-label={t('Inbox folders')}
            data-inbox-pane="nav"
            data-inbox="queue-nav"
            className="px-2 py-2"
        >
            <p className="px-2 pb-1.5 text-[10px] font-medium tracking-[0.08em] text-[var(--evo-ink-muted)] uppercase">
                {t('Inbox')}
            </p>
            <ul>
                {queues.map((item) => {
                    const active = activeKey === item.key;

                    return (
                        <li key={item.key}>
                            <button
                                type="button"
                                onClick={() => onSelect(item.key)}
                                aria-current={active ? 'true' : undefined}
                                className={cn(
                                    'flex h-8 w-full items-center justify-between gap-2 px-2 text-left text-[12px]',
                                    MOTION_HOVER_CLASS,
                                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--evo-focus)]',
                                    active
                                        ? 'rounded-[var(--evo-radius-compact)] bg-[var(--evo-teal-soft)] font-medium text-[var(--evo-ink)]'
                                        : 'text-[var(--evo-ink-muted)] hover:bg-[var(--evo-hover)] hover:text-[var(--evo-ink)]',
                                )}
                            >
                                <span className="truncate">{t(item.label)}</span>
                                {item.count !== null ? (
                                    <span className="font-mono text-[11px] tabular-nums">
                                        {item.count}
                                    </span>
                                ) : null}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

export function InboxFolderRail({
    folders,
    folder,
    onSelect,
}: {
    folders: InboxQueueItem[];
    folder: string;
    onSelect: (key: string) => void;
}) {
    return (
        <QueueNavigation queues={folders} activeKey={folder} onSelect={onSelect} />
    );
}
