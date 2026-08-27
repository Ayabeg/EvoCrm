import { Form } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';

export type AskEvoPayload = {
    label?: string;
    summary?: string;
    question?: string | null;
    answer?: string | null;
    source?: string;
    live?: boolean;
};

function AskEvoBody({
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
        <>
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
        </>
    );
}

export default function AskEvoPanel({
    action,
    insight,
}: {
    action: string;
    insight?: AskEvoPayload | null;
}) {
    return (
        <>
            <Card
                data-testid="ask-evo"
                elevated={false}
                className="hidden py-0 md:block"
                style={{
                    borderRadius: 12,
                    backgroundImage:
                        'radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--evosales-mark) 16%, transparent) 0%, transparent 64%)',
                }}
            >
                <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                    <CardTitle
                        as="h3"
                        className="flex items-center gap-1.5 text-section-label uppercase"
                    >
                        <Sparkles className="size-3.5 text-brand" aria-hidden />
                        Ask Evo
                    </CardTitle>
                    <span className="text-[10px] text-mute">
                        {insight?.live ? 'Evo + model' : 'This record'}
                    </span>
                </CardHeader>
                <CardContent className="space-y-3 pb-4 text-ui">
                    <AskEvoBody action={action} insight={insight} />
                </CardContent>
            </Card>

            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        data-testid="ask-evo"
                        type="button"
                        variant="default"
                        size="sm"
                        className="fixed end-4 bottom-20 z-40 gap-1.5 shadow-lg md:hidden"
                    >
                        <Sparkles className="size-3.5" aria-hidden />
                        Ask Evo
                    </Button>
                </SheetTrigger>
                <SheetContent
                    side="bottom"
                    className="max-h-[85dvh] overflow-y-auto"
                >
                    <SheetHeader className="border-b border-hairline pb-3">
                        <SheetTitle className="flex items-center gap-1.5 text-section-label uppercase">
                            <Sparkles
                                className="size-3.5 text-brand"
                                aria-hidden
                            />
                            Ask Evo
                        </SheetTitle>
                        <p className="text-[10px] text-mute">
                            {insight?.live ? 'Evo + model' : 'This record'}
                        </p>
                    </SheetHeader>
                    <div className="space-y-3 pt-4 text-ui">
                        <AskEvoBody action={action} insight={insight} />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
