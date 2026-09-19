import { Form } from '@inertiajs/react';
import { CaretDown, CaretUp, Sparkle } from '@phosphor-icons/react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { useSimpleMode } from '@/hooks/use-simple-mode';
import type { AskEvoSuggestion } from '@/lib/ask-evo';
import { MOTION_HOVER_CLASS } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type AskEvoPayload = {
    label?: string;
    summary?: string;
    question?: string | null;
    answer?: string | null;
    source?: string;
    live?: boolean;
    generated_at?: string | null;
    context_label?: string | null;
    scope_key?: string | null;
    suggestions?: AskEvoSuggestion[];
};

function SuggestionChips({
    suggestions,
    onPick,
}: {
    suggestions?: AskEvoSuggestion[];
    onPick: (question: string) => void;
}) {
    if (!suggestions?.length) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested questions">
            {suggestions.map((chip) => (
                <button
                    key={chip.id}
                    type="button"
                    className={cn(
                        'rounded-full border border-hairline px-2 py-1 text-[11px] text-mute hover:text-ink',
                        MOTION_HOVER_CLASS,
                    )}
                    onClick={() => onPick(chip.question)}
                >
                    {chip.label}
                </button>
            ))}
        </div>
    );
}

function AskEvoBody({
    action,
    insight,
}: {
    action: string;
    insight?: AskEvoPayload | null;
}) {
    const inputId = useId();
    const statusId = useId();
    const [question, setQuestion] = useState('');
    const summary =
        insight?.summary ??
        'Ask Evo about this record — answers use authorized fields on this workspace.';
    const contextLabel = insight?.context_label ?? 'This record';

    return (
        <>
            <p
                data-testid="ask-evo-context"
                className="min-w-0 break-words text-[11px] text-mute"
                aria-live="polite"
            >
                Context: {contextLabel}
            </p>
            <p className="line-clamp-4 text-[12px] leading-5 text-mute">{summary}</p>
            {insight?.answer ? (
                <p className="border-l-2 border-brand/40 pl-2 text-[12px] leading-5">
                    {insight.question ? (
                        <span className="text-mute">{insight.question} — </span>
                    ) : null}
                    {insight.answer}
                </p>
            ) : null}
            <SuggestionChips
                suggestions={insight?.suggestions}
                onPick={setQuestion}
            />
            <Form
                action={action}
                method="post"
                className="flex flex-col gap-2"
                resetOnSuccess
                options={{ preserveScroll: true }}
            >
                {({ processing, errors }) => (
                    <>
                        <Input
                            id={inputId}
                            name="question"
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            placeholder="Ask a question…"
                            required
                            size="sm"
                            className="text-ui"
                            aria-label="Ask Evo question"
                            aria-describedby={statusId}
                            aria-busy={processing}
                            disabled={processing}
                        />
                        <p id={statusId} className="sr-only" aria-live="polite">
                            {processing ? 'Ask Evo is thinking' : ''}
                        </p>
                        {errors.question ? (
                            <p role="alert" className="text-[11px] text-destructive">
                                {errors.question}
                            </p>
                        ) : null}
                        <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={processing}
                        >
                            {processing ? 'Asking…' : 'Ask Evo'}
                        </Button>
                    </>
                )}
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
    const { features } = useSimpleMode();

    if (!features.ask_evo) {
        return null;
    }

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button
                    data-testid="ask-evo-trigger"
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={className}
                    aria-haspopup="dialog"
                    aria-label="Ask Evo about this record"
                >
                    <Sparkle className="size-3.5 text-mute" aria-hidden />
                    Ask Evo
                </Button>
            </DrawerTrigger>
            <DrawerContent
                side="bottom"
                className="max-h-[85dvh] overflow-y-auto overflow-x-hidden"
                aria-describedby="ask-evo-record-description"
            >
                <DrawerHeader className="border-b border-hairline pb-3">
                    <DrawerTitle className="flex items-center gap-1.5 text-[13px] font-semibold">
                        <Sparkle className="size-3.5 text-mute" aria-hidden />
                        Ask Evo
                    </DrawerTitle>
                    <DrawerDescription id="ask-evo-record-description" className="sr-only">
                        Ask a question about this record. Answers use authorized workspace fields.
                    </DrawerDescription>
                    <p className="text-[10px] text-mute">
                        {insight?.live ? 'Evo + model' : 'This record'}
                    </p>
                </DrawerHeader>
                <div className="space-y-3 pt-4 text-ui">
                    <AskEvoBody action={action} insight={insight} />
                </div>
            </DrawerContent>
        </Drawer>
    );
}

export default function AskEvoPanel({
    action,
    insight,
}: {
    action: string;
    insight?: AskEvoPayload | null;
}) {
    const { features } = useSimpleMode();
    const [open, setOpen] = useState(true);
    const generated = insight?.generated_at
        ? new Date(insight.generated_at).toLocaleString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : null;

    if (!features.ask_evo) {
        return null;
    }

    return (
        <section
            data-testid="ask-evo-rail"
            className="space-y-2 overflow-x-hidden rounded-[var(--radius-1)] border border-hairline bg-canvas p-3"
        >
            <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-mute uppercase">
                    <Sparkle className="size-3.5 text-mute" aria-hidden />
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
                            <CaretUp className="size-3.5" aria-hidden />
                        ) : (
                            <CaretDown className="size-3.5" aria-hidden />
                        )}
                    </Button>
                </div>
            </div>
            {open ? (
                <div className="space-y-3">
                    <AskEvoBody action={action} insight={insight} />
                    {generated ? (
                        <p className="text-[10px] text-mute">Generated {generated}</p>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
}
