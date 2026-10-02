import type { ReactNode } from 'react';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

export type HairlineColumn = {
    key: string;
    header: string;
    align?: 'left' | 'right';
};

export type HairlineRow = {
    id: string | number;
    cells: Record<string, ReactNode>;
    mobileTitle: ReactNode;
    mobileMeta?: { label: string; value: ReactNode }[];
    mobileFooter?: ReactNode;
    after?: ReactNode;
};

export function HairlineTable({
    columns,
    rows,
    empty,
    minWidth = 640,
}: {
    columns: HairlineColumn[];
    rows: HairlineRow[];
    empty?: ReactNode;
    minWidth?: number;
}) {
    return (
        <div className="@container/hairline">
            <div className="hidden border-y border-hairline bg-canvas @[480px]/hairline:block">
                <div className="overflow-x-auto">
                    <table
                        className="aurora-text-table w-full border-collapse text-[13px]"
                        style={{ minWidth }}
                    >
                        <thead>
                            <tr className="border-b border-hairline bg-canvas-soft text-start">
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={cn(
                                            'px-4 py-1.5 text-[11px] font-medium text-mute',
                                            column.align === 'right' &&
                                                'text-end',
                                        )}
                                    >
                                        {column.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        className="aurora-text-body-sm px-4 py-8 text-center text-mute"
                                        colSpan={columns.length}
                                    >
                                        {empty ?? 'Nothing here yet.'}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <Fragment key={row.id}>
                                        <tr className="border-t border-hairline transition-colors hover:bg-canvas-soft">
                                            {columns.map((column) => (
                                                <td
                                                    key={column.key}
                                                    dir="auto"
                                                    className={cn(
                                                        'px-4 py-1.5 align-middle',
                                                        column.align ===
                                                            'right' &&
                                                            'text-end',
                                                    )}
                                                >
                                                    {row.cells[column.key]}
                                                </td>
                                            ))}
                                        </tr>
                                        {row.after ? (
                                            <tr className="border-t border-hairline bg-canvas-soft/50">
                                                <td
                                                    colSpan={columns.length}
                                                    className="px-4 py-3"
                                                >
                                                    {row.after}
                                                </td>
                                            </tr>
                                        ) : null}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="@[480px]/hairline:hidden">
                {rows.length === 0 ? (
                    <div className="aurora-text-body-sm border-y border-hairline bg-canvas px-4 py-8 text-center text-mute">
                        {empty ?? 'Nothing here yet.'}
                    </div>
                ) : (
                    <ul className="divide-y divide-hairline border-y border-hairline bg-canvas">
                        {rows.map((row) => (
                            <li
                                key={row.id}
                                className="bg-canvas px-4 py-2.5"
                            >
                                <div className="font-medium text-ink">
                                    {row.mobileTitle}
                                </div>
                                {row.mobileMeta && row.mobileMeta.length > 0 ? (
                                    <dl className="mt-1.5 grid gap-1 text-[12px]">
                                        {row.mobileMeta.map((item) => (
                                            <div
                                                key={item.label}
                                                className="flex justify-between gap-3"
                                            >
                                                <dt className="text-mute">
                                                    {item.label}
                                                </dt>
                                                <dd className="truncate text-ink" dir="auto">
                                                    {item.value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                ) : null}
                                {row.mobileFooter}
                                {row.after}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export function HairlinePanel({
    title,
    description,
    action,
    children,
    padded = true,
}: {
    title?: string;
    description?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    padded?: boolean;
}) {
    return (
        <section className="border-t border-hairline bg-canvas shadow-none">
            {title ? (
                <header className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline px-4 py-2.5">
                    <div>
                        <h3 className="aurora-text-section text-ink">
                            {title}
                        </h3>
                        {description ? (
                            <p className="aurora-text-body-sm mt-0.5 text-mute">
                                {description}
                            </p>
                        ) : null}
                    </div>
                    {action}
                </header>
            ) : null}
            <div className={padded ? 'px-4 py-3' : undefined}>{children}</div>
        </section>
    );
}
