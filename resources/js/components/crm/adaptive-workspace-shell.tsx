import type { ReactNode } from 'react';
import { useState } from 'react';
import { PillGroup, PillTrigger, TabsContent } from '@/components/ui/tabs';
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
        <PillGroup
            value={active}
            onValueChange={(value) => onChange(value as WorkspacePanelKey)}
            className={cn('w-full shrink-0 border-b border-hairline bg-canvas p-2 lg:hidden', className)}
            panels={
                <>
                    {panels.map((panel) => (
                        <TabsContent
                            key={panel.key}
                            value={panel.key}
                            className="sr-only"
                            aria-hidden
                        />
                    ))}
                </>
            }
        >
            {panels.map((panel) => (
                <PillTrigger
                    key={panel.key}
                    value={panel.key}
                    className="min-h-11 flex-1 justify-center px-2 py-2.5 text-center text-[12px] font-medium"
                >
                    {panel.label}
                </PillTrigger>
            ))}
        </PillGroup>
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

    const leftRegion = cn(
        'border-hairline bg-canvas px-4 py-3 md:border-r md:px-4 md:py-4',
        leftClassName,
    );
    const centerRegion = cn(
        'bg-canvas px-4 py-3 sm:px-5 sm:py-4',
        centerClassName,
    );
    const rightRegion = cn(
        'border-hairline bg-canvas px-4 py-3 md:border-l md:px-4 md:py-4',
        rightClassName,
    );

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
