/**
 * Canonical PageHeader owner.
 * Production `ds/chrome/PageHeader` re-exports this in a later cleanup;
 * PR3 documents the owner and keeps the existing file (1 consumer: DataWorkspace).
 */

export { PageHeader, type PageHeaderProps } from '@/ds/chrome/PageHeader';
