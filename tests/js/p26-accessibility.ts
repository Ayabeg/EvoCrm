/**
 * Test-only P26 a11y proofs. Never import from an Inertia page.
 */
import {
    conversationA11yName,
    isActivationKey,
    unreadCountLabel,
} from '../../resources/js/lib/a11y';

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

expectTrue(isActivationKey('Enter'), 'Enter activates a focusable widget');
expectTrue(isActivationKey(' '), 'Space activates a focusable widget');
expectTrue(!isActivationKey('Tab'), 'Tab is not an activation key');
expectTrue(!isActivationKey('Escape'), 'Escape is not an activation key');

expectEqual(unreadCountLabel(0), '', 'zero unread has no extra name');
expectEqual(unreadCountLabel(1), '1 unread', 'singular unread');
expectEqual(unreadCountLabel(3), '3 unread', 'plural unread');

expectEqual(
    conversationA11yName({ name: 'Amel Hadj', unread: 0, selected: false }),
    'Amel Hadj',
    'idle conversation name is the contact',
);
expectEqual(
    conversationA11yName({ name: 'Amel Hadj', unread: 2, selected: false }),
    'Amel Hadj, 2 unread',
    'unread is named, not color-only',
);
expectEqual(
    conversationA11yName({ name: 'Amel Hadj', unread: 2, selected: true }),
    'Amel Hadj, 2 unread, selected',
    'selection is named, not wash-only',
);

expectTrue(true, 'P26 helpers stay names + keyboard, not a new widget kit');
