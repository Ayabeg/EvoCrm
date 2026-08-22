import { Link } from '@inertiajs/react';
import {
    Building2,
    Contact,
    Handshake,
    Home,
    Inbox,
    Mail,
    Megaphone,
    MessageCircle,
    Settings2,
    Target,
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

const homeItems: NavItem[] = [
    { title: 'Home', href: '/dashboard', icon: Home },
    { title: 'Desk', href: '/desk', icon: Inbox },
];

const crmItems: NavItem[] = [
    { title: 'Companies', href: '/crm/companies', icon: Building2 },
    { title: 'Contacts', href: '/crm/contacts', icon: Contact },
    { title: 'Leads', href: '/crm/leads', icon: Target },
    { title: 'Deals', href: '/crm/deals', icon: Handshake },
];

const growthItems: NavItem[] = [
    { title: 'Ads Center', href: '/ads', icon: Megaphone },
    { title: 'Mailboxes', href: '/outbound/mailboxes', icon: Mail },
    { title: 'Sequences', href: '/outbound/sequences', icon: Workflow },
    { title: 'WA Templates', href: '/outbound/templates', icon: MessageCircle },
];

const settingsItems: NavItem[] = [
    { title: 'Evolution / WhatsApp', href: '/settings/evolution', icon: Settings2 },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
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
