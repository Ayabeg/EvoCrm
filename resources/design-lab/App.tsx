import { useEffect, useState } from 'react';
import { LabShell } from './components/LabShell';
import { parseLabLocation } from './lib/routes';
import type { LabRoute } from './lib/routes';
import { AccueilPage } from './pages/AccueilPage';
import { AdsHubPage } from './pages/AdsHubPage';
import { ContactDetailPage } from './pages/ContactDetailPage';
import { ContactsListPage } from './pages/ContactsListPage';
import { DealPage } from './pages/DealPage';
import { DevisPage } from './pages/DevisPage';
import { ReportsPage } from './pages/ReportsPage';

function currentRoute(): LabRoute {
    return parseLabLocation(window.location.pathname, window.location.hash);
}

const TITLES: Record<LabRoute['name'], string> = {
    accueil: 'Accueil',
    ads: 'Ads Hub',
    contacts: 'Contacts',
    contact: 'Contact',
    deal: 'Deal',
    devis: 'Devis',
    reports: 'Reports',
};

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

    let body = <AccueilPage />;

    if (route.name === 'ads') {
        body = <AdsHubPage />;
    } else if (route.name === 'contacts') {
        body = <ContactsListPage />;
    } else if (route.name === 'contact') {
        body = <ContactDetailPage id={route.id} />;
    } else if (route.name === 'deal') {
        body = <DealPage id={route.id} />;
    } else if (route.name === 'devis') {
        body = <DevisPage id={route.id} />;
    } else if (route.name === 'reports') {
        body = <ReportsPage />;
    }

    return (
        <LabShell route={route} title={TITLES[route.name]}>
            {body}
        </LabShell>
    );
}
