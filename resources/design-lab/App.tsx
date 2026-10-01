import { useEffect, useState } from 'react';
import { LabShell } from './components/LabShell';
import { parseLabLocation } from './lib/routes';
import type { LabRoute } from './lib/routes';
import { AccueilPage } from './pages/AccueilPage';
import { AdsHubPage } from './pages/AdsHubPage';
import { CampaignPage } from './pages/CampaignPage';
import { ContactDetailPage } from './pages/ContactDetailPage';
import { ContactsListPage } from './pages/ContactsListPage';
import { DealPage } from './pages/DealPage';
import { DealsListPage } from './pages/DealsListPage';
import { DevisPage } from './pages/DevisPage';
import { InboxPage } from './pages/InboxPage';
import { ReportsPage } from './pages/ReportsPage';
import { ShellPage } from './pages/ShellPage';
import { TokensPage } from './pages/TokensPage';
import {
    ActivitiesPage,
    CompaniesPage,
    CompanyPage,
    LeadsPage,
    OutboundPage,
    QuotesListPage,
    SegmentsPage,
    SettingsPage,
    TicketsPage,
    WorkflowsPage,
} from './pages/WorkspacePages';

function currentRoute(): LabRoute {
    return parseLabLocation(window.location.pathname, window.location.hash);
}

function renderRoute(route: LabRoute) {
    switch (route.name) {
        case 'accueil':
            return <AccueilPage />;
        case 'tokens':
            return <TokensPage />;
        case 'shell':
            return <ShellPage />;
        case 'inbox':
            return <InboxPage />;
        case 'contacts':
            return <ContactsListPage />;
        case 'contact':
            return <ContactDetailPage id={route.id} />;
        case 'companies':
            return <CompaniesPage />;
        case 'company':
            return <CompanyPage id={route.id} />;
        case 'leads':
            return <LeadsPage />;
        case 'deals':
            return <DealsListPage />;
        case 'deal':
            return <DealPage id={route.id} />;
        case 'quotes':
            return <QuotesListPage />;
        case 'devis':
            return <DevisPage id={route.id} />;
        case 'activities':
            return <ActivitiesPage />;
        case 'outbound':
            return <OutboundPage view={route.view} />;
        case 'ads':
            return <AdsHubPage view={route.view} />;
        case 'campaign':
            return <CampaignPage id={route.id} />;
        case 'tickets':
            return <TicketsPage />;
        case 'reports':
            return <ReportsPage view={route.view} />;
        case 'segments':
            return <SegmentsPage />;
        case 'workflows':
            return <WorkflowsPage />;
        case 'settings':
            return <SettingsPage />;
        default:
            return <AccueilPage />;
    }
}

export function App() {
    const [route, setRoute] = useState<LabRoute>(currentRoute);

    useEffect(() => {
        const onChange = () => {
            setRoute(currentRoute());
        };

        window.addEventListener('popstate', onChange);
        window.addEventListener('hashchange', onChange);

        return () => {
            window.removeEventListener('popstate', onChange);
            window.removeEventListener('hashchange', onChange);
        };
    }, []);

    if (route.name === 'shell') {
        return renderRoute(route);
    }

    return <LabShell route={route}>{renderRoute(route)}</LabShell>;
}
