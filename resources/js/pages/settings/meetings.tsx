import { Form, Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

const DAYS: { value: number; label: string }[] = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 7, label: 'Sun' },
];

export default function MeetingSettings({ schedule }: { schedule: Schedule }) {
    return (
        <>
            <Head title="Meetings" />
            <div className="space-y-6">
                <Heading
                    title="Meetings"
                    description="Public booking link. Guests pick a slot in Africa/Algiers. A meeting lands on the contact timeline. We email and WhatsApp a reminder 24 hours before; unmarked slots become no-show after they end."
                />
                <Card className="space-y-3 border-hairline p-4">
                    <p className="text-[13px] text-ink">
                        Your link:{' '}
                        <a href={schedule.url} className="font-medium text-brand hover:underline">
                            {schedule.url}
                        </a>
                    </p>
                    <p className="text-[12px] text-mute">
                        {schedule.calendar_connected
                            ? 'Google Calendar is connected — busy times are hidden from guests.'
                            : 'Google Calendar is not connected. Guests see working hours only.'}
                    </p>
                </Card>
                <Card className="border-hairline p-4">
                    <Form action="/settings/meetings" method="put" className="grid gap-3">
                        <label className="flex items-center gap-2 text-[13px] text-ink">
                            <input type="checkbox" name="enabled" value="1" defaultChecked={schedule.enabled} />
                            Page is live
                        </label>
                        <div>
                            <Label htmlFor="meeting-slug">Link slug</Label>
                            <Input
                                id="meeting-slug"
                                name="slug"
                                required
                                defaultValue={schedule.slug}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="meeting-intro">Intro</Label>
                            <Input
                                id="meeting-intro"
                                name="intro"
                                defaultValue={schedule.intro ?? ''}
                                className="mt-1"
                                placeholder="30 min discovery"
                            />
                        </div>
                        <div>
                            <Label htmlFor="meeting-slot">Slot length</Label>
                            <select
                                id="meeting-slot"
                                name="slot_minutes"
                                defaultValue={schedule.slot_minutes}
                                className="mt-1 h-9 w-full rounded-md border border-hairline bg-canvas px-2 text-sm"
                            >
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>60 minutes</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="meeting-start">Work start</Label>
                                <Input
                                    id="meeting-start"
                                    name="work_start"
                                    type="time"
                                    required
                                    defaultValue={schedule.work_start}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="meeting-end">Work end</Label>
                                <Input
                                    id="meeting-end"
                                    name="work_end"
                                    type="time"
                                    required
                                    defaultValue={schedule.work_end}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <fieldset>
                            <legend className="text-[13px] font-medium text-ink">Days</legend>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {DAYS.map((day) => (
                                    <label key={day.value} className="flex items-center gap-1.5 text-[12px] text-ink">
                                        <input
                                            type="checkbox"
                                            name="weekdays[]"
                                            value={day.value}
                                            defaultChecked={schedule.weekdays.includes(day.value)}
                                        />
                                        {day.label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <div>
                            <Label htmlFor="meeting-location">Location / Meet link</Label>
                            <Input
                                id="meeting-location"
                                name="location_note"
                                defaultValue={schedule.location_note ?? ''}
                                className="mt-1"
                                placeholder="Paste a Meet or Zoom link"
                            />
                        </div>
                        <p className="text-[12px] text-mute">Timezone is always {schedule.timezone}.</p>
                        <Button type="submit">Save</Button>
                    </Form>
                </Card>
            </div>
        </>
    );
}
