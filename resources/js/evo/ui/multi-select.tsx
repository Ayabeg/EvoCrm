/**
 * Evo Design System — MultiSelect
 * Registry: shadcn/ui — combobox
 * Source: https://ui.shadcn.com/docs/components/radix/combobox
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: multi value; chips; French.
 */

import * as React from 'react';

import { CaretDown, Check, X } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { cn } from '@/evo/lib/cn';
import { Badge } from '@/evo/ui/badge';
import { Button } from '@/evo/ui/button';
import type { ComboboxOption } from '@/evo/ui/combobox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/evo/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/evo/ui/popover';

export type MultiSelectProps = {
    options: ComboboxOption[];
    value?: string[];
    onValueChange?: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    className?: string;
};

function MultiSelect({
    options,
    value = [],
    onValueChange,
    placeholder = 'Sélectionner…',
    searchPlaceholder = 'Rechercher…',
    emptyText = 'Aucun résultat.',
    disabled,
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const selected = options.filter((option) => value.includes(option.value));

    const toggle = (next: string) => {
        onValueChange?.(value.includes(next) ? value.filter((item) => item !== next) : [...value, next]);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    role="combobox"
                    aria-expanded={open}
                    className={cn('h-auto min-h-9 w-full justify-between font-normal', className)}
                >
                    <span className="flex flex-wrap gap-1">
                        {selected.length === 0 ? (
                            <span className="text-[var(--evo-ink-faint)]">{placeholder}</span>
                        ) : (
                            selected.map((option) => (
                                <Badge key={option.value} variant="secondary">
                                    {option.label}
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`${sr.remove} ${option.label}`}
                                        className="ms-0.5"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            toggle(option.value);
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                toggle(option.value);
                                            }
                                        }}
                                    >
                                        <X className="size-3" aria-hidden />
                                    </span>
                                </Badge>
                            ))
                        )}
                    </span>
                    <CaretDown className="size-3.5 shrink-0 text-[var(--evo-ink-muted)]" aria-hidden />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const active = value.includes(option.value);

                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label}
                                        disabled={option.disabled}
                                        onSelect={() => toggle(option.value)}
                                    >
                                        <Check className={cn('size-3.5', active ? 'opacity-100' : 'opacity-0')} aria-hidden />
                                        {option.label}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export { MultiSelect };
