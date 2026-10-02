import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import PeopleController from '@/actions/App/Http/Controllers/Settings/PeopleController';
import { MorphingForm } from '@/components/crm/morphing-form';
import InputError from '@/components/input-error';
import { HairlinePanel } from '@/components/surface/hairline-panel';
import {
    HairlineRow,
    HairlineTable,
    HairlineTd,
    HairlineTh,
} from '@/components/surface/hairline-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { SettingsForm, SettingsPageHeader } from '@/evo/patterns/settings';
import { dateLocale, t } from '@/lib/i18n';
import type { WorkspaceRole } from '@/types/auth';

type PersonRow = {
    id: number;
    name: string;
    email: string;
    role: WorkspaceRole;
    status: 'active' | 'pending';
    last_login_at: string | null;
    invited_at: string | null;
    is_self: boolean;
};

type Props = {
    people: PersonRow[];
    ownerCount: number;
    actorRole: WorkspaceRole;
    hasEnabledMailbox: boolean;
};

function formatDate(iso: string | null): string {
    if (!iso) {
        return '-';
    }

    const date = new Date(iso);

    return `${date.toLocaleDateString(dateLocale(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })}, ${date.toLocaleTimeString(dateLocale(), {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })}`;
}

function roleVariant(role: WorkspaceRole): 'default' | 'secondary' | 'outline' {
    if (role === 'owner') {
        return 'default';
    }

    if (role === 'admin') {
        return 'secondary';
    }

    return 'outline';
}

export default function People({
    people,
    ownerCount,
    actorRole,
    hasEnabledMailbox,
}: Props) {
    const [inviteOpen, setInviteOpen] = useState(false);

    const canTouchRow = (person: PersonRow): boolean => {
        if (person.is_self) {
            return false;
        }

        if (person.role === 'owner' && actorRole !== 'owner') {
            return false;
        }

        if (person.role === 'owner' && ownerCount <= 1) {
            return false;
        }

        return true;
    };

    return (
        <>
            <Head title={t('Members')} />

            <div className="space-y-3">
                <SettingsPageHeader
                    title="Members"
                    description="Who can sign in to this Evotechly workspace, their role, and their first-login email."
                >
                    <MorphingForm
                        label="Invite"
                        title="Invite someone"
                        description="They get a login email from the workspace mailbox with a single-use link to set their password. Invites are admin or member."
                        open={inviteOpen}
                        onOpenChange={setInviteOpen}
                        triggerTestId="invite-person-open"
                    >
                        {!hasEnabledMailbox ? (
                            <div className="mb-4 rounded-lg border border-hairline bg-brand/5 p-3">
                                <p className="aurora-text-body-sm text-ink">
                                    {t('No enabled mailbox - the person is added as pending, but the login email cannot leave until a mailbox is enabled under Outbound → Mailboxes. You can resend the invite from their row afterwards.')}
                                </p>
                            </div>
                        ) : null}

                        <SettingsForm
                            {...PeopleController.store.form()}
                            options={{ preserveScroll: true }}
                            className="space-y-3"
                            resetOnSuccess
                            onSuccess={() => setInviteOpen(false)}
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div>
                                        <Label htmlFor="invite-name" className="mb-1 block">
                                            {t('Name')}
                                        </Label>
                                        <Input
                                            id="invite-name"
                                            name="name"
                                            required
                                            placeholder={t('Full name')}
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div>
                                        <Label htmlFor="invite-email" className="mb-1 block">
                                            {t('Email')}
                                        </Label>
                                        <Input
                                            id="invite-email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="teammate@evotechly.com"
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div>
                                        <Label htmlFor="invite-role" className="mb-1 block">
                                            {t('Role')}
                                        </Label>
                                        <NativeSelect
                                            id="invite-role"
                                            name="role"
                                            defaultValue="member"
                                        >
                                            <option value="member">{t('Member')}</option>
                                            <option value="admin">{t('Admin')}</option>
                                        </NativeSelect>
                                        <InputError message={errors.role} />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setInviteOpen(false)}
                                        >
                                            {t('Cancel')}
                                        </Button>
                                        <Button
                                            disabled={processing}
                                            data-test="invite-person-button"
                                        >
                                            {t('Send invite')}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </SettingsForm>
                    </MorphingForm>
                </SettingsPageHeader>

                <HairlinePanel>
                    <HairlineTable minWidth="40rem">
                        <thead>
                            <tr className="border-b border-hairline">
                                <HairlineTh>{t('Name')}</HairlineTh>
                                <HairlineTh>{t('Email')}</HairlineTh>
                                <HairlineTh>{t('Role')}</HairlineTh>
                                <HairlineTh>{t('Last login / invited')}</HairlineTh>
                                <HairlineTh>{t('Status')}</HairlineTh>
                                <HairlineTh align="right">{t('Actions')}</HairlineTh>
                            </tr>
                        </thead>
                        <tbody>
                            {people.map((person) => (
                                <HairlineRow key={person.id}>
                                    <HairlineTd className="font-medium">
                                        {person.name}
                                        {person.is_self ? (
                                            <span className="aurora-text-caption ml-1 text-mute">
                                                ({t('you')})
                                            </span>
                                        ) : null}
                                    </HairlineTd>
                                    <HairlineTd className="text-mute">
                                        {person.email}
                                    </HairlineTd>
                                    <HairlineTd>
                                        <Badge
                                            variant={roleVariant(person.role)}
                                        >
                                            {t(person.role === 'owner' ? 'Owner' : person.role === 'admin' ? 'Admin' : 'Member')}
                                        </Badge>
                                    </HairlineTd>
                                    <HairlineTd className="text-mute">
                                        {person.last_login_at
                                            ? formatDate(person.last_login_at)
                                            : t('Invited :when', { when: formatDate(person.invited_at) })}
                                    </HairlineTd>
                                    <HairlineTd>
                                        {person.status === 'active' ? (
                                            <Badge variant="default">
                                                {t('Active')}
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                {t('Invite pending')}
                                            </Badge>
                                        )}
                                    </HairlineTd>
                                    <HairlineTd>
                                        <div className="flex items-center justify-end gap-2">
                                            {person.status === 'pending' ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.post(
                                                            PeopleController.resend.url(
                                                                person.id,
                                                            ),
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    {t('Resend')}
                                                </Button>
                                            ) : null}

                                            <NativeSelect
                                                aria-label={t('Role for :name', { name: person.name })}
                                                className="h-8 w-[7.5rem]"
                                                value={person.role}
                                                disabled={!canTouchRow(person)}
                                                onChange={(event) =>
                                                    router.put(
                                                        PeopleController.updateRole.url(
                                                            person.id,
                                                        ),
                                                        {
                                                            role: event.target
                                                                .value,
                                                        },
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                {person.role === 'owner' ? (
                                                    <option value="owner">
                                                        {t('Owner')}
                                                    </option>
                                                ) : null}
                                                <option value="admin">
                                                    {t('Admin')}
                                                </option>
                                                <option value="member">
                                                    {t('Member')}
                                                </option>
                                            </NativeSelect>

                                            {!person.is_self &&
                                            (person.role !== 'owner' ||
                                                (actorRole === 'owner' &&
                                                    ownerCount > 1)) ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-brand"
                                                        >
                                                            {t('Remove')}
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogTitle>
                                                            {t('Remove :name?', { name: person.name })}
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            {t('They lose access to this Evotechly workspace immediately. Their contacts and deals stay - they just become unassigned.')}
                                                        </DialogDescription>
                                                        <DialogFooter className="gap-2">
                                                            <DialogClose
                                                                asChild
                                                            >
                                                                <Button variant="secondary">
                                                                    {t('Cancel')}
                                                                </Button>
                                                            </DialogClose>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    router.delete(
                                                                        PeopleController.destroy.url(
                                                                            person.id,
                                                                        ),
                                                                        {
                                                                            preserveScroll: true,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                {t('Remove person')}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            ) : null}
                                        </div>
                                    </HairlineTd>
                                </HairlineRow>
                            ))}
                        </tbody>
                    </HairlineTable>
                </HairlinePanel>
            </div>
        </>
    );
}

People.layout = {
    breadcrumbs: [
        {
            title: 'Members',
            href: '/settings/people',
        },
    ],
};
