import { Form, router } from '@inertiajs/react';
import { useState } from 'react';
import { OutboundPage, OutboundShell } from '@/components/crm/outbound-shell';
import { Field } from '@/evo/outbound/section';
import { SuppressionList } from '@/evo/outbound/SuppressionList';
import type { SuppressionRow } from '@/evo/outbound/types';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { NativeSelect } from '@/evo/ui/native-select';
import { t } from '@/lib/i18n';

export default function SuppressionsIndex({ items }: { items: SuppressionRow[] }) {
    const [search, setSearch] = useState('');
    const filtered = items.filter((item) =>
        `${item.type} ${item.value} ${item.reason ?? ''}`.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <OutboundShell title={t('Suppressions')}>
            <OutboundPage
                title={t('Suppressions')}
                description={t(
                    'Suppressed emails and phones never receive automated outbound — sequences skip them, campaigns fail them honestly, and the public unsubscribe link lands here.',
                )}
            >
                <Form
                    action="/outbound/suppressions"
                    method="post"
                    className="grid gap-3 border-t border-[var(--evo-hairline)] pt-3 md:grid-cols-4"
                    resetOnSuccess
                >
                    {({ processing }) => (
                        <>
                            <Field label={t('Type')}>
                                <NativeSelect name="type">
                                    <option value="email">{t('Email')}</option>
                                    <option value="phone">{t('Phone')}</option>
                                </NativeSelect>
                            </Field>
                            <Field label={t('Value')}>
                                <Input name="value" required />
                            </Field>
                            <Field label={t('Reason')}>
                                <Input name="reason" defaultValue="manual" />
                            </Field>
                            <div className="flex items-end">
                                <Button disabled={processing}>{t('Add')}</Button>
                            </div>
                        </>
                    )}
                </Form>
                <SuppressionList
                    items={filtered}
                    search={search}
                    onSearchChange={setSearch}
                    onRemove={(item) => {
                        if (window.confirm(t('Remove :value from the suppression list?', { value: item.value }))) {
                            router.delete(`/outbound/suppressions/${item.id}`);
                        }
                    }}
                />
            </OutboundPage>
        </OutboundShell>
    );
}

SuppressionsIndex.layout = {
    breadcrumbs: [{ title: t('Suppressions'), href: '/outbound/suppressions' }],
};
