/**
 * Evo Design System — Combobox
 * Registry: shadcn/ui — combobox
 * Source: https://ui.shadcn.com/docs/components/radix/combobox
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: cmdk + Popover (Radix) instead of Base UI; French empty; Evo tokens.
 */

import * as React from 'react';

import { CaretDown, Check } from '@/evo/icons';
import { cn } from '@/evo/lib/cn';
import { Button } from '@/evo/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/evo/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/evo/ui/popover';

export type ComboboxOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

export type ComboboxProps = {
    options: ComboboxOption[];
    value?: string | null;
    onValueChange?: (value: string | null) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    className?: string;
    id?: string;
    defaultOpen?: boolean;
};

function Combobox({
    options,
    value,
    onValueChange,
    placeholder = 'Sélectionner…',
    searchPlaceholder = 'Rechercher…',
    emptyText = 'Aucun résultat.',
    disabled,
    className,
    id,
    defaultOpen = false,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(defaultOpen);
    const selected = options.find((option) => option.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    disabled={disabled}
                    aria-expanded={open}
                    role="combobox"
                    className={cn('w-full justify-between font-normal', !selected && 'text-[var(--evo-ink-faint)]', className)}
                >
                    <span className="truncate">{selected?.label ?? placeholder}</span>
                    <CaretDown className="size-3.5 shrink-0 text-[var(--evo-ink-muted)]" aria-hidden />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    disabled={option.disabled}
                                    onSelect={() => {
                                        onValueChange?.(option.value === value ? null : option.value);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'size-3.5',
                                            option.value === value ? 'opacity-100' : 'opacity-0',
                                        )}
                                        aria-hidden
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export { Combobox };
