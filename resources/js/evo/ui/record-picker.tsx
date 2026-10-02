/**
 * Evo Design System — RecordPicker
 * Registry: shadcn/ui — combobox (CRM preset)
 * Source: https://ui.shadcn.com/docs/components/radix/combobox
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: record meta + avatar; French empty.
 */

import * as React from 'react';

import { Buildings, User } from '@/evo/icons';
import { Combobox   } from '@/evo/ui/combobox';
import type {ComboboxOption, ComboboxProps} from '@/evo/ui/combobox';

export type RecordPickerItem = ComboboxOption & {
    kind?: 'contact' | 'company' | 'deal' | 'lead' | 'ticket' | 'quote';
    meta?: string;
};

export type RecordPickerProps = Omit<ComboboxProps, 'options'> & {
    options: RecordPickerItem[];
};

function RecordPicker({ options, placeholder = 'Rechercher un enregistrement…', ...props }: RecordPickerProps) {
    const mapped = options.map((option) => ({
        ...option,
        label: option.meta ? `${option.label} — ${option.meta}` : option.label,
    }));

    return (
        <Combobox
            options={mapped}
            placeholder={placeholder}
            searchPlaceholder="Rechercher…"
            emptyText="Aucun enregistrement."
            {...props}
        />
    );
}

export { Buildings, RecordPicker, User };
