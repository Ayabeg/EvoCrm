/**
 * Evo Design System — PromptInput
 * Registry: Prompt Kit — prompt-input
 * Source: https://www.prompt-kit.com/docs/prompt-input · https://github.com/ibelick/prompt-kit
 * Upstream: https://github.com/ibelick/prompt-kit @ 5a9496635cc0e1bf7679fe2a9e35d9b36b99c08a
 * License: MIT (LICENCE.md, verified 2026-10-02)
 * Copied: 2026-10-02
 * Modified: Evo tokens; 32/36 controls; teal focus; IME-safe Enter / Shift+Enter;
 * orange only on the send CTA (consumed by AgentComposer).
 */

import {
    createContext,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import type {
    ComponentProps,
    KeyboardEvent,
    MouseEventHandler,
    ReactNode,
    RefObject,
} from 'react';
import { evoFocus } from '@/evo/ai/types';
import { cn } from '@/evo/lib/cn';
import { Textarea } from '@/evo/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/evo/ui/tooltip';

type PromptInputContextType = {
    isLoading: boolean;
    value: string;
    setValue: (value: string) => void;
    maxHeight: number | string;
    onSubmit?: () => void;
    disabled?: boolean;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
};

const PromptInputContext = createContext<PromptInputContextType>({
    isLoading: false,
    value: '',
    setValue: () => {},
    maxHeight: 240,
    onSubmit: undefined,
    disabled: false,
    textareaRef: { current: null },
});

function usePromptInput() {
    return useContext(PromptInputContext);
}

export type PromptInputProps = {
    isLoading?: boolean;
    value?: string;
    onValueChange?: (value: string) => void;
    maxHeight?: number | string;
    onSubmit?: () => void;
    children: ReactNode;
    className?: string;
    disabled?: boolean;
} & ComponentProps<'div'>;

export function PromptInput({
    className,
    isLoading = false,
    maxHeight = 240,
    value,
    onValueChange,
    onSubmit,
    children,
    disabled = false,
    onClick,
    ...props
}: PromptInputProps) {
    const [internalValue, setInternalValue] = useState(value ?? '');
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleChange = (next: string) => {
        setInternalValue(next);
        onValueChange?.(next);
    };

    const handleClick: MouseEventHandler<HTMLDivElement> = (event) => {
        if (!disabled) {
            textareaRef.current?.focus();
        }

        onClick?.(event);
    };

    return (
        <PromptInputContext.Provider
            value={{
                isLoading,
                value: value ?? internalValue,
                setValue: onValueChange ?? handleChange,
                maxHeight,
                onSubmit,
                disabled,
                textareaRef,
            }}
        >
            <div
                onClick={handleClick}
                className={cn(
                    'cursor-text rounded-[var(--evo-radius-floating)] border border-evo-hairline bg-evo-surface p-3',
                    disabled && 'cursor-not-allowed opacity-60',
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        </PromptInputContext.Provider>
    );
}

export type PromptInputTextareaProps = {
    disableAutosize?: boolean;
} & ComponentProps<typeof Textarea>;

export function PromptInputTextarea({
    className,
    onKeyDown,
    disableAutosize = false,
    ...props
}: PromptInputTextareaProps) {
    const { value, setValue, maxHeight, onSubmit, disabled, textareaRef } =
        usePromptInput();

    const adjustHeight = (el: HTMLTextAreaElement | null) => {
        if (!el || disableAutosize) {
            return;
        }

        el.style.height = 'auto';

        if (typeof maxHeight === 'number') {
            el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
        } else {
            el.style.height = `min(${el.scrollHeight}px, ${maxHeight})`;
        }
    };

    const handleRef = (el: HTMLTextAreaElement | null) => {
        textareaRef.current = el;
        adjustHeight(el);
    };

    useLayoutEffect(() => {
        const el = textareaRef.current;

        if (!el || disableAutosize) {
            return;
        }

        el.style.height = 'auto';

        if (typeof maxHeight === 'number') {
            el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
        } else {
            el.style.height = `min(${el.scrollHeight}px, ${maxHeight})`;
        }
    }, [disableAutosize, maxHeight, textareaRef, value]);

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();
            onSubmit?.();
        }

        onKeyDown?.(event);
    };

    return (
        <Textarea
            ref={handleRef}
            value={value}
            unstyled
            onChange={(event) => {
                adjustHeight(event.target);
                setValue(event.target.value);
            }}
            onKeyDown={handleKeyDown}
            className={cn(
                'min-h-9 w-full resize-none border-0 bg-transparent px-1 py-1.5 text-[13px] leading-5 text-evo-ink shadow-none outline-none placeholder:text-evo-ink-muted',
                evoFocus,
                className,
            )}
            rows={1}
            disabled={disabled}
            {...props}
        />
    );
}

export function PromptInputActions({
    children,
    className,
    ...props
}: ComponentProps<'div'>) {
    return (
        <div
            className={cn('flex items-center justify-between gap-2', className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function PromptInputAction({
    tooltip,
    children,
    className,
    side = 'top',
    ...props
}: {
    tooltip: ReactNode;
    children: ReactNode;
    className?: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
} & ComponentProps<typeof Tooltip>) {
    const { disabled } = usePromptInput();

    return (
        <TooltipProvider>
            <Tooltip {...props}>
                <TooltipTrigger
                    asChild
                    disabled={disabled}
                    onClick={(event) => event.stopPropagation()}
                >
                    {children}
                </TooltipTrigger>
                <TooltipContent side={side} className={className}>
                    {tooltip}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export { usePromptInput };
