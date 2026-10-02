import { useEffect, useState } from 'react';
import { LabShell } from './components/LabShell';
import { parseLabLocation } from './lib/routes';
import type { LabRoute } from './lib/routes';
import { AccueilPage } from './pages/AccueilPage';
import { AdsHubPage } from './pages/AdsHubPage';
import { AgentsPage } from './pages/AgentsPage';
import { AutomationLabPage } from './pages/AutomationLabPage';
import { CampaignPage } from './pages/CampaignPage';
import { ComponentsPage } from './pages/ComponentsPage';
import { ContactDetailPage } from './pages/ContactDetailPage';
import { ContactsListPage } from './pages/ContactsListPage';
import { DataPage } from './pages/DataPage';
import { DealPage } from './pages/DealPage';
import { DealsListPage } from './pages/DealsListPage';
import { DevisPage } from './pages/DevisPage';
import { InboxPage } from './pages/InboxPage';
import { OutboundLabPage } from './pages/OutboundLabPage';
import { PipelineLabPage } from './pages/PipelineLabPage';
import { QuoteLabPage } from './pages/QuoteLabPage';
import { RecordLabPage } from './pages/RecordLabPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsLabPage } from './pages/SettingsLabPage';
import { ShellPage } from './pages/ShellPage';
import { TokensPage } from './pages/TokensPage';
import {
    ActivitiesPage,
    CompaniesPage,
    CompanyPage,
    LeadsPage,
    QuotesListPage,
    SegmentsPage,
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
        case 'components':
            return <ComponentsPage />;
        case 'data':
            return <DataPage />;
        case 'agents':
            return <AgentsPage />;
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
        case 'record':
            return <RecordLabPage />;
        case 'pipeline':
            return <PipelineLabPage />;
        case 'quote':
            return <QuoteLabPage />;
        case 'quotes':
            return <QuotesListPage />;
        case 'devis':
            return <DevisPage id={route.id} />;
        case 'activities':
            return <ActivitiesPage />;
        case 'outbound':
            return <OutboundLabPage view={route.view} />;
        case 'ads':
            return <AdsHubPage view={route.view} />;
        case 'campaign':
            return <CampaignPage id={route.id} />;
        case 'tickets':
            return <TicketsPage />;
        case 'reports':
            return <ReportsPage view={route.view} />;
        case 'automation':
            return <AutomationLabPage view={route.view} />;
        case 'segments':
            return <SegmentsPage />;
        case 'workflows':
            return <WorkflowsPage />;
        case 'settings':
            return <SettingsLabPage />;
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
