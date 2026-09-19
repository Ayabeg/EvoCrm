import { PlaceholderCard } from '@/components/PlaceholderCard';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { P0_API_BLOCKERS } from '@/lib/api/catalog';

export default function CrmScreen() {
  return (
    <ScreenScaffold title="CRM" eyebrow="Placeholder · nested prep">
      <PlaceholderCard title="Contacts" body="READY later: GET/POST /api/v1/contacts and GET/PUT /api/v1/contacts/{id}." />
      <PlaceholderCard title="Companies" body="GET /api/v1/companies is not in v1. Deep link route exists without fake records." />
      <PlaceholderCard title="Leads" body="READY later: GET /api/v1/leads/board, GET /api/v1/leads/{id}, POST qualify." />
      <PlaceholderCard
        title="Deals"
        body={`Show/move are READY. ${P0_API_BLOCKERS.dealsList.reason}`}
        tone="blocked"
      />
    </ScreenScaffold>
  );
}
