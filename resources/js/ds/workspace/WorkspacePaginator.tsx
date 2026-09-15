import { Link } from '@inertiajs/react';
import { workspacePageHref } from '@/ds/workspace/surface';
import type { DataWorkspaceEntity, DataWorkspacePaginator } from '@/ds/workspace/types';
import { t } from '@/lib/i18n';

const OBJECT_NOUNS = {
    contact: 'contacts',
    company: 'companies',
    deal: 'deals',
    ticket: 'records',
    quote: 'quotes',
    lead: 'leads',
} as const;

/**
 * Shared-table footer. Live paginator via `listPageHref` (P03C query).
 * Domain pages keep `CrmListFooter` until object migrations (P04+).
 * Pad-x 32 at md to match workspace chrome.
 */
export function WorkspacePaginator({
    object,
    basePath,
    filters,
    extraQuery = {},
    pageCount,
    paginator,
    exportHref,
}: {
    object: DataWorkspaceEntity;
    basePath: string;
    filters: Record<string, unknown>;
    extraQuery?: Record<string, string | number | null | undefined>;
    pageCount: number;
    paginator: DataWorkspacePaginator;
    exportHref?: string;
}) {
    return (
        <footer
            className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-canvas px-4 py-2 text-[12px] text-mute md:px-8"
            data-ds="workspace-paginator"
        >
            <span>
                {t('Showing :count of :total :noun', {
                    count: pageCount.toLocaleString(),
                    total: paginator.total.toLocaleString(),
                    noun: t(OBJECT_NOUNS[object]),
                })}
            </span>
            <nav className="flex items-center gap-2" aria-label={t('Pagination')}>
                {paginator.page > 1 ? (
                    <Link
                        href={workspacePageHref(
                            basePath,
                            filters,
                            paginator.page - 1,
                            extraQuery,
                        )}
                        className="hover:text-ink"
                    >
                        {t('Prev')}
                    </Link>
                ) : (
                    <span className="opacity-40">{t('Prev')}</span>
                )}
                <span>
                    {paginator.page} / {paginator.lastPage}
                </span>
                {paginator.page < paginator.lastPage ? (
                    <Link
                        href={workspacePageHref(
                            basePath,
                            filters,
                            paginator.page + 1,
                            extraQuery,
                        )}
                        className="hover:text-ink"
                    >
                        {t('Next')}
                    </Link>
                ) : (
                    <span className="opacity-40">{t('Next')}</span>
                )}
                {exportHref ? (
                    <a href={exportHref} className="hover:text-ink">
                        {t('Export')}
                    </a>
                ) : null}
            </nav>
        </footer>
    );
}
