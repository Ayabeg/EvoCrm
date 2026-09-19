import { PlaceholderCard } from '@/components/PlaceholderCard';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { P0_API_BLOCKERS } from '@/lib/api/catalog';

export default function ActivitiesScreen() {
  return (
    <ScreenScaffold title="Activities" eyebrow="Placeholder">
      <PlaceholderCard title="Queue" body="READY later: GET /api/v1/activities and POST /api/v1/activities." />
      <PlaceholderCard title="Complete" body={P0_API_BLOCKERS.activityComplete.reason} tone="blocked" />
    </ScreenScaffold>
  );
}
