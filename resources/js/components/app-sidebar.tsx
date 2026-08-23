import { Link, usePage } from '@inertiajs/react';
import {
    Ban,
    Building2,
    Clock3,
    Contact,
    Handshake,
    Home,
    Inbox,
    Mail,
    ListFilter,
    Megaphone,
    MessageCircle,
    MessagesSquare,
    Settings2,
    Target,
    UserMinus,
    Workflow,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { deskUrl } = usePage<{ deskUrl?: string }>().props;
    const inbox = deskUrl || 'https://desk.evotechly.com';

    const homeItems: NavItem[] = [
        { title: 'Home', href: '/dashboard', icon: Home },
        { title: 'Desk', href: inbox, icon: Inbox, external: true },
    ];

    const crmItems: NavItem[] = [
        { title: 'Companies', href: '/crm/companies', icon: Building2 },
        { title: 'Contacts', href: '/crm/contacts', icon: Contact },
        { title: 'Leads', href: '/crm/leads', icon: Target },
        { title: 'Deals', href: '/crm/deals', icon: Handshake },
        { title: 'Unassigned', href: '/crm/deals?unassigned=1', icon: UserMinus },
        { title: 'Reports', href: '/crm/reports', icon: ListFilter },
        {
            title: 'Conversations',
            href: '/conversations',
            icon: MessagesSquare,
        },
    ];

    const growthItems: NavItem[] = [
        { title: 'Ads Center', href: '/ads', icon: Megaphone },
        { title: 'Mailboxes', href: '/outbound/mailboxes', icon: Mail },
        { title: 'Sequences', href: '/outbound/sequences', icon: Workflow },
        { title: 'WA Templates', href: '/outbound/templates', icon: MessageCircle },
        { title: 'Suppression', href: '/outbound/suppressions', icon: Ban },
        { title: 'Quiet hours', href: '/outbound/quiet-hours', icon: Clock3 },
    ];

    const settingsItems: NavItem[] = [
        { title: 'Evolution / WhatsApp', href: '/settings/evolution', icon: Settings2 },
        { title: 'Channels', href: '/settings/channels', icon: Settings2 },
        { title: 'Custom attributes', href: '/settings/attributes', icon: Settings2 },
    ];

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={homeItems} label="Workspace" />
                <NavMain items={crmItems} label="CRM" />
                <NavMain items={growthItems} label="Growth" />
                <NavMain items={settingsItems} label="Control plane" />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
