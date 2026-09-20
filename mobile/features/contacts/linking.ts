/** Safe mailto / tel builders. Empty or malformed values must not crash. */

export function buildMailtoUrl(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  // Reject whitespace/newlines and obvious non-emails; Linking still owns platform handling.
  if (/\s/.test(trimmed)) return null;
  if (!trimmed.includes('@')) return null;
  return `mailto:${trimmed}`;
}

export function buildTelUrl(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;
  // Keep leading +, digits, spaces, dashes, parentheses — strip other junk.
  const cleaned = trimmed.replace(/[^\d+()\-\s]/g, '');
  if (!cleaned || !/\d/.test(cleaned)) return null;
  const hrefTarget = cleaned.replace(/[^\d+]/g, '');
  if (!hrefTarget || hrefTarget === '+') return null;
  return `tel:${hrefTarget}`;
}

export async function openExternalUrl(
  url: string | null,
  openUrl: (url: string) => Promise<void> = defaultOpen,
): Promise<boolean> {
  if (!url) return false;
  try {
    await openUrl(url);
    return true;
  } catch {
    return false;
  }
}

async function defaultOpen(url: string): Promise<void> {
  const { Linking } = await import('react-native');
  await Linking.openURL(url);
}
