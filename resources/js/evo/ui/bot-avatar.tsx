/**
 * Evo Design System — BotAvatar
 * Registry: custom Evo (bot-avatars MIT wrapper)
 * Source: https://www.npmjs.com/package/bot-avatars
 * License: MIT (package, verified 2026-10-01)
 * Copied: 2026-10-01
 * Modified: Evo size tokens; accessible name required.
 */

import * as React from 'react';

import { Robot } from '@/evo/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/evo/ui/avatar';

export type BotAvatarProps = {
    name: string;
    src?: string;
    size?: 'sm' | 'default' | 'lg';
    className?: string;
};

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function BotAvatar({ name, src, size = 'default', className }: BotAvatarProps) {
    return (
        <Avatar size={size} className={className} aria-label={name}>
            {src ? <AvatarImage src={src} alt="" /> : null}
            <AvatarFallback>
                {src ? (
                    initials(name)
                ) : (
                    <Robot className="size-3.5 text-[var(--evo-teal)]" aria-hidden />
                )}
            </AvatarFallback>
        </Avatar>
    );
}

export { BotAvatar };
