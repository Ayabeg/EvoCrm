import type { ReactNode } from 'react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/evo/ui/tabs';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type WorkspacePanelKey = 'left' | 'center' | 'right';

type PanelDef = {
    key: WorkspacePanelKey;
    label: string;
};

type ViewportBand = 'mobile' | 'tablet' | 'desktop';

function subscribeMaxWidth(query: string, onChange: () => void) {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
    }

    const media = window.matchMedia(query);
    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
}

function useMaxWidth(query: string, serverFallback = false): boolean {
    return useSyncExternalStore(
        (onChange) => subscribeMaxWidth(query, onChange),
        () =>
            typeof window !== 'undefined' &&
            typeof window.matchMedia === 'function' &&
            window.matchMedia(query).matches,
        () => serverFallback,
    );
}

function useViewportBand(): ViewportBand {
    const isMobile = useMaxWidth('(max-width: 767px)');
    const isTablet = useMaxWidth('(min-width: 768px) and (max-width: 1023px)');

    if (isMobile) {
        return 'mobile';
    }

    if (isTablet) {
        return 'tablet';
    }

    return 'desktop';
}

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
                scrollable
                    ? 'overflow-y-auto'
                    : 'flex flex-col overflow-hidden',
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
        <Tabs
            value={active}
            onValueChange={(value) => onChange(value as WorkspacePanelKey)}
            className={cn(
                'w-full shrink-0 border-b border-hairline bg-canvas lg:hidden',
                className,
            )}
        >
            <TabsList className="no-scrollbar h-auto w-full justify-stretch gap-0 bg-transparent p-0">
                {panels.map((panel) => (
                    <TabsTrigger
                        key={panel.key}
                        value={panel.key}
                        className="min-h-9 flex-1 justify-center px-2 py-2 text-center text-[12px] font-medium after:shadow-none data-[state=active]:after:shadow-none"
                    >
                        {t(panel.label)}
                    </TabsTrigger>
                ))}
            </TabsList>
            {panels.map((panel) => (
                <TabsContent
                    key={panel.key}
                    value={panel.key}
                    className="sr-only"
                    aria-hidden
                />
            ))}
        </Tabs>
    );
}

/**
 * Three-panel workspace that adapts by viewport:
 * - Mobile (<768): one panel at a time via tab switcher (default: center)
 * - Tablet (768–1023): center + right visible; left via switcher
 * - Desktop (≥1024): full left | center | right grid with fluid side rails
 *
 * Inbox opts into hideLeftOnDesktop + singlePaneBelowLg + mountVisibleOnly
 * so folders are not a grid track and hidden breakpoint copies stay unmounted.
 */
export function AdaptiveWorkspaceShell({
    left,
    center,
    right,
    leftLabel = 'Details',
    centerLabel = 'Activity',
    rightLabel = 'Related',
    defaultPanel = 'center',
    activePanel,
    onActivePanelChange,
    leftClassName,
    centerClassName,
    rightClassName,
    scrollPanels = { left: true, center: true, right: true },
    tabletGridClassName,
    desktopGridClassName,
    hideLeftOnDesktop = false,
    singlePaneBelowLg = false,
    mountVisibleOnly = false,
}: {
    left: ReactNode;
    center: ReactNode;
    right: ReactNode;
    leftLabel?: string;
    centerLabel?: string;
    rightLabel?: string;
    defaultPanel?: WorkspacePanelKey;
    activePanel?: WorkspacePanelKey;
    onActivePanelChange?: (key: WorkspacePanelKey) => void;
    leftClassName?: string;
    centerClassName?: string;
    rightClassName?: string;
    scrollPanels?: Partial<Record<WorkspacePanelKey, boolean>>;
    tabletGridClassName?: string;
    desktopGridClassName?: string;
    hideLeftOnDesktop?: boolean;
    singlePaneBelowLg?: boolean;
    mountVisibleOnly?: boolean;
}) {
    const [uncontrolledPanel, setUncontrolledPanel] =
        useState<WorkspacePanelKey>(defaultPanel);
    const band = useViewportBand();
    const currentPanel = activePanel ?? uncontrolledPanel;

    const setPanel = (key: WorkspacePanelKey) => {
        onActivePanelChange?.(key);
        if (activePanel === undefined) {
            setUncontrolledPanel(key);
        }
    };

    useEffect(() => {
        if (activePanel !== undefined) {
            setUncontrolledPanel(activePanel);
        }
    }, [activePanel]);

    const switcherPanels: PanelDef[] = singlePaneBelowLg || hideLeftOnDesktop
        ? [
              { key: 'center', label: centerLabel },
              { key: 'right', label: rightLabel },
          ]
        : [
              { key: 'left', label: leftLabel },
              { key: 'center', label: centerLabel },
              { key: 'right', label: rightLabel },
          ];

    const leftScroll = scrollPanels.left ?? true;
    const centerScroll = scrollPanels.center ?? true;
    const rightScroll = scrollPanels.right ?? true;

    const leftRegion = cn(
        'border-hairline bg-canvas px-4 py-3 md:border-e md:px-4 md:py-4',
        leftClassName,
    );
    const centerRegion = cn(
        'bg-canvas px-4 py-3 sm:px-5 sm:py-4',
        centerClassName,
    );
    const rightRegion = cn(
        'border-hairline bg-canvas px-4 py-3 md:border-s md:px-4 md:py-4',
        rightClassName,
    );

    const desktopClassName = cn(
        'min-h-0 flex-1 gap-px overflow-hidden bg-hairline',
        mountVisibleOnly ? 'grid' : 'hidden lg:grid',
        hideLeftOnDesktop
            ? (desktopGridClassName ??
              'lg:grid-cols-[minmax(17.5rem,21.25rem)_minmax(0,1fr)]')
            : (desktopGridClassName ??
              'lg:grid-cols-[minmax(17rem,20rem)_minmax(0,1fr)_minmax(18rem,22rem)]'),
    );

    const renderDesktop = () => (
        <div className={desktopClassName}>
            {hideLeftOnDesktop ? null : (
                <ScrollPanel className={leftRegion} scrollable={leftScroll}>
                    {left}
                </ScrollPanel>
            )}
            <ScrollPanel className={centerRegion} scrollable={centerScroll}>
                {center}
            </ScrollPanel>
            <ScrollPanel className={rightRegion} scrollable={rightScroll}>
                {right}
            </ScrollPanel>
        </div>
    );

    const renderTabletSplit = () => (
        <div
            className={cn(
                'min-h-0 flex-1 overflow-hidden',
                mountVisibleOnly ? 'flex flex-col' : 'hidden md:flex md:flex-col lg:hidden',
            )}
        >
            {currentPanel === 'left' && !hideLeftOnDesktop ? (
                <ScrollPanel
                    className={cn(leftRegion, 'flex-1')}
                    scrollable={leftScroll}
                >
                    {left}
                </ScrollPanel>
            ) : (
                <div
                    className={cn(
                        'grid min-h-0 flex-1 gap-px overflow-hidden bg-hairline',
                        tabletGridClassName ??
                            'grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]',
                    )}
                >
                    <ScrollPanel
                        className={centerRegion}
                        scrollable={centerScroll}
                    >
                        {center}
                    </ScrollPanel>
                    <ScrollPanel
                        className={rightRegion}
                        scrollable={rightScroll}
                    >
                        {right}
                    </ScrollPanel>
                </div>
            )}
        </div>
    );

    const renderSinglePane = (className: string) => (
        <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
            {currentPanel === 'left' && !hideLeftOnDesktop && !singlePaneBelowLg ? (
                <ScrollPanel className={leftRegion} scrollable={leftScroll}>
                    {left}
                </ScrollPanel>
            ) : null}
            {currentPanel === 'center' ||
            (singlePaneBelowLg && currentPanel !== 'right') ? (
                <ScrollPanel
                    className={centerRegion}
                    scrollable={centerScroll}
                >
                    {center}
                </ScrollPanel>
            ) : null}
            {currentPanel === 'right' ? (
                <ScrollPanel
                    className={rightRegion}
                    scrollable={rightScroll}
                >
                    {right}
                </ScrollPanel>
            ) : null}
        </div>
    );

    if (mountVisibleOnly) {
        const compact = band === 'mobile' || (band === 'tablet' && singlePaneBelowLg);

        return (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {compact ? (
                    <WorkspacePanelSwitcher
                        panels={switcherPanels}
                        active={
                            switcherPanels.some((panel) => panel.key === currentPanel)
                                ? currentPanel
                                : 'center'
                        }
                        onChange={setPanel}
                        className="lg:hidden"
                    />
                ) : null}
                {compact
                    ? renderSinglePane('')
                    : band === 'tablet'
                      ? renderTabletSplit()
                      : renderDesktop()}
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <WorkspacePanelSwitcher
                panels={switcherPanels}
                active={
                    switcherPanels.some((panel) => panel.key === currentPanel)
                        ? currentPanel
                        : 'center'
                }
                onChange={setPanel}
                className="lg:hidden"
            />

            {renderSinglePane('md:hidden')}
            {singlePaneBelowLg ? (
                <div className="hidden min-h-0 flex-1 overflow-hidden md:flex md:flex-col lg:hidden">
                    {renderSinglePane('')}
                </div>
            ) : (
                renderTabletSplit()
            )}
            {renderDesktop()}
        </div>
    );
}
