import { Form, Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Slot = {
    starts_at: string;
    ends_at: string;
    label: string;
    date: string;
};

type Day = {
    date: string;
    label: string;
    slots: Slot[];
};

export default function PublicBook({
    host,
    schedule,
    days,
    deal_id,
}: {
    host: { name: string | null };
    schedule: {
        slug: string;
        intro: string | null;
        slot_minutes: number;
        timezone: string;
        location_note: string | null;
        calendar_connected: boolean;
    };
    days: Day[];
    deal_id: number | null;
}) {
    const [picked, setPicked] = useState<Slot | null>(null);
    const empty = days.every((day) => day.slots.length === 0);
    const when = useMemo(() => {
        if (!picked) {
            return null;
        }

        return new Date(picked.starts_at).toLocaleString('en-GB', {
            timeZone: schedule.timezone,
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, [picked, schedule.timezone]);

    return (
        <>
            <Head title={`Book ${host.name ?? 'a meeting'}`} />
            <div className="mx-auto max-w-xl space-y-6 p-6">
                <div>
                    <p className="text-[11px] tracking-wide text-mute uppercase">EvoSales</p>
                    <h1 className="mt-1 text-xl font-semibold text-ink">
                        Book {host.name ?? 'a meeting'}
                    </h1>
                    <p className="mt-1 text-[13px] text-mute">
                        {schedule.intro || `${schedule.slot_minutes} min`} · {schedule.timezone}
                    </p>
                    {schedule.location_note ? (
                        <p className="mt-1 text-[13px] text-ink">{schedule.location_note}</p>
                    ) : null}
                    <p className="mt-2 text-[12px] text-mute">
                        {schedule.calendar_connected
                            ? 'Busy times from Google Calendar are hidden.'
                            : 'Showing working hours only — calendar is not connected.'}
                    </p>
                </div>

                {empty ? (
                    <p className="text-[13px] text-ink">No open slots in the next days.</p>
                ) : (
                    <div className="space-y-5">
                        {days.map((day) =>
                            day.slots.length === 0 ? null : (
                                <section key={day.date}>
                                    <h2 className="text-[13px] font-medium text-ink">{day.label}</h2>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {day.slots.map((slot) => (
                                            <button
                                                key={slot.starts_at}
                                                type="button"
                                                onClick={() => setPicked(slot)}
                                                className={
                                                    picked?.starts_at === slot.starts_at
                                                        ? 'rounded border border-ink bg-ink px-2.5 py-1 text-[12px] text-canvas'
                                                        : 'rounded border border-hairline bg-canvas px-2.5 py-1 text-[12px] text-ink hover:border-ink'
                                                }
                                            >
                                                {slot.label}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            ),
                        )}
                    </div>
                )}

                {picked ? (
                    <Form
                        action={`/book/${schedule.slug}`}
                        method="post"
                        className="space-y-3 border-t border-hairline pt-4"
                    >
                        {({ processing }) => (
                            <>
                                <input type="hidden" name="starts_at" value={picked.starts_at} />
                                {deal_id ? <input type="hidden" name="deal_id" value={deal_id} /> : null}
                                <p className="text-[13px] text-ink">Selected: {when}</p>
                                <div>
                                    <Label htmlFor="book-first">First name</Label>
                                    <Input id="book-first" name="first_name" required className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="book-last">Last name</Label>
                                    <Input id="book-last" name="last_name" className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="book-email">Email</Label>
                                    <Input id="book-email" name="email" type="email" required className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="book-phone">Phone</Label>
                                    <Input
                                        id="book-phone"
                                        name="phone"
                                        required
                                        className="mt-1"
                                        placeholder="+213 5…"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="book-note">Note</Label>
                                    <textarea
                                        id="book-note"
                                        name="note"
                                        rows={3}
                                        className="mt-1 w-full rounded-md border border-hairline bg-canvas px-3 py-2 text-sm"
                                    />
                                </div>
                                <Button disabled={processing}>Confirm meeting</Button>
                            </>
                        )}
                    </Form>
                ) : null}
            </div>
        </>
    );
}
