import { Form, Head } from '@inertiajs/react';
import PasswordInput from '@/components/password-input';
import SocialAuthButtons from '@/components/social-auth-buttons';
import TextLink from '@/components/text-link';
import { FieldError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { t } from '@/lib/i18n';
import AuthStatus from './auth-status';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canLoginWithGoogle: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canLoginWithGoogle: _canLoginWithGoogle,
}: Props) {
    return (
        <>
            <Head title={t('Log in')} />

            {status ? <AuthStatus>{status}</AuthStatus> : null}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="sr-only">
                                    {t('Email')}
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="name@company.com"
                                />
                                {errors.email ? (
                                    <FieldError>{errors.email}</FieldError>
                                ) : null}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password" className="sr-only">
                                    {t('Password')}
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder={t('Enter your password')}
                                />
                                {canResetPassword && (
                                    <div className="flex justify-end">
                                        <TextLink
                                            href={request()}
                                            className="text-xs"
                                            tabIndex={5}
                                        >
                                            {t('Forgot your password?')}
                                        </TextLink>
                                    </div>
                                )}
                                {errors.password ? (
                                    <FieldError>{errors.password}</FieldError>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">{t('Remember me')}</Label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                {t('Log in')}
                            </Button>

                            <SocialAuthButtons />
                        </div>

                        <p className="text-center text-sm text-mute">
                            {t("Don't have an account?")}{' '}
                            <TextLink href={register()} tabIndex={5}>
                                {t('Sign up')}
                            </TextLink>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Welcome back',
    description: 'Log in to your EvoCrm account',
};
