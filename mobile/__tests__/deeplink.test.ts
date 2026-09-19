import { buildDeepLink, parseDeepLink } from '@/lib/deeplink/routes';

describe('deep links', () => {
  it('parses evocrm object URLs without fabricating records', () => {
    const contact = parseDeepLink('evocrm://contact/9');
    expect(contact?.href).toBe('/contact/9');
    expect(contact?.showEndpoint?.path).toBe('/contacts/{id}');
    expect(contact?.blocker).toBeNull();
  });

  it('marks blocked objects honestly', () => {
    expect(parseDeepLink('evocrm://thread/18')?.blocker).toMatch(/G04/);
    expect(parseDeepLink('evocrm://company/3')?.showEndpoint).toBeNull();
    expect(parseDeepLink('evocrm://activity/4')?.blocker).toMatch(/activities/);
  });

  it('builds the custom scheme', () => {
    expect(buildDeepLink('deal', 44)).toBe('evocrm://deal/44');
  });
});
