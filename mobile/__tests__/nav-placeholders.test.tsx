import { render } from '@testing-library/react-native';

import HomeScreen from '@/app/(tabs)/index';
import CrmScreen from '@/app/(tabs)/crm';
import InboxScreen from '@/app/(tabs)/inbox';
import ActivitiesScreen from '@/app/(tabs)/activities';

describe('tab placeholders', () => {
  it('renders Home blocker chrome', async () => {
    const view = await render(<HomeScreen />);
    expect(view.getByText('Home')).toBeTruthy();
    expect(view.getByText(/HomeDashboardBuilder/)).toBeTruthy();
  });

  it('renders CRM nested prep and deals-list blocker', async () => {
    const view = await render(<CrmScreen />);
    expect(view.getByText('CRM')).toBeTruthy();
    expect(view.getByText(/paginated deals list does not/)).toBeTruthy();
  });

  it('renders Inbox thread-show blocker', async () => {
    const view = await render(<InboxScreen />);
    expect(view.getByText('Inbox')).toBeTruthy();
    expect(view.getByText(/thread\+messages show does not/)).toBeTruthy();
  });

  it('renders Activities complete blocker', async () => {
    const view = await render(<ActivitiesScreen />);
    expect(view.getByText('Activities')).toBeTruthy();
    expect(view.getByText(/Completing a task is not exposed/)).toBeTruthy();
  });
});
