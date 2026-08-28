import { Form } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
            <p className="line-clamp-3 text-[12px] leading-5 text-mute">{summary}</p>
            {insight?.answer ? (
                <p className="border-l-2 border-hairline pl-2 text-[12px] leading-5">
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
                <Button type="submit" variant="outline" size="sm" className="w-full sm:w-auto">
                    Ask Evo
                </Button>
            </Form>
        </>
    );
}

export function AskEvoTrigger({
    action,
    insight,
    className,
}: {
    action: string;
    insight?: AskEvoPayload | null;
    className?: string;
}) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    data-testid="ask-evo-trigger"
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={className}
                >
                    <Sparkles className="size-3.5 text-mute" aria-hidden />
                    Ask Evo
                </Button>
            </SheetTrigger>
            <SheetContent
                side="bottom"
                className="max-h-[85dvh] overflow-y-auto"
            >
                <SheetHeader className="border-b border-hairline pb-3">
                    <SheetTitle className="flex items-center gap-1.5 text-[13px] font-semibold">
                        <Sparkles className="size-3.5 text-mute" aria-hidden />
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
        <section data-testid="ask-evo" className="space-y-2 border-t border-hairline pt-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-mute uppercase">
                    <Sparkles className="size-3.5 text-mute" aria-hidden />
                    Ask Evo
                </h3>
                <span className="text-[10px] text-mute">
                    {insight?.live ? 'Evo + model' : 'This record'}
                </span>
            </div>
            <AskEvoBody action={action} insight={insight} />
        </section>
    );
}
