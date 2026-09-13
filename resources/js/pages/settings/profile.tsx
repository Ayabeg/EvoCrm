import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import {
    SettingsCard,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
} from '@/components/settings/chrome';
import { Input } from '@/components/ui/input';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <SettingsPageHeader
                title="Profile"
                description="Name and email for this EvoCrm login."
            />

            <div className="grid gap-3">
                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                >
                    {({ processing, errors }) => (
                        <SettingsCard
                            title="Personal information"
                            required
                            footer={
                                <SettingsSaveBar
                                    processing={processing}
                                    saveTestId="update-profile-button"
                                />
                            }
                        >
                            <SettingsFormRow
                                label="Name"
                                htmlFor="name"
                                required
                                error={errors.name}
                            >
                                <Input
                                    id="name"
                                    className="h-8"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                />
                            </SettingsFormRow>

                            <SettingsFormRow
                                label="Email address"
                                htmlFor="email"
                                required
                                error={errors.email}
                            >
                                <Input
                                    id="email"
                                    type="email"
                                    className="h-8"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                />
                            </SettingsFormRow>

                            {mustVerifyEmail &&
                            auth.user.email_verified_at === null ? (
                                <p className="text-[12px] text-mute">
                                    Your email address is unverified.{' '}
                                    <Link
                                        href={send()}
                                        as="button"
                                        className="text-[#d9500f] underline decoration-[#d9500f]/30 underline-offset-4 hover:decoration-[#d9500f]"
                                    >
                                        Re-send the verification email.
                                    </Link>
                                    {status === 'verification-link-sent' ? (
                                        <span className="mt-1 block font-medium text-ink">
                                            A new verification link has been
                                            sent to your email address.
                                        </span>
                                    ) : null}
                                </p>
                            ) : null}

                            <InputError
                                className="sr-only"
                                message={errors.name}
                            />
                        </SettingsCard>
                    )}
                </Form>

                <SettingsCard title="Delete account">
                    <DeleteUser />
                </SettingsCard>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
