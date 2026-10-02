import { Link, router } from '@inertiajs/react';
import { CrmShell } from '@/components/crm/crm-shell';
import { RecordBack } from '@/components/crm/record-chrome';
import { t } from '@/lib/i18n';

type DuplicateContact = {
    id: number;
    display_name: string;
    email?: string | null;
    phone_e164?: string | null;
    external_id?: string | null;
    company?: string | null;
};

type DuplicateGroup = {
    key: string;
    reasons: string[];
    contacts: DuplicateContact[];
};

export default function ContactDuplicates({ groups }: { groups: DuplicateGroup[] }) {
    return (
        <CrmShell title="Duplicate contacts">
            <div className="h-full overflow-auto bg-canvas">
                <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
                    <RecordBack href="/crm/contacts" label="Contacts" />
                    <div>
                        <h1 className="text-page-title text-ink">{t('Duplicate contacts')}</h1>
                        <p className="mt-1 text-[13px] text-mute">
                            {t('Groups share a normalized email, phone, or imported external ID.')}
                        </p>
                    </div>

                    {groups.length === 0 ? (
                        <p className="rounded-md border border-hairline px-4 py-6 text-[13px] text-mute">
                            {t('No duplicate groups in this workspace.')}
                        </p>
                    ) : (
                        <ul className="space-y-4">
                            {groups.map((group) => {
                                const [survivor, ...others] = group.contacts;

                                return (
                                    <li key={group.key} className="rounded-md border border-hairline">
                                        <div className="border-b border-hairline bg-canvas-soft px-4 py-2 text-[12px] text-mute">
                                            {t('Same :reasons', { reasons: group.reasons.map((reason) => t(reason)).join(', ') })}
                                        </div>
                                        <ul className="divide-y divide-hairline">
                                            {group.contacts.map((contact) => (
                                                <li
                                                    key={contact.id}
                                                    className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-canvas-soft"
                                                    onClick={(event) => {
                                                        const target = event.target as HTMLElement;

                                                        if (target.closest('a, input, button, label')) {
                                                            return;
                                                        }

                                                        router.visit(`/crm/contacts/${contact.id}`);
                                                    }}
                                                >
                                                    <div>
                                                        <p className="text-[13px] font-medium text-ink">{contact.display_name}</p>
                                                        <p className="text-[12px] text-mute">
                                                            {[contact.email, contact.phone_e164, contact.company]
                                                                .filter(Boolean)
                                                                .join(' · ') || t('No identity details')}
                                                        </p>
                                                    </div>
                                                    <Link href={`/crm/contacts/${contact.id}`} className="text-[12px] font-medium text-ink hover:underline">
                                                        {t('Open contact')}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                        {survivor && others.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 border-t border-hairline px-4 py-3">
                                                {others.map((absorbed) => (
                                                    <Link
                                                        key={absorbed.id}
                                                        href={`/crm/contacts/merge/${survivor.id}/${absorbed.id}`}
                                                        className="text-[13px] font-medium text-brand"
                                                    >
                                                        {t('Merge :absorbed into :survivor', {
                                                            absorbed: absorbed.display_name,
                                                            survivor: survivor.display_name,
                                                        })}
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </CrmShell>
    );
}

ContactDuplicates.layout = {
    breadcrumbs: [
        { title: 'Contacts', href: '/crm/contacts' },
        { title: 'Duplicates', href: '/crm/contacts/duplicates' },
    ],
};
