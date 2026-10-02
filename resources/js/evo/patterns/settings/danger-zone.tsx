import type { ReactNode } from 'react';
import { Warning } from '@/evo/icons';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/evo/ui/alert-dialog';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';
import { settingsCopy } from './copy';
import { SettingsSection } from './settings-section';

export function SettingsDangerZone({
    title = settingsCopy.danger,
    description = settingsCopy.dangerHint,
    actionLabel,
    confirmTitle,
    confirmDescription,
    onConfirm,
    children,
    triggerTestId,
    confirmTestId,
}: {
    title?: string;
    description?: string;
    actionLabel?: string;
    confirmTitle?: string;
    confirmDescription?: string;
    onConfirm?: () => void;
    children?: ReactNode;
    triggerTestId?: string;
    confirmTestId?: string;
}) {
    return (
        <SettingsSection title={title} description={description} className="border-[var(--evo-danger)]/30">
            {children ?? (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-fit"
                            data-settings="danger"
                            data-test={triggerTestId}
                        >
                            <Warning className="size-3.5" aria-hidden />
                            {t(actionLabel ?? settingsCopy.danger)}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent data-settings="danger-dialog">
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {t(confirmTitle ?? settingsCopy.danger)}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {t(confirmDescription ?? settingsCopy.dangerHint)}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t(settingsCopy.cancel)}</AlertDialogCancel>
                            <AlertDialogAction
                                data-settings="danger"
                                data-test={confirmTestId}
                                onClick={onConfirm}
                            >
                                {t(settingsCopy.confirm)}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </SettingsSection>
    );
}

export { SettingsDangerZone as DangerZone };
