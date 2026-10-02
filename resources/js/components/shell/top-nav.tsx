import { Link, usePage } from '@inertiajs/react';
import type { Icon } from '@phosphor-icons/react';
import {
    AddressBook,
    Buildings,
    ChartLine,
    CheckSquare,
    FileText,
    FlowArrow,
    Handshake,
    House,
    Megaphone,
    PaperPlaneTilt,
    Path,
    Tray,
} from '@phosphor-icons/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/evo/ui/tooltip';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Dest = {
    id: string;
    label: string;
    href: string;
    icon: Icon;
    also?: string[];
};

const DESTINATIONS: Dest[] = [
    { id: 'home', label: 'Home', href: '/dashboard', icon: House, also: ['/'] },
    { id: 'contacts', label: 'Contacts', href: '/crm/contacts', icon: AddressBook },
    { id: 'companies', label: 'Companies', href: '/crm/companies', icon: Buildings },
    { id: 'leads', label: 'Leads', href: '/crm/leads', icon: Path },
    { id: 'deals', label: 'Deals', href: '/crm/deals', icon: Handshake },
    { id: 'inbox', label: 'Inbox', href: '/inbox', icon: Tray, also: ['/desk', '/conversations'] },
    { id: 'activities', label: 'Activities', href: '/crm/activities', icon: CheckSquare },
    { id: 'quotes', label: 'Quotes', href: '/crm/quotes', icon: FileText },
    { id: 'workflows', label: 'Workflows', href: '/crm/workflows', icon: FlowArrow, also: ['/automation'] },
    { id: 'ads', label: 'Ads', href: '/ads', icon: Megaphone },
    { id: 'outbound', label: 'Outbound', href: '/outbound', icon: PaperPlaneTilt },
    { id: 'reports', label: 'Reports', href: '/reports', icon: ChartLine },
];

function matches(path: string, item: Dest): boolean {
    const roots = [item.href, ...(item.also ?? [])];

    return roots.some((root) => path === root || (root !== '/' && path.startsWith(`${root}/`)));
}

export function TopNav() {
    const page = usePage();
    const path = (page.url.split('?')[0] ?? '/').split('#')[0] ?? '/';
    const { simpleMode, nav, features } = useSimpleMode();
    const allowed = simpleMode ? new Set(nav.map((item) => item.id)) : null;
    const items = DESTINATIONS.filter((item) => {
        if (item.id === 'ads' && !features.ads) {
            return false;
        }

        if (allowed && !allowed.has(item.id)) {
            return false;
        }

        return true;
    });

    return (
        <nav aria-label="Destinations" className="flex h-16 min-w-0 items-center gap-2 overflow-x-auto">
            {items.map((item) => {
                const active = matches(path, item);
                const Icon = item.icon;
                const control = (
                    <Link
                        href={item.href}
                        prefetch
                        aria-label={t(item.label)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'flex h-12 shrink-0 items-center justify-center rounded-full text-shell-muted transition-[background-color,color,padding,max-width] duration-200 motion-reduce:transition-none',
                            active
                                ? 'gap-2 bg-shell-track px-4 text-[15px] font-semibold text-shell-ink'
                                : 'w-11 hover:bg-[var(--evo-hover)] hover:text-shell-ink',
                        )}
                    >
                        <Icon className="size-5 shrink-0" weight="regular" aria-hidden />
                        <span
                            className={cn(
                                'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 motion-reduce:transition-none',
                                active ? 'max-w-40 opacity-100' : 'max-w-0 opacity-0',
                            )}
                        >
                            {t(item.label)}
                        </span>
                    </Link>
                );

                if (active) {
                    return <div key={item.id}>{control}</div>;
                }

                return (
                    <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{control}</TooltipTrigger>
                        <TooltipContent side="bottom">{t(item.label)}</TooltipContent>
                    </Tooltip>
                );
            })}
        </nav>
    );
}
