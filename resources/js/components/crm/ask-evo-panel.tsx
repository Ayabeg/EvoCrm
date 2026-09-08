import { Form } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState } from 'react';
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
    generated_at?: string | null;
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
        'Ask Evo about this record — answers use fields, recent activity, and WhatsApp on this workspace.';

    return (
        <>
            <p className="line-clamp-4 text-[12px] leading-5 text-mute">
                {summary}
            </p>
            {insight?.answer ? (
                <p className="border-l-2 border-brand/40 pl-2 text-[12px] leading-5">
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
                    placeholder="Ask a question…"
                    required
                    size="sm"
                    className="text-ui"
                />
                <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="w-full"
                >
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
    const [open, setOpen] = useState(true);
    const generated = insight?.generated_at
        ? new Date(insight.generated_at).toLocaleString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

    return (
        <section
            data-testid="ask-evo-rail"
            className="space-y-2 rounded-[var(--radius-1)] border border-hairline bg-canvas p-3"
        >
            <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-mute uppercase">
                    <Sparkles className="size-3.5 text-mute" aria-hidden />
                    Ask Evo
                </h3>
                <div className="flex items-center gap-1.5">
                    <span
                        data-testid="ask-evo-source"
                        className="rounded-full border border-hairline px-1.5 py-0.5 text-[10px] text-mute"
                    >
                        {insight?.live ? 'Evo + model' : 'This record'}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 px-0"
                        aria-expanded={open}
                        aria-label={open ? 'Collapse Ask Evo' : 'Expand Ask Evo'}
                        onClick={() => setOpen((value) => !value)}
                    >
                        {open ? (
                            <ChevronUp className="size-3.5" />
                        ) : (
                            <ChevronDown className="size-3.5" />
                        )}
                    </Button>
                </div>
            </div>
            {open ? (
                <div className="space-y-3">
                    <AskEvoBody action={action} insight={insight} />
                    {generated ? (
                        <p className="text-[10px] text-mute">
                            Generated {generated}
                        </p>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
}
