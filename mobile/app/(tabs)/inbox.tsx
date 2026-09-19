import { PlaceholderCard } from '@/components/PlaceholderCard';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { P0_API_BLOCKERS } from '@/lib/api/catalog';

export default function InboxScreen() {
  return (
    <ScreenScaffold title="Inbox" eyebrow="Placeholder">
      <PlaceholderCard title="Thread list" body="READY later: GET /api/v1/threads and POST /api/v1/threads/{id}/reply." />
      <PlaceholderCard title="Thread show" body={P0_API_BLOCKERS.threadShow.reason} tone="blocked" />
    </ScreenScaffold>
  );
}
