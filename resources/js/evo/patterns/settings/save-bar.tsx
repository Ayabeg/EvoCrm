import { cn } from '@/evo/lib/cn';
import { Button } from '@/evo/ui/button';
import { t } from '@/lib/i18n';
import { settingsCopy } from './copy';
import { useSettingsForm } from './settings-form';

export function SettingsSaveBar({
    processing,
    dirty,
    saveLabel = settingsCopy.save,
    cancelLabel = settingsCopy.cancel,
    saveTestId,
    showCancel = true,
    visible,
}: {
    processing?: boolean;
    dirty?: boolean;
    saveLabel?: string;
    cancelLabel?: string;
    saveTestId?: string;
    showCancel?: boolean;
    visible?: boolean;
}) {
    const form = useSettingsForm();
    const isProcessing = processing ?? form?.processing ?? false;
    const isDirty = dirty ?? form?.dirty;
    const shown = visible ?? (isDirty === undefined ? true : isDirty);

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-settings="save-region"
        >
            {shown ? (
                <div
                    data-settings="save-bar"
                    className={cn(
                        'flex items-center justify-end gap-2 border-t border-[var(--evo-hairline)] bg-[var(--evo-surface)] px-4 py-2',
                    )}
                >
                    <p className="me-auto text-[12px] text-[var(--evo-ink-muted)]">
                        {isProcessing ? t(settingsCopy.saving) : t(settingsCopy.dirty)}
                    </p>
                    {showCancel ? (
                        <Button
                            type="reset"
                            variant="ghost"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => form?.markPristine()}
                        >
                            {t(cancelLabel)}
                        </Button>
                    ) : null}
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isProcessing}
                        loading={isProcessing}
                        data-settings="save"
                        data-test={saveTestId}
                    >
                        {t(saveLabel)}
                    </Button>
                </div>
            ) : (
                <span className="sr-only">{t(settingsCopy.saved)}</span>
            )}
        </div>
    );
}

export { SettingsSaveBar as SaveBar };
