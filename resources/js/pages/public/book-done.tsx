import { Head } from '@inertiajs/react';
import { dateLocale, t } from '@/lib/i18n';

export default function PublicBookDone({
    host,
    when,
    timezone,
}: {
    host: { name: string | null };
    when: string | null;
    timezone: string;
}) {
    const label = when
        ? new Date(when).toLocaleString(dateLocale(), {
              timeZone: timezone,
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

    return (
        <>
            <Head title={t('Meeting booked')} />
            <div className="mx-auto max-w-md space-y-3 p-6">
                <p className="text-[11px] tracking-wide text-mute uppercase">EvoCrm</p>
                <h1 className="text-xl font-semibold text-ink">{t("You're booked")}</h1>
                <p className="text-[13px] text-ink">
                    {host.name ? t('Meeting with :host', { host: host.name }) : t('Meeting confirmed')}
                    {label ? ` · ${label}` : ''}.
                </p>
                <p className="text-[12px] text-mute">
                    {t('A confirmation was sent to your email. Times are :timezone.', {
                        timezone,
                    })}
                </p>
            </div>
        </>
    );
}
