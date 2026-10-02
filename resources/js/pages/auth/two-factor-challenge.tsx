import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { Button } from '@/evo/ui/button';
import { FieldError } from '@/evo/ui/field';
import { Input } from '@/evo/ui/input';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { t } from '@/lib/i18n';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: t('Recovery code'),
                description: t(
                    'Please confirm access to your account by entering one of your emergency recovery codes.',
                ),
                toggleText: t('login using an authentication code'),
            };
        }

        return {
            title: t('Authentication code'),
            description: t(
                'Enter the authentication code provided by your authenticator application.',
            ),
            toggleText: t('login using a recovery code'),
        };
    }, [showRecoveryInput]);

    setLayoutProps({
        title: authConfigContent.title,
        description: authConfigContent.description,
    });

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <>
            <Head title={t('Two-factor authentication')} />

            <div className="flex flex-col gap-6">
                <Form
                    {...store.form()}
                    className="flex flex-col gap-5"
                    resetOnError
                    resetOnSuccess={!showRecoveryInput}
                >
                    {({ errors, processing, clearErrors }) => (
                        <>
                            {showRecoveryInput ? (
                                <>
                                    <Input
                                        name="recovery_code"
                                        type="text"
                                        placeholder={t('Enter recovery code')}
                                        autoFocus={showRecoveryInput}
                                        required
                                    />
                                    {errors.recovery_code ? (
                                        <FieldError>
                                            {errors.recovery_code}
                                        </FieldError>
                                    ) : null}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 text-center">
                                    <div className="flex w-full items-center justify-center">
                                        <InputOTP
                                            name="code"
                                            maxLength={OTP_MAX_LENGTH}
                                            value={code}
                                            onChange={(value) => setCode(value)}
                                            disabled={processing}
                                            pattern={REGEXP_ONLY_DIGITS}
                                            autoFocus
                                        >
                                            <InputOTPGroup>
                                                {Array.from(
                                                    { length: OTP_MAX_LENGTH },
                                                    (_, index) => (
                                                        <InputOTPSlot
                                                            key={index}
                                                            index={index}
                                                        />
                                                    ),
                                                )}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    {errors.code ? (
                                        <FieldError>{errors.code}</FieldError>
                                    ) : null}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={processing}
                            >
                                {t('Continue')}
                            </Button>

                            <p className="text-center text-sm text-mute">
                                <span>{t('or you can')} </span>
                                <button
                                    type="button"
                                    className="cursor-pointer text-brand underline decoration-brand/30 underline-offset-4 transition-colors duration-[var(--motion-duration-medium)] hover:decoration-brand"
                                    onClick={() =>
                                        toggleRecoveryMode(clearErrors)
                                    }
                                >
                                    {authConfigContent.toggleText}
                                </button>
                            </p>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
