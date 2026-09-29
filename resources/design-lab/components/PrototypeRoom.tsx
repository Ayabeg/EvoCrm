import { PageHeader } from './PageHeader';
import { ContextChip } from './PageHeader';
import { Module } from './Module';

type Row = {
    label: string;
    value: string;
};

type Props = {
    title: string;
    descriptor: string;
    rows: Row[];
    note?: string;
};

export function PrototypeRoom({ title, descriptor, rows, note }: Props) {
    return (
        <div>
            <PageHeader
                title={title}
                descriptor={descriptor}
                context={<ContextChip>1–30 sept. 2026</ContextChip>}
            />
            <Module title="État du prototype" hint="Même chassis, données encore limitées">
                <ul className="divide-y divide-[var(--evo-hairline)]">
                    {rows.map((row) => (
                        <li key={row.label} className="flex items-center justify-between px-4 py-3 text-[13px]">
                            <span className="text-[var(--evo-ink-muted)]">{row.label}</span>
                            <span className="font-medium">{row.value}</span>
                        </li>
                    ))}
                </ul>
                {note ? (
                    <p className="border-t border-[var(--evo-hairline)] px-4 py-3 text-[12px] text-[var(--evo-ink-muted)]">
                        {note}
                    </p>
                ) : null}
            </Module>
        </div>
    );
}
