import { Form, Head, router } from '@inertiajs/react';
import PeopleController from '@/actions/App/Http/Controllers/Settings/PeopleController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
        return '—';
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
    const canTouchRow = (person: PersonRow): boolean => {
        if (person.is_self) {
            return false;
        }

        // Nobody below an owner modifies an owner.
        if (person.role === 'owner' && actorRole !== 'owner') {
            return false;
        }

        // The last owner keeps their role and their seat.
        if (person.role === 'owner' && ownerCount <= 1) {
            return false;
        }

        return true;
    };

    return (
        <>
            <Head title="People" />

            <h1 className="sr-only">People</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="People"
                    description="Who can sign in to this Evotechly workspace, their role, and their first-login email"
                />

                <Card className="p-4">
                    <h2 className="mb-1 font-medium">Invite someone</h2>
                    <p className="mb-3 text-sm text-muted-foreground">
                        They get a login email from the workspace mailbox with a
                        single-use link to set their password on
                        crm.evotechly.com — never a password in the mail.
                        Invites are admin or member; this workspace has one
                        owner.
                    </p>

                    {!hasEnabledMailbox && (
                        <div className="mb-3 rounded-md border border-brand/30 bg-brand/5 p-3 text-sm">
                            No enabled mailbox — the person is added as pending,
                            but the login email cannot leave until a mailbox is
                            enabled under Outbound → Mailboxes. You can resend
                            the invite from their row afterwards.
                        </div>
                    )}

                    <Form
                        {...PeopleController.store.form()}
                        options={{ preserveScroll: true }}
                        className="grid gap-3 md:grid-cols-4"
                        resetOnSuccess
                    >
                        {({ processing, errors }) => (
                            <>
                                <div>
                                    <Label htmlFor="invite-name">Name</Label>
                                    <Input
                                        id="invite-name"
                                        name="name"
                                        required
                                        placeholder="Full name"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                                <div>
                                    <Label htmlFor="invite-email">Email</Label>
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
                                    <Label htmlFor="invite-role">Role</Label>
                                    <select
                                        id="invite-role"
                                        name="role"
                                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                                        defaultValue="member"
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <InputError message={errors.role} />
                                </div>
                                <div className="flex items-end">
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
                </Card>

                <Card className="overflow-x-auto p-0">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Role</th>
                                <th className="px-4 py-3 font-medium">
                                    Last login / invited
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {people.map((person) => (
                                <tr key={person.id}>
                                    <td className="px-4 py-3 font-medium">
                                        {person.name}
                                        {person.is_self ? (
                                            <span className="ml-1 text-xs text-muted-foreground">
                                                (you)
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {person.email}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={roleVariant(person.role)}
                                        >
                                            {person.role}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {person.last_login_at
                                            ? formatDate(person.last_login_at)
                                            : `Invited ${formatDate(person.invited_at)}`}
                                    </td>
                                    <td className="px-4 py-3">
                                        {person.status === 'active' ? (
                                            <Badge variant="default">
                                                Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Invite pending
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
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
                                                    Resend invite
                                                </Button>
                                            ) : null}

                                            <select
                                                aria-label={`Role for ${person.name}`}
                                                className="h-8 rounded-md border bg-background px-2 text-sm disabled:opacity-50"
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
                                                <option value="admin">
                                                    Admin
                                                </option>
                                                <option value="member">
                                                    Member
                                                </option>
                                            </select>

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
                                                            Remove {person.name}
                                                            ?
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            They lose access to
                                                            this Evotechly
                                                            workspace
                                                            immediately. Their
                                                            contacts and deals
                                                            stay — they just
                                                            become unassigned.
                                                        </DialogDescription>
                                                        <DialogFooter className="gap-2">
                                                            <DialogClose
                                                                asChild
                                                            >
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
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
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
