/**
 * Evo Design System — SearchInput
 * Registry: shadcn/ui — input-group
 * Source: https://github.com/shadcn-ui/ui
 * Upstream: https://github.com/shadcn-ui/ui @ d75a96ab781f3d659be1ad287347d5887ce9f2fc
 * License: MIT (LICENSE.md, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Phosphor magnifier; French SR; Evo tokens.
 */

import * as React from 'react';

import { MagnifyingGlass } from '@/evo/icons';
import { sr } from '@/evo/lib/a11y';
import { Input  } from '@/evo/ui/input';
import type {InputProps} from '@/evo/ui/input';

export type SearchInputProps = Omit<InputProps, 'type' | 'startAdornment'> & {
    label?: string;
};

function SearchInput({ label = sr.search, ...props }: SearchInputProps) {
    return (
        <Input
            type="search"
            role="searchbox"
            aria-label={props['aria-label'] ?? label}
            startAdornment={<MagnifyingGlass className="size-3.5" aria-hidden />}
            clearable
            {...props}
        />
    );
}

export { SearchInput };
