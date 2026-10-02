import { t } from '@/lib/i18n';
import { listQueryObjectFromPath } from '@/lib/list-query/adapters';
import { writeListHref } from '@/lib/list-query/href';
import { hrefFromActiveFilters } from '@/lib/list-query/serialize';

export type ListFilters = Record<string, unknown>;

export function crmListHref(
    base: string,
    filters: ListFilters,
    patch: ListFilters = {},
): string {
    const merged: ListFilters = { ...filters, ...patch };

    return writeListHref(base, merged);
}

/**
 * Chrome-filter projection for chips and GET forms.
 * Not the workspace query bag — it omits page, extras.pipeline,
 * URL sort/direction, and association keys. Navigation must use
 * `hrefFromActiveFilters` / `navigateListQuery` so siblings survive.
 */
export function filterFields(filters: ListFilters): ListFilters {
    return {
        view: filters.view,
        q: filters.q,
        owner: filters.owner,
        created: filters.created,
        last_activity: filters.last_activity,
        status: filters.status,
        stage: filters.stage,
        city: filters.city,
        wilaya: filters.wilaya,
        unanswered: filters.unanswered,
        unassigned: filters.unassigned,
        priority: filters.priority,
        channel: filters.channel,
        attention: filters.attention,
        filter_id: filters.filter_id,
        filter_groups: filters.filter_groups,
    };
}

const CREATED_LABELS: Record<string, string> = {
    today: 'Today',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
};

const ACTIVITY_LABELS: Record<string, string> = {
    '7d': '7 days',
    '30d': '30 days',
    none: 'None',
};

export function listPageHref(
    base: string,
    filters: ListFilters,
    page: number,
    extra: ListFilters = {},
): string {
    return hrefFromActiveFilters(
        base,
        filters,
        extra,
        { page: page > 1 ? page : null },
        listQueryObjectFromPath(base),
    );
}

export function hasActiveListFilters(filters: ListFilters): boolean {
    const query = filters.q == null ? '' : String(filters.q).trim();

    return (
        listFilterChips(filters).length > 0 ||
        (filters.view != null && filters.view !== 'all') ||
        query !== ''
    );
}

export function listFilterChips(
    filters: ListFilters,
    members: { id: number; name: string }[] = [],
): { key: string; label: string; value: string }[] {
    const fields = filterFields(filters);
    const chips: { key: string; label: string; value: string }[] = [];
    const owner = fields.owner == null ? '' : String(fields.owner);

    if (owner === 'unassigned') {
        chips.push({ key: 'owner', label: t('Owner'), value: t('Unassigned') });
    } else if (owner) {
        const member = members.find((row) => String(row.id) === owner);
        chips.push({
            key: 'owner',
            label: t('Owner'),
            value: member?.name ?? owner,
        });
    }

    if (fields.created) {
        const key = String(fields.created);
        chips.push({
            key: 'created',
            label: t('Created'),
            value: t(CREATED_LABELS[key] ?? key),
        });
    }

    if (fields.last_activity) {
        const key = String(fields.last_activity);
        chips.push({
            key: 'last_activity',
            label: t('Last activity'),
            value: t(ACTIVITY_LABELS[key] ?? key),
        });
    }

    if (fields.status) {
        chips.push({
            key: 'status',
            label: t('Status'),
            value: String(fields.status).replace(/_/g, ' '),
        });
    }

    if (fields.priority) {
        chips.push({
            key: 'priority',
            label: t('Priority'),
            value: String(fields.priority),
        });
    }

    if (fields.channel) {
        chips.push({
            key: 'channel',
            label: t('Channel'),
            value: String(fields.channel).replace(/_/g, ' '),
        });
    }

    if (fields.attention) {
        const key = String(fields.attention);
        chips.push({
            key: 'attention',
            label: t('Attention'),
            value:
                key === 'needs_attention'
                    ? t('Needs attention')
                    : key === 'no_next_action'
                      ? t('No next action')
                      : key === 'overdue'
                        ? t('Overdue')
                        : key,
        });
    }

    if (fields.stage) {
        chips.push({ key: 'stage', label: t('Stage'), value: String(fields.stage) });
    }

    if (fields.city) {
        chips.push({ key: 'city', label: 'City', value: String(fields.city) });
    }

    if (fields.wilaya) {
        chips.push({ key: 'wilaya', label: 'Wilaya', value: String(fields.wilaya) });
    }

    if (fields.unanswered) {
        chips.push({ key: 'unanswered', label: 'Unanswered', value: 'Yes' });
    }

    if (fields.unassigned) {
        chips.push({ key: 'unassigned', label: 'Unassigned', value: 'Yes' });
    }

    return chips;
}
