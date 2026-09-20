import { buildMailtoUrl, buildTelUrl, openExternalUrl } from '@/features/contacts/linking';

describe('buildMailtoUrl', () => {
  it('returns mailto for simple emails', () => {
    expect(buildMailtoUrl('amine@clinic.dz')).toBe('mailto:amine@clinic.dz');
  });

  it('rejects empty / whitespace / missing @', () => {
    expect(buildMailtoUrl('')).toBeNull();
    expect(buildMailtoUrl('   ')).toBeNull();
    expect(buildMailtoUrl(null)).toBeNull();
    expect(buildMailtoUrl('not-an-email')).toBeNull();
    expect(buildMailtoUrl('a b@x.com')).toBeNull();
  });
});

describe('buildTelUrl', () => {
  it('accepts e164 and local digits', () => {
    expect(buildTelUrl('+213550188001')).toBe('tel:+213550188001');
    expect(buildTelUrl('0550 188 001')).toBe('tel:0550188001');
  });

  it('rejects empty / no digits', () => {
    expect(buildTelUrl('')).toBeNull();
    expect(buildTelUrl('---')).toBeNull();
    expect(buildTelUrl(undefined)).toBeNull();
  });
});

describe('openExternalUrl', () => {
  it('returns false for null and swallows open failures', async () => {
    expect(await openExternalUrl(null)).toBe(false);
    expect(
      await openExternalUrl('mailto:a@b.c', async () => {
        throw new Error('boom');
      }),
    ).toBe(false);
    expect(await openExternalUrl('mailto:a@b.c', async () => undefined)).toBe(true);
  });
});
