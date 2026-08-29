import { Form } from '@inertiajs/react';
import { RecordSection } from '@/components/crm/record-hub';

export type DealSuggestionPayload = {
    id: number;
    kind: string;
    action: string;
    confidence: string;
    status: string;
    title: string;
    body?: string | null;
    human_only: boolean;
};

export default function DealSuggestionCard({
    dealId,
    suggestion,
    title,
}: {
    dealId: number;
    suggestion?: DealSuggestionPayload | null;
    title: string;
}) {
    if (!suggestion) {
        return null;
    }

    return (
        <RecordSection title={title}>
            <p className="text-[13px] font-medium text-ink">{suggestion.title}</p>
            <p className="mt-1 text-[12px] text-mute">
                {suggestion.action.replaceAll('_', ' ')} · {suggestion.confidence}
                {suggestion.human_only ? ' · human only' : ''}
            </p>
            {suggestion.body ? (
                <p className="mt-2 text-[12px] leading-5 text-ink">{suggestion.body}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
                <Form
                    action={`/crm/deals/${dealId}/suggestions/${suggestion.id}/apply`}
                    method="post"
                >
                    <button
                        type="submit"
                        className="h-7 rounded-md bg-brand px-3 text-[11px] font-medium text-canvas"
                    >
                        Apply
                    </button>
                </Form>
                <Form
                    action={`/crm/deals/${dealId}/suggestions/${suggestion.id}/dismiss`}
                    method="post"
                >
                    <button
                        type="submit"
                        className="h-7 rounded-md border border-hairline bg-canvas px-3 text-[11px] text-ink"
                    >
                        Dismiss
                    </button>
                </Form>
            </div>
        </RecordSection>
    );
}
