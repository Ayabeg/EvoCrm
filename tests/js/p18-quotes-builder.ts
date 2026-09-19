/**
 * Test-only P18 quote builder proofs. Never import from an Inertia page.
 */
import {
    canCreateQuote,
    commandCreateItems,
} from '../../resources/js/lib/command-os';
import {
    QUOTE_BUILDER_DESKTOP_GRID_CLASS,
    QUOTE_BUILDER_SPLIT_CLASS,
    QUOTE_DOCUMENT_PAPER_CLASS,
    QUOTE_MONEY_CLASS,
    QUOTE_TIMEZONE,
    formatQuoteWhen,
    quoteCanEdit,
    quoteDateInputValue,
    quoteListHref,
    quotePreviewHref,
    quoteRevokeAction,
    quoteSendAction,
    quoteUnitDzd,
    quoteUpdateAction,
} from '../../resources/js/lib/quote-builder';

function expectEqual<T>(actual: T, expected: T, label: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function expectTrue(value: boolean, label: string): void {
    if (!value) {
        throw new Error(label);
    }
}

expectEqual(QUOTE_TIMEZONE, 'Africa/Algiers', 'timezone');
expectEqual(quoteListHref(), '/crm/quotes', 'list href');
expectEqual(quotePreviewHref(12), '/crm/quotes/12/preview', 'preview href');
expectEqual(quoteSendAction(12), '/crm/quotes/12/send', 'send action');
expectEqual(quoteRevokeAction(12), '/crm/quotes/12/revoke', 'revoke action');
expectEqual(quoteUpdateAction(12), '/crm/quotes/12', 'update action');
expectEqual(quoteCanEdit({ immutable: false, canUpdate: true }), true, 'authorized draft is editable');
expectEqual(quoteCanEdit({ immutable: true, canUpdate: true }), false, 'sent is immutable');
expectEqual(quoteCanEdit({ immutable: false, canUpdate: false }), false, 'member cannot edit draft');
expectEqual(quoteCanEdit({ immutable: true, canUpdate: false }), false, 'member cannot edit sent');
expectEqual(canCreateQuote(['crm.view']), false, 'member cannot create quote');
expectEqual(canCreateQuote(['crm.view', 'crm.edit']), true, 'editor can create quote');
expectEqual(
    commandCreateItems(['crm.view']).some((item) => item.id === 'create-quote'),
    false,
    'command OS hides create-quote without crm.edit',
);
expectEqual(
    commandCreateItems(['crm.edit']).some((item) => item.id === 'create-quote'),
    true,
    'command OS shows create-quote with crm.edit',
);
expectEqual(quoteUnitDzd(18_000_000), '180000', 'cents to DZD input');
expectEqual(quoteDateInputValue(null), '', 'empty date');
const formattedWhen = formatQuoteWhen('2026-09-17T09:00:00+01:00');
expectTrue(formattedWhen !== null && !formattedWhen.includes('NaN'), 'formats Algiers date');
expectTrue(QUOTE_BUILDER_SPLIT_CLASS.includes('flex-col'), 'stacked below lg');
expectTrue(QUOTE_BUILDER_DESKTOP_GRID_CLASS.includes('flex-col'), 'one tree stacks below lg');
expectTrue(QUOTE_BUILDER_DESKTOP_GRID_CLASS.includes('lg:grid'), 'split from lg');
expectTrue(
    QUOTE_BUILDER_DESKTOP_GRID_CLASS.includes('lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]'),
    'document + properties rail',
);
expectTrue(!QUOTE_BUILDER_DESKTOP_GRID_CLASS.includes('grid-cols-3'), 'not a 3-pane triad');
expectTrue(!QUOTE_BUILDER_DESKTOP_GRID_CLASS.startsWith('hidden'), 'builder is not display-none below lg');
expectTrue(QUOTE_DOCUMENT_PAPER_CLASS.includes('max-w-[40rem]'), 'paper is readable at 768');
expectTrue(QUOTE_DOCUMENT_PAPER_CLASS.includes('bg-canvas'), 'paper uses canvas token');
expectTrue(QUOTE_MONEY_CLASS.includes('break-words'), 'quote money may wrap');
expectTrue(!QUOTE_MONEY_CLASS.includes('truncate'), 'quote money is never truncated');
expectTrue(!QUOTE_MONEY_CLASS.includes('overflow-hidden'), 'quote money is never clipped');

console.log('P18 quotes builder JS proofs passed');
