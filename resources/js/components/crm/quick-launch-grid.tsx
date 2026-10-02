import { Link } from '@inertiajs/react';
import {
    Megaphone,
    PaperPlaneTilt,
    Plug,
    Tray,
    User,
    Users,
} from '@/evo/icons';
import type { Icon } from '@/evo/icons';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Department = {
    key: string;
    name: string;
    href: string;
    value?: number;
    value_label?: string;
    connected?: boolean;
};

const ICONS: Record<string, Icon> = {
    inbox: Tray,
    leads: Megaphone,
    contacts: User,
    ads: Megaphone,
    outbound: PaperPlaneTilt,
    integrations: Plug,
    companies: Users,
};

export function QuickLaunchGrid({
    departments,
    className,
}: {
    departments: Department[];
    className?: string;
}) {
    return (
        <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
            {departments.map((department) => {
                const Icon = ICONS[department.key] ?? Users;
                const disconnected = department.connected === false;

                return (
                    <Link
                        key={department.key}
                        href={department.href}
                        className={cn(
                            'group flex items-start gap-3 rounded-lg border border-hairline bg-canvas p-4 transition-colors',
                            'hover:border-brand/40',
                            disconnected && 'opacity-70',
                        )}
                    >
                        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-canvas-soft text-brand transition-colors group-hover:bg-brand/10">
                            <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                            <span className="block font-medium text-ink">
                                {department.name}
                            </span>
                            <span className="mt-0.5 block text-[12px] text-muted-foreground">
                                {disconnected
                                    ? t('Not connected — set up in Settings')
                                    : department.value_label
                                      ? `${department.value ?? 0} ${department.value_label}`
                                      : t('Open module')}
                            </span>
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
