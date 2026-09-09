import { Head } from '@inertiajs/react';

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
        ? new Date(when).toLocaleString('en-GB', {
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
            <Head title="Meeting booked" />
            <div className="mx-auto max-w-md space-y-3 p-6">
                <p className="text-[11px] tracking-wide text-mute uppercase">EvoSales</p>
                <h1 className="text-xl font-semibold text-ink">You’re booked</h1>
                <p className="text-[13px] text-ink">
                    {host.name ? `Meeting with ${host.name}` : 'Meeting confirmed'}
                    {label ? ` · ${label}` : ''}.
                </p>
                <p className="text-[12px] text-mute">A confirmation was sent to your email. Times are {timezone}.</p>
            </div>
        </>
    );
}
