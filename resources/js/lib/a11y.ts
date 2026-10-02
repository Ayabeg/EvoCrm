import { t } from '@/lib/i18n';

/**
 * P26 — small a11y helpers. Prefer native HTML at the call site.
 * Do not import this from Inertia pages as a new widget kit.
 */

const FOCUSABLE =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function isActivationKey(key: string): boolean {
    return key === 'Enter' || key === ' ';
}

export function unreadCountLabel(count: number): string {
    if (count <= 0) {
        return '';
    }

    return count === 1 ? t('1 unread') : t(':count unread', { count });
}

export function conversationA11yName(input: {
    name: string;
    unread: number;
    selected: boolean;
}): string {
    const parts = [input.name];
    const unread = unreadCountLabel(input.unread);

    if (unread !== '') {
        parts.push(unread);
    }

    if (input.selected) {
        parts.push(t('selected'));
    }

    return parts.join(', ');
}

export function focusableElements(root: ParentNode): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => {
        if (element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
            return false;
        }

        return element.closest('[aria-hidden="true"]') === null;
    });
}

/** Keep Tab inside a non-Radix dialog. No-op when there is nothing to cycle. */
export function trapTabKey(event: { key: string; shiftKey: boolean; preventDefault: () => void }, root: HTMLElement): void {
    if (event.key !== 'Tab') {
        return;
    }

    const nodes = focusableElements(root);

    if (nodes.length === 0) {
        return;
    }

    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();

        return;
    }

    if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
    }
}

export function restoreFocus(opener: HTMLElement | null | undefined): void {
    if (!opener || typeof opener.focus !== 'function') {
        return;
    }

    window.setTimeout(() => opener.focus(), 0);
}
