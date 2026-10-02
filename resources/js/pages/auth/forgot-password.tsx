import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { FieldError } from '@/evo/ui/field';
import { Button } from '@/evo/ui/button';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { Spinner } from '@/evo/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';
import { t } from '@/lib/i18n';
import AuthStatus from './auth-status';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title={t('Forgot password')} />

            {status ? <AuthStatus>{status}</AuthStatus> : null}

            <div className="flex flex-col gap-6">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t('Email address')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                />
                                {errors.email ? (
                                    <FieldError>{errors.email}</FieldError>
                                ) : null}
                            </div>

                            <Button
                                className="w-full"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing && <Spinner />}
                                {t('Email password reset link')}
                            </Button>
                        </div>
                    )}
                </Form>

                <p className="text-center text-sm text-mute">
                    <TextLink href={login()}>{t('Or, return to log in')}</TextLink>
                </p>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Enter your email to receive a password reset link',
};
