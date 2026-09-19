import { PlaceholderCard } from '@/components/PlaceholderCard';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { P0_API_BLOCKERS } from '@/lib/api/catalog';

export default function HomeScreen() {
  return (
    <ScreenScaffold title="Home" eyebrow="Placeholder">
      <PlaceholderCard
        title="No home feed"
        body={P0_API_BLOCKERS.homeFeed.reason}
        tone="blocked"
      />
      <PlaceholderCard
        title="Daily loop later"
        body="Attention items, overdue tasks, and unread threads will bind to GET /api/v1/home when Laravel exposes it."
      />
    </ScreenScaffold>
  );
}
