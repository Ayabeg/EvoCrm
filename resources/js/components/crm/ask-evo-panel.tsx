import { Form } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type AskEvoPayload = {
    label?: string;
    summary?: string;
    question?: string | null;
    answer?: string | null;
    source?: string;
    live?: boolean;
};

export default function AskEvoPanel({
    action,
    insight,
}: {
    action: string;
    insight?: AskEvoPayload | null;
}) {
    const summary =
        insight?.summary ??
        'Ask Evo about this record — answers use fields and recent activity on this contact.';

    return (
        <section
            data-testid="ask-evo"
            className="rounded-lg border border-hairline bg-canvas p-4 text-ui text-ink shadow-xs"
            style={{
                backgroundImage:
                    'radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, #EC6025 16%, transparent) 0%, transparent 64%)',
            }}
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-section-label font-semibold uppercase tracking-wide text-ink">
                    Ask Evo
                </h3>
                <span className="text-[10px] text-mute">
                    {insight?.live ? 'Evo + model' : 'This record'}
                </span>
            </div>
            <p className="text-[12px] leading-5 text-ink">{summary}</p>
            {insight?.answer ? (
                <p className="mt-2 border-l-2 border-brand pl-2 text-[12px] leading-5">
                    {insight.question ? (
                        <span className="text-mute">{insight.question} — </span>
                    ) : null}
                    {insight.answer}
                </p>
            ) : null}
            <Form action={action} method="post" className="mt-3 flex flex-col gap-2" resetOnSuccess options={{ preserveScroll: true }}>
                <Input
                    name="question"
                    placeholder="Ask about this record…"
                    required
                    className="h-8 border-hairline bg-canvas text-ui"
                />
                <Button className="h-8 w-full text-[12px] sm:w-auto">Ask Evo</Button>
            </Form>
        </section>
    );
}
