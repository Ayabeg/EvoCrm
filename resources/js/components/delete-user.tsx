import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Warning } from '@/evo/icons';
import { SettingsForm } from '@/evo/patterns/settings';
import { Button } from '@/evo/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/evo/ui/dialog';
import { Label } from '@/evo/ui/label';
import { t } from '@/lib/i18n';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="sm"
                    className="w-fit"
                    data-test="delete-user-button"
                    data-settings="danger"
                >
                    <Warning className="size-3.5" aria-hidden />
                    {t('Delete account')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>
                    {t('Are you sure you want to delete your account?')}
                </DialogTitle>
                <DialogDescription>
                    {t('Once your account is deleted, all of its resources and data will also be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.')}
                </DialogDescription>

                <SettingsForm
                    {...ProfileController.destroy.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    onError={() => passwordInput.current?.focus()}
                    resetOnSuccess
                    className="space-y-6"
                    guard={false}
                >
                    {({ resetAndClearErrors, processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="sr-only">
                                    {t('Password')}
                                </Label>

                                <PasswordInput
                                    id="password"
                                    name="password"
                                    ref={passwordInput}
                                    placeholder={t('Password')}
                                    autoComplete="current-password"
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                />

                                <InputError id="password-error" message={errors.password} />
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button
                                        variant="secondary"
                                        onClick={() => resetAndClearErrors?.()}
                                    >
                                        {t('Cancel')}
                                    </Button>
                                </DialogClose>

                                <Button
                                    variant="destructive"
                                    data-settings="danger"
                                    disabled={processing}
                                    asChild
                                >
                                    <button
                                        type="submit"
                                        data-test="confirm-delete-user-button"
                                    >
                                        {t('Delete account')}
                                    </button>
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </SettingsForm>
            </DialogContent>
        </Dialog>
    );
}
