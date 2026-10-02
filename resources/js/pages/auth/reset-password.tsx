import { Form, Head } from '@inertiajs/react';
import PasswordInput from '@/components/password-input';
import { Button } from '@/evo/ui/button';
import { FieldError } from '@/evo/ui/field';
import { Input } from '@/evo/ui/input';
import { Label } from '@/evo/ui/label';
import { Spinner } from '@/evo/ui/spinner';
import { t } from '@/lib/i18n';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title={t('Reset password')} />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('Email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="w-full"
                                readOnly
                            />
                            {errors.email ? (
                                <FieldError>{errors.email}</FieldError>
                            ) : null}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">{t('Password')}</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className="w-full"
                                autoFocus
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
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="w-full"
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
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            {t('Reset password')}
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Please enter your new password below',
};
