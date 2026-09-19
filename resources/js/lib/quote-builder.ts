/**
 * P18 quote split-builder helpers. Lifecycle URLs stay the existing Quote routes.
 * Do not import this from the Quotes list or public accept page.
 */

export const QUOTE_TIMEZONE = 'Africa/Algiers';

export const QUOTE_BUILDER_SPLIT_CLASS =
    'flex min-h-0 flex-1 flex-col overflow-hidden';

export const QUOTE_BUILDER_DESKTOP_GRID_CLASS =
    'flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:gap-px lg:bg-hairline';

export const QUOTE_DOCUMENT_PAPER_CLASS =
    'mx-auto w-full max-w-[40rem] border border-hairline bg-canvas px-5 py-6 sm:px-8 sm:py-8';

/** Builder totals and line money. Never truncate / overflow-hidden. */
export const QUOTE_MONEY_CLASS =
    'money min-w-0 max-w-full break-words tabular-nums';

export function formatQuoteWhen(iso?: string | null): string | null {
    if (!iso) {
        return null;
    }

    try {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: QUOTE_TIMEZONE,
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

export function quoteDateInputValue(iso?: string | null): string {
    if (!iso) {
        return '';
    }

    try {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: QUOTE_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso.slice(0, 10);
    }
}

export function quoteUnitDzd(unitCents: number | null | undefined): string {
    return String(Math.round((unitCents ?? 0) / 100));
}

export function quoteCanEdit(input: {
    immutable: boolean;
    canUpdate: boolean;
}): boolean {
    return Boolean(input.canUpdate) && !input.immutable;
}

export function quoteListHref(): string {
    return '/crm/quotes';
}

export function quotePreviewHref(id: number): string {
    return `/crm/quotes/${id}/preview`;
}

export function quoteSendAction(id: number): string {
    return `/crm/quotes/${id}/send`;
}

export function quoteRevokeAction(id: number): string {
    return `/crm/quotes/${id}/revoke`;
}

export function quoteUpdateAction(id: number): string {
    return `/crm/quotes/${id}`;
}
