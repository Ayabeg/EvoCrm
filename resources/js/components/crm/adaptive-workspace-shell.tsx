import type { ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export type WorkspacePanelKey = 'left' | 'center' | 'right';

type PanelDef = {
    key: WorkspacePanelKey;
    label: string;
};

function ScrollPanel({
    children,
    className,
    scrollable = true,
}: {
    children: ReactNode;
    className?: string;
    scrollable?: boolean;
}) {
    return (
        <div
            className={cn(
                'min-h-0 bg-canvas',
                scrollable ? 'overflow-y-auto' : 'flex flex-col overflow-hidden',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function WorkspacePanelSwitcher({
    panels,
    active,
    onChange,
    className,
}: {
    panels: PanelDef[];
    active: WorkspacePanelKey;
    onChange: (key: WorkspacePanelKey) => void;
    className?: string;
}) {
    return (
        <div
            role="tablist"
            aria-label="Workspace panels"
            className={cn(
                'flex shrink-0 gap-1 overflow-x-auto border-b border-hairline bg-canvas px-3 py-2 no-scrollbar',
                className,
            )}
        >
            {panels.map((panel) => (
                <button
                    key={panel.key}
                    type="button"
                    role="tab"
                    aria-selected={active === panel.key}
                    onClick={() => onChange(panel.key)}
                    className={cn(
                        'shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                        active === panel.key
                            ? 'bg-brand/12 text-ink'
                            : 'text-muted-foreground hover:bg-canvas-soft hover:text-ink',
                    )}
                >
                    {panel.label}
                </button>
            ))}
        </div>
    );
}

/**
 * Three-panel workspace that adapts by viewport:
 * - Mobile (<768): one panel at a time via tab switcher (default: center)
 * - Tablet (768–1023): center + right visible; left via switcher
 * - Desktop (≥1024): full left | center | right grid with fluid side rails
 */
export function AdaptiveWorkspaceShell({
    left,
    center,
    right,
    leftLabel = 'Details',
    centerLabel = 'Activity',
    rightLabel = 'Related',
    defaultPanel = 'center',
    leftClassName,
    centerClassName,
    rightClassName,
    scrollPanels = { left: true, center: true, right: true },
}: {
    left: ReactNode;
    center: ReactNode;
    right: ReactNode;
    leftLabel?: string;
    centerLabel?: string;
    rightLabel?: string;
    defaultPanel?: WorkspacePanelKey;
    leftClassName?: string;
    centerClassName?: string;
    rightClassName?: string;
    scrollPanels?: Partial<Record<WorkspacePanelKey, boolean>>;
}) {
    const [activePanel, setActivePanel] = useState<WorkspacePanelKey>(defaultPanel);

    const panels: PanelDef[] = [
        { key: 'left', label: leftLabel },
        { key: 'center', label: centerLabel },
        { key: 'right', label: rightLabel },
    ];

    const leftScroll = scrollPanels.left ?? true;
    const centerScroll = scrollPanels.center ?? true;
    const rightScroll = scrollPanels.right ?? true;

    const leftRegion = cn('border-hairline bg-canvas px-5 py-5 md:border-r', leftClassName);
    const centerRegion = cn('bg-canvas px-5 py-5 sm:px-6 sm:py-6', centerClassName);
    const rightRegion = cn('border-hairline bg-canvas px-5 py-5 md:border-l', rightClassName);

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <WorkspacePanelSwitcher
                panels={panels}
                active={activePanel}
                onChange={setActivePanel}
                className="lg:hidden"
            />

            {/* Mobile: single scroll region */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
                {activePanel === 'left' ? (
                    <ScrollPanel className={leftRegion} scrollable={leftScroll}>
                        {left}
                    </ScrollPanel>
                ) : null}
                {activePanel === 'center' ? (
                    <ScrollPanel className={centerRegion} scrollable={centerScroll}>
                        {center}
                    </ScrollPanel>
                ) : null}
                {activePanel === 'right' ? (
                    <ScrollPanel className={rightRegion} scrollable={rightScroll}>
                        {right}
                    </ScrollPanel>
                ) : null}
            </div>

            {/* Tablet: details full-width OR activity + related side-by-side */}
            <div className="hidden min-h-0 flex-1 overflow-hidden md:flex md:flex-col lg:hidden">
                {activePanel === 'left' ? (
                    <ScrollPanel className={cn(leftRegion, 'flex-1')} scrollable={leftScroll}>
                        {left}
                    </ScrollPanel>
                ) : (
                    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] gap-px overflow-hidden bg-hairline">
                        <ScrollPanel className={centerRegion} scrollable={centerScroll}>
                            {center}
                        </ScrollPanel>
                        <ScrollPanel className={rightRegion} scrollable={rightScroll}>
                            {right}
                        </ScrollPanel>
                    </div>
                )}
            </div>

            {/* Desktop: intrinsic fluid rails + independent scroll regions */}
            <div className="hidden min-h-0 flex-1 gap-px overflow-hidden bg-hairline lg:grid lg:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)_minmax(18rem,22rem)]">
                <ScrollPanel className={leftRegion} scrollable={leftScroll}>
                    {left}
                </ScrollPanel>
                <ScrollPanel className={centerRegion} scrollable={centerScroll}>
                    {center}
                </ScrollPanel>
                <ScrollPanel className={rightRegion} scrollable={rightScroll}>
                    {right}
                </ScrollPanel>
            </div>
        </div>
    );
}
