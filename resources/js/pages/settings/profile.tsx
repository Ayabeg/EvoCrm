import { Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Input } from '@/evo/ui/input';
import {
    SettingsCard,
    SettingsDangerZone,
    SettingsForm,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
} from '@/evo/patterns/settings';
import { t } from '@/lib/i18n';
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
            <Head title={t('Profile settings')} />

            <SettingsPageHeader
                title="Profile"
                description="Name and email for this EvoCrm login."
            />

            <div className="grid gap-3">
                <SettingsForm
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
                                    {t('Your email address is unverified.')}{' '}
                                    <Link
                                        href={send()}
                                        as="button"
                                        className="text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
                                    >
                                        {t('Re-send the verification email.')}
                                    </Link>
                                    {status === 'verification-link-sent' ? (
                                        <span className="mt-1 block font-medium text-ink">
                                            {t('A new verification link has been sent to your email address.')}
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
                </SettingsForm>

                <SettingsDangerZone
                    title="Delete account"
                    description="Delete your account and all of its resources"
                >
                    <DeleteUser />
                </SettingsDangerZone>
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
