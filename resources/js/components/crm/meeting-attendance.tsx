import { Form } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export function MeetingAttendanceButtons({
    activityId,
    attendance,
}: {
    activityId: number;
    attendance?: string | null;
}) {
    if (attendance === 'show' || attendance === 'no_show') {
        return (
            <p className="mt-1.5 text-[12px] text-mute">
                {attendance === 'show' ? 'Show' : 'No-show'}
            </p>
        );
    }

    return (
        <div className="mt-1.5 flex flex-wrap gap-2">
            <Form
                action={`/crm/activities/${activityId}/attendance`}
                method="post"
                options={{ preserveScroll: true }}
            >
                <input type="hidden" name="attendance" value="show" />
                <Button variant="ghost" size="sm" className="h-7 text-[11px]">
                    Show
                </Button>
            </Form>
            <Form
                action={`/crm/activities/${activityId}/attendance`}
                method="post"
                options={{ preserveScroll: true }}
            >
                <input type="hidden" name="attendance" value="no_show" />
                <Button variant="ghost" size="sm" className="h-7 text-[11px]">
                    No-show
                </Button>
            </Form>
        </div>
    );
}
