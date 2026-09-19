import { useLocalSearchParams } from 'expo-router';

import { PlaceholderCard } from '@/components/PlaceholderCard';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { parseDeepLink, type DeepLinkObject } from '@/lib/deeplink/routes';

type Props = {
  object: DeepLinkObject;
  title: string;
};

export function RecordPlaceholder({ object, title }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const route = parseDeepLink(`evocrm://${object}/${id ?? ''}`);

  return (
    <ScreenScaffold title={title} eyebrow="Deep link · no fake data">
      <PlaceholderCard title={`ID ${id ?? '—'}`} body="This screen is a route seam only. M06R does not load CRM records." />
      {route?.showEndpoint ? (
        <PlaceholderCard
          title="Hydration when a later phase ships"
          body={`GET /api/v1${route.showEndpoint.path.replace('{id}', id ?? '{id}')}`}
        />
      ) : null}
      {route?.blocker ? <PlaceholderCard title="Backend handoff" body={route.blocker} tone="blocked" /> : null}
    </ScreenScaffold>
  );
}
