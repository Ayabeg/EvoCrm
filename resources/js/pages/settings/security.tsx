import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import {
    SettingsCard,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
} from '@/components/settings/chrome';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
} & ManageTwoFactorProps;

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Security settings" />

            <SettingsPageHeader
                title="Security"
                description="Password and two-factor settings for this login."
            />

            <div className="grid gap-3">
                <Form
                    {...SecurityController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                >
                    {({ errors, processing }) => (
                        <SettingsCard
                            title="Update password"
                            required
                            footer={
                                <SettingsSaveBar
                                    processing={processing}
                                    saveTestId="update-password-button"
                                />
                            }
                        >
                            <SettingsFormRow
                                label="Current password"
                                htmlFor="current_password"
                                required
                            >
                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    name="current_password"
                                    className="h-8"
                                    autoComplete="current-password"
                                />
                                <InputError message={errors.current_password} />
                            </SettingsFormRow>

                            <SettingsFormRow
                                label="New password"
                                htmlFor="password"
                                required
                            >
                                <PasswordInput
                                    id="password"
                                    ref={passwordInput}
                                    name="password"
                                    className="h-8"
                                    autoComplete="new-password"
                                    passwordrules={props.passwordRules}
                                />
                                <InputError message={errors.password} />
                            </SettingsFormRow>

                            <SettingsFormRow
                                label="Confirm password"
                                htmlFor="password_confirmation"
                                required
                            >
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    className="h-8"
                                    autoComplete="new-password"
                                    passwordrules={props.passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </SettingsFormRow>
                        </SettingsCard>
                    )}
                </Form>

                <SettingsCard title="Two-factor authentication">
                    <ManageTwoFactor
                        canManageTwoFactor={props.canManageTwoFactor}
                        requiresConfirmation={props.requiresConfirmation}
                        twoFactorEnabled={props.twoFactorEnabled}
                    />
                </SettingsCard>
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
