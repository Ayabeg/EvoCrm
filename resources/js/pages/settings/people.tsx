import { Form, Head, router } from '@inertiajs/react';
import { useState } from 'react';
import PeopleController from '@/actions/App/Http/Controllers/Settings/PeopleController';
import { CreateDrawer } from '@/components/crm/create-drawer';
import InputError from '@/components/input-error';
import { HairlinePanel } from '@/components/surface/hairline-panel';
import {
    HairlineRow,
    HairlineTable,
    HairlineTd,
    HairlineTh,
} from '@/components/surface/hairline-table';
import { SurfaceHeader } from '@/components/surface/surface-header';
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

    return `${date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })}, ${date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
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
            <Head title="People" />

            <h1 className="sr-only">People</h1>

            <div className="space-y-5">
                <SurfaceHeader
                    title="People"
                    description="Who can sign in to this Evotechly workspace, their role, and their first-login email."
                >
                    <Button
                        size="sm"
                        onClick={() => setInviteOpen(true)}
                        data-test="invite-person-open"
                    >
                        Invite
                    </Button>
                </SurfaceHeader>

                <HairlinePanel>
                    <HairlineTable minWidth="40rem">
                        <thead>
                            <tr className="border-b border-hairline">
                                <HairlineTh>Name</HairlineTh>
                                <HairlineTh>Email</HairlineTh>
                                <HairlineTh>Role</HairlineTh>
                                <HairlineTh>Last login / invited</HairlineTh>
                                <HairlineTh>Status</HairlineTh>
                                <HairlineTh align="right">Actions</HairlineTh>
                            </tr>
                        </thead>
                        <tbody>
                            {people.map((person) => (
                                <HairlineRow key={person.id}>
                                    <HairlineTd className="font-medium">
                                        {person.name}
                                        {person.is_self ? (
                                            <span className="aurora-text-caption ml-1 text-mute">
                                                (you)
                                            </span>
                                        ) : null}
                                    </HairlineTd>
                                    <HairlineTd className="text-mute">
                                        {person.email}
                                    </HairlineTd>
                                    <HairlineTd>
                                        <Badge variant={roleVariant(person.role)}>
                                            {person.role}
                                        </Badge>
                                    </HairlineTd>
                                    <HairlineTd className="text-mute">
                                        {person.last_login_at
                                            ? formatDate(person.last_login_at)
                                            : `Invited ${formatDate(person.invited_at)}`}
                                    </HairlineTd>
                                    <HairlineTd>
                                        {person.status === 'active' ? (
                                            <Badge variant="default">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Invite pending
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
                                                    Resend
                                                </Button>
                                            ) : null}

                                            <NativeSelect
                                                aria-label={`Role for ${person.name}`}
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
                                                        Owner
                                                    </option>
                                                ) : null}
                                                <option value="admin">Admin</option>
                                                <option value="member">
                                                    Member
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
                                                            Remove
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogTitle>
                                                            Remove {person.name}?
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            They lose access to
                                                            this Evotechly
                                                            workspace
                                                            immediately. Their
                                                            contacts and deals
                                                            stay - they just
                                                            become unassigned.
                                                        </DialogDescription>
                                                        <DialogFooter className="gap-2">
                                                            <DialogClose asChild>
                                                                <Button variant="secondary">
                                                                    Cancel
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
                                                                Remove person
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

            <CreateDrawer
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                title="Invite someone"
                description="They get a login email from the workspace mailbox with a single-use link to set their password. Invites are admin or member."
                showFormLink={false}
            >
                {!hasEnabledMailbox ? (
                    <div className="mb-4 rounded-lg border border-hairline bg-brand/5 p-3">
                        <p className="aurora-text-body-sm text-ink">
                            No enabled mailbox - the person is added as pending,
                            but the login email cannot leave until a mailbox is
                            enabled under Outbound → Mailboxes. You can resend
                            the invite from their row afterwards.
                        </p>
                    </div>
                ) : null}

                <Form
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
                                    Name
                                </Label>
                                <Input
                                    id="invite-name"
                                    name="name"
                                    required
                                    placeholder="Full name"
                                />
                                <InputError message={errors.name} />
                            </div>
                            <div>
                                <Label htmlFor="invite-email" className="mb-1 block">
                                    Email
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
                                    Role
                                </Label>
                                <NativeSelect
                                    id="invite-role"
                                    name="role"
                                    defaultValue="member"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </NativeSelect>
                                <InputError message={errors.role} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setInviteOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={processing}
                                    data-test="invite-person-button"
                                >
                                    Send invite
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </CreateDrawer>
        </>
    );
}

People.layout = {
    breadcrumbs: [
        {
            title: 'People',
            href: '/settings/people',
        },
    ],
};
