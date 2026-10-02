/**
 * Evo Design System — RecordWorkspace
 * Registry: custom Evo
 * License: MIT (original)
 * Copied: 2026-10-02
 * Modified: 3-pane CRM record (properties / activity / related); tokens only.
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/evo/lib/cn';
import { Tabs, TabsList, TabsTrigger } from '@/evo/ui/tabs';
import { t } from '@/lib/i18n';

export type RecordPaneKey = 'left' | 'center' | 'right';

export function RecordPageFrame({
    header,
    children,
    className,
    testId,
}: {
    header?: ReactNode;
    children: ReactNode;
    className?: string;
    testId?: string;
}) {
    return (
        <div
            className={cn(
                'h-app-workspace flex min-h-0 flex-1 flex-col bg-[var(--evo-canvas)] text-[13px] text-[var(--evo-ink)]',
                className,
            )}
            data-evo="record-workspace"
            data-testid={testId}
        >
            {header ? (
                <div className="relative shrink-0 border-b border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-4 py-2.5 sm:px-6">
                    <span
                        className="absolute inset-y-0 left-0 w-[3px] bg-[var(--evo-teal)]"
                        aria-hidden
                    />
                    {header}
                </div>
            ) : null}
            {children}
        </div>
    );
}

function ScrollPane({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'min-h-0 overflow-y-auto bg-[var(--evo-surface)]',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function RecordShell({
    left,
    center,
    right,
    leftLabel = 'About',
    centerLabel = 'Activity',
    rightLabel = 'Related',
    leftClassName,
    centerClassName,
    rightClassName,
    defaultPane = 'center',
}: {
    left: ReactNode;
    center: ReactNode;
    right: ReactNode;
    leftLabel?: string;
    centerLabel?: string;
    rightLabel?: string;
    leftClassName?: string;
    centerClassName?: string;
    rightClassName?: string;
    defaultPane?: RecordPaneKey;
}) {
    const [pane, setPane] = useState<RecordPaneKey>(defaultPane);
    const panes: { key: RecordPaneKey; label: string }[] = [
        { key: 'left', label: t(leftLabel) },
        { key: 'center', label: t(centerLabel) },
        { key: 'right', label: t(rightLabel) },
    ];

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Tabs
                value={pane}
                onValueChange={(value) => setPane(value as RecordPaneKey)}
                className="w-full shrink-0 border-b border-[var(--evo-hairline)] bg-[var(--evo-surface)] lg:hidden"
            >
                <TabsList className="h-auto w-full justify-stretch gap-0 bg-transparent p-0">
                    {panes.map((item) => (
                        <TabsTrigger
                            key={item.key}
                            value={item.key}
                            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--evo-teal)] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            {item.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
                {pane === 'left' ? (
                    <ScrollPane className={cn('px-4 py-3', leftClassName)}>
                        {left}
                    </ScrollPane>
                ) : null}
                {pane === 'center' ? (
                    <ScrollPane className={cn('px-4 py-3', centerClassName)}>
                        {center}
                    </ScrollPane>
                ) : null}
                {pane === 'right' ? (
                    <ScrollPane className={cn('px-4 py-3', rightClassName)}>
                        {right}
                    </ScrollPane>
                ) : null}
            </div>

            <div className="hidden min-h-0 flex-1 overflow-hidden md:flex md:flex-col lg:hidden">
                {pane === 'left' ? (
                    <ScrollPane
                        className={cn('flex-1 px-4 py-4', leftClassName)}
                    >
                        {left}
                    </ScrollPane>
                ) : (
                    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] gap-px overflow-hidden bg-[var(--evo-hairline)]">
                        <ScrollPane
                            className={cn('px-5 py-4', centerClassName)}
                        >
                            {center}
                        </ScrollPane>
                        <ScrollPane className={cn('px-4 py-4', rightClassName)}>
                            {right}
                        </ScrollPane>
                    </div>
                )}
            </div>

            <div className="hidden min-h-0 flex-1 grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)_minmax(18rem,22rem)] gap-px overflow-hidden bg-[var(--evo-hairline)] lg:grid">
                <ScrollPane className={cn('px-4 py-4', leftClassName)}>
                    {left}
                </ScrollPane>
                <ScrollPane className={cn('px-5 py-4', centerClassName)}>
                    {center}
                </ScrollPane>
                <ScrollPane className={cn('px-4 py-4', rightClassName)}>
                    {right}
                </ScrollPane>
            </div>
        </div>
    );
}

export function RecordWorkspace({
    header,
    path,
    left,
    center,
    right,
    leftLabel = 'About',
    centerLabel = 'Activity',
    rightLabel = 'Related',
    className,
    testId,
    children,
}: {
    header?: ReactNode;
    path?: ReactNode;
    left: ReactNode;
    center: ReactNode;
    right: ReactNode;
    leftLabel?: string;
    centerLabel?: string;
    rightLabel?: string;
    className?: string;
    testId?: string;
    children?: ReactNode;
}) {
    return (
        <RecordPageFrame header={header} className={className} testId={testId}>
            {path}
            <RecordShell
                left={left}
                center={center}
                right={right}
                leftLabel={leftLabel}
                centerLabel={centerLabel}
                rightLabel={rightLabel}
            />
            {children}
        </RecordPageFrame>
    );
}
