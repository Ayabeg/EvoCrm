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
    if (!insight) {
        return null;
    }

    return (
        <section
            data-testid="ask-evo"
            className="rounded border border-hairline bg-canvas p-3 text-sm text-ink"
            style={{
                backgroundImage:
                    'radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, #EC6025 16%, transparent) 0%, transparent 64%)',
            }}
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink">Ask Evo</h3>
                <span className="text-[10px] text-mute">{insight.live ? 'Evo + model' : 'This record'}</span>
            </div>
            <p className="text-[12px] leading-5 text-ink">{insight.summary}</p>
            {insight.answer ? (
                <p className="mt-2 border-l-2 border-brand pl-2 text-[12px] leading-5">
                    {insight.question ? <span className="text-mute">{insight.question} — </span> : null}
                    {insight.answer}
                </p>
            ) : null}
            <Form action={action} method="post" className="mt-2 flex gap-1" resetOnSuccess>
                <Input name="question" placeholder="Ask about this record…" required className="h-7" />
                <Button className="h-7 shrink-0 text-[11px]">Ask Evo</Button>
            </Form>
        </section>
    );
}
