import { Form, Head } from '@inertiajs/react';
import PasswordInput from '@/components/password-input';
import SocialAuthButtons from '@/components/social-auth-buttons';
import TextLink from '@/components/text-link';
import { FieldError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { t } from '@/lib/i18n';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
    canLoginWithGoogle: boolean;
};

export default function Register({
    passwordRules,
    canLoginWithGoogle: _canLoginWithGoogle,
}: Props) {
    return (
        <>
            <Head title={t('Register')} />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="name">{t('Name')}</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder={t('Full name')}
                                />
                                {errors.name ? (
                                    <FieldError>{errors.name}</FieldError>
                                ) : null}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('Email address')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                {errors.email ? (
                                    <FieldError>{errors.email}</FieldError>
                                ) : null}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">{t('Password')}</Label>
                                <PasswordInput
                                    id="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder={t('Password')}
                                    passwordrules={passwordRules}
                                />
                                {errors.password ? (
                                    <FieldError>{errors.password}</FieldError>
                                ) : null}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    {t('Confirm password')}
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder={t('Confirm password')}
                                    passwordrules={passwordRules}
                                />
                                {errors.password_confirmation ? (
                                    <FieldError>
                                        {errors.password_confirmation}
                                    </FieldError>
                                ) : null}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                {t('Create account')}
                            </Button>

                            <SocialAuthButtons />
                        </div>

                        <p className="text-center text-sm text-mute">
                            {t('Already have an account?')}{' '}
                            <TextLink href={login()} tabIndex={6}>
                                {t('Log in')}
                            </TextLink>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
