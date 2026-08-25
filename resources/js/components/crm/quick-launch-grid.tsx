import { Link } from '@inertiajs/react';
import {
    Inbox,
    Megaphone,
    Send,
    Users,
    UserCircle,
    Plug,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Department = {
    key: string;
    name: string;
    href: string;
    value?: number;
    value_label?: string;
    connected?: boolean;
};

const ICONS: Record<string, LucideIcon> = {
    inbox: Inbox,
    leads: Megaphone,
    contacts: UserCircle,
    ads: Megaphone,
    outbound: Send,
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
                            'group flex items-start gap-3 rounded-lg border border-hairline bg-canvas p-4 transition-all',
                            'hover:border-brand/40 hover:shadow-sm',
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
                                    ? 'Not connected — set up in Settings'
                                    : department.value_label
                                      ? `${department.value ?? 0} ${department.value_label}`
                                      : 'Open module'}
                            </span>
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
