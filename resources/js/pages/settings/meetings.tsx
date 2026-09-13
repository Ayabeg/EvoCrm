import { Form, Head } from '@inertiajs/react';
import {
    SettingsCard,
    SettingsFormRow,
    SettingsPageHeader,
    SettingsSaveBar,
} from '@/components/settings/chrome';
import { Input } from '@/components/ui/input';

type Schedule = {
    slug: string;
    url: string;
    enabled: boolean;
    slot_minutes: number;
    timezone: string;
    work_start: string;
    work_end: string;
    weekdays: number[];
    location_note: string | null;
    intro: string | null;
    calendar_connected: boolean;
};

type WhatsAppTemplates = {
    booked: string;
    reminder: string;
    quote: string;
    sla: string;
    language: string;
};

const DAYS: { value: number; label: string }[] = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 7, label: 'Sun' },
];

export default function MeetingSettings({
    schedule,
    whatsapp,
    whatsapp_cloud_connected,
}: {
    schedule: Schedule;
    whatsapp: WhatsAppTemplates;
    whatsapp_cloud_connected: boolean;
}) {
    return (
        <>
            <Head title="Meetings" />

            <SettingsPageHeader
                title="Meetings"
                description="Public booking link. Guests pick a slot in Africa/Algiers. A meeting lands on the contact timeline."
            />

            <div className="grid gap-3">
                <SettingsCard title="Booking link">
                    <p className="text-[13px] text-ink">
                        Your link:{' '}
                        <a
                            href={schedule.url}
                            className="font-medium text-brand hover:underline"
                        >
                            {schedule.url}
                        </a>
                    </p>
                    <p className="text-[12px] text-mute">
                        {schedule.calendar_connected
                            ? 'Google Calendar is connected. Busy times are hidden from guests.'
                            : 'Google Calendar is not connected. Guests see working hours only.'}
                    </p>
                </SettingsCard>

                <Form action="/settings/meetings" method="put">
                    <SettingsCard
                        title="Availability"
                        required
                        footer={<SettingsSaveBar />}
                    >
                        <label className="flex items-center gap-2 text-[13px] text-ink">
                            <input
                                type="checkbox"
                                name="enabled"
                                value="1"
                                defaultChecked={schedule.enabled}
                            />
                            Page is live
                        </label>
                        <SettingsFormRow
                            label="Link slug"
                            htmlFor="meeting-slug"
                            required
                        >
                            <Input
                                id="meeting-slug"
                                name="slug"
                                required
                                defaultValue={schedule.slug}
                                className="h-8"
                            />
                        </SettingsFormRow>
                        <SettingsFormRow label="Intro" htmlFor="meeting-intro">
                            <Input
                                id="meeting-intro"
                                name="intro"
                                defaultValue={schedule.intro ?? ''}
                                className="h-8"
                                placeholder="30 min discovery"
                            />
                        </SettingsFormRow>
                        <SettingsFormRow
                            label="Slot length"
                            htmlFor="meeting-slot"
                        >
                            <select
                                id="meeting-slot"
                                name="slot_minutes"
                                defaultValue={schedule.slot_minutes}
                                className="h-8 w-full rounded-[4px] border border-hairline bg-white px-2 text-[13px]"
                            >
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>60 minutes</option>
                            </select>
                        </SettingsFormRow>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <SettingsFormRow
                                label="Work start"
                                htmlFor="meeting-start"
                                required
                            >
                                <Input
                                    id="meeting-start"
                                    name="work_start"
                                    type="time"
                                    required
                                    defaultValue={schedule.work_start}
                                    className="h-8"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="Work end"
                                htmlFor="meeting-end"
                                required
                            >
                                <Input
                                    id="meeting-end"
                                    name="work_end"
                                    type="time"
                                    required
                                    defaultValue={schedule.work_end}
                                    className="h-8"
                                />
                            </SettingsFormRow>
                        </div>
                        <fieldset>
                            <legend className="text-[13px] font-medium text-ink">
                                Days
                            </legend>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {DAYS.map((day) => (
                                    <label
                                        key={day.value}
                                        className="flex items-center gap-1.5 text-[12px] text-ink"
                                    >
                                        <input
                                            type="checkbox"
                                            name="weekdays[]"
                                            value={day.value}
                                            defaultChecked={schedule.weekdays.includes(
                                                day.value,
                                            )}
                                        />
                                        {day.label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <SettingsFormRow
                            label="Location"
                            htmlFor="meeting-location"
                            hint={`Timezone is always ${schedule.timezone}.`}
                        >
                            <Input
                                id="meeting-location"
                                name="location_note"
                                defaultValue={schedule.location_note ?? ''}
                                className="h-8"
                                placeholder="Paste a Meet or Zoom link"
                            />
                        </SettingsFormRow>

                        <div className="grid gap-3 border-t border-hairline pt-3">
                            <div>
                                <p className="text-[13px] font-medium text-ink">
                                    WhatsApp Cloud templates
                                </p>
                                <p className="mt-1 text-[12px] text-mute">
                                    {whatsapp_cloud_connected
                                        ? 'WhatsApp Business is connected. Names must match templates approved in Meta.'
                                        : 'Connect WhatsApp Business to send Cloud templates. Phone WhatsApp still sends free text.'}
                                </p>
                            </div>
                            <SettingsFormRow
                                label="Booked template"
                                htmlFor="wa-booked"
                            >
                                <Input
                                    id="wa-booked"
                                    name="whatsapp_booked_template"
                                    defaultValue={whatsapp.booked}
                                    className="h-8"
                                    placeholder="meeting_booked"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="Reminder template"
                                htmlFor="wa-reminder"
                            >
                                <Input
                                    id="wa-reminder"
                                    name="whatsapp_reminder_template"
                                    defaultValue={whatsapp.reminder}
                                    className="h-8"
                                    placeholder="meeting_reminder"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="Quote accepted"
                                htmlFor="wa-quote"
                            >
                                <Input
                                    id="wa-quote"
                                    name="whatsapp_quote_template"
                                    defaultValue={whatsapp.quote}
                                    className="h-8"
                                    placeholder="quote_accepted"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow
                                label="Ticket SLA"
                                htmlFor="wa-sla"
                            >
                                <Input
                                    id="wa-sla"
                                    name="whatsapp_sla_template"
                                    defaultValue={whatsapp.sla}
                                    className="h-8"
                                    placeholder="ticket_sla"
                                />
                            </SettingsFormRow>
                            <SettingsFormRow label="Language" htmlFor="wa-lang">
                                <select
                                    id="wa-lang"
                                    name="whatsapp_template_language"
                                    defaultValue={whatsapp.language}
                                    className="h-8 w-full rounded-[4px] border border-hairline bg-white px-2 text-[13px]"
                                >
                                    <option value="fr">French (fr)</option>
                                    <option value="ar">Arabic (ar)</option>
                                    <option value="en">English (en)</option>
                                </select>
                            </SettingsFormRow>
                            <div className="rounded-[4px] bg-canvas p-3 text-[12px] text-mute">
                                <p className="font-medium text-ink">
                                    Meta body variables
                                </p>
                                <p className="mt-1">
                                    Booked / reminder: {'{{1}}'} guest first
                                    name, {'{{2}}'} host name, {'{{3}}'} when
                                    (Africa/Algiers)
                                </p>
                                <p className="mt-1">
                                    Quote: {'{{1}}'} first name, {'{{2}}'}{' '}
                                    amount, {'{{3}}'} quote id
                                </p>
                                <p className="mt-1">
                                    SLA: {'{{1}}'} first name, {'{{2}}'} ticket
                                    number
                                </p>
                                <p className="mt-2 font-mono text-[11px] whitespace-pre-wrap text-ink">
                                    {`Salaam {{1}} - {{2}} confirmed your meeting.\n{{3}}`}
                                </p>
                                <p className="mt-2">
                                    Leave a name empty to skip Cloud and use
                                    phone WhatsApp text instead.
                                </p>
                            </div>
                        </div>
                    </SettingsCard>
                </Form>
            </div>
        </>
    );
}
