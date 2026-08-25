import { Form } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

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
        <Card
            data-testid="ask-evo"
            accent="cyan"
            elevated={false}
            className="py-0"
            style={{
                backgroundImage:
                    'radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--evosales-mark) 16%, transparent) 0%, transparent 64%)',
            }}
        >
            <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                <CardTitle as="h3" className="flex items-center gap-1.5 text-section-label uppercase">
                    <Sparkles className="size-3.5 text-brand" aria-hidden />
                    Ask Evo
                </CardTitle>
                <span className="text-[10px] text-mute">
                    {insight?.live ? 'Evo + model' : 'This record'}
                </span>
            </CardHeader>
            <CardContent className="space-y-3 pb-4 text-ui">
                <p className="text-[12px] leading-5">{summary}</p>
                {insight?.answer ? (
                    <p className="border-l-2 border-brand pl-2 text-[12px] leading-5">
                        {insight.question ? (
                            <span className="text-mute">{insight.question} — </span>
                        ) : null}
                        {insight.answer}
                    </p>
                ) : null}
                <Form
                    action={action}
                    method="post"
                    className="flex flex-col gap-2"
                    resetOnSuccess
                    options={{ preserveScroll: true }}
                >
                    <Input
                        name="question"
                        placeholder="Ask about this record…"
                        required
                        size="sm"
                        className="text-ui"
                    />
                    <Button type="submit" size="sm" className="w-full sm:w-auto">
                        Ask Evo
                    </Button>
                </Form>
            </CardContent>
        </Card>
    );
}
