import { BotAvatar } from 'bot-avatars';
import type { BotAvatarState, BotAvatarType } from 'bot-avatars';
import { useReducedMotion } from 'motion/react';
import {
    avatarColorForTone,
    avatarTypeForBotId,
    seedFromBotId,
} from '@/lib/desk/bot-catalog';
import type { BotDefinition } from '@/lib/desk/bot-catalog';
import { cn } from '@/lib/utils';

export type BloubState = 'idle' | 'listen' | 'think' | 'speak';
export type BloubAvatarSize = 72 | 28 | 18 | 16;

const SIZE_PX: Record<BloubAvatarSize, number> = {
    72: 72,
    28: 28,
    18: 18,
    16: 16,
};

const STATE_MAP: Record<BloubState, BotAvatarState> = {
    idle: 'default',
    listen: 'working',
    think: 'working',
    speak: 'working',
};

const STATE_LABELS: Record<BloubState, string> = {
    idle: 'waiting',
    listen: 'listening',
    think: 'thinking',
    speak: 'speaking',
};

type BotAvatarSource = Pick<
    BotDefinition,
    'id' | 'name' | 'avatarType' | 'avatarTone' | 'custom'
>;

type Props = {
    bot?: BotAvatarSource;
    botId?: string;
    className?: string;
    color?: string;
    label?: string;
    size?: BloubAvatarSize;
    state?: BloubState;
    type?: BotAvatarType;
};

export function BloubAvatar({
    bot,
    botId,
    className,
    color,
    label,
    size = 72,
    state = 'idle',
    type,
}: Props) {
    const reduceMotion = useReducedMotion();
    const px = SIZE_PX[size];
    const resolvedId = botId ?? bot?.id;
    const resolvedType =
        type ?? bot?.avatarType ?? avatarTypeForBotId(resolvedId);
    const resolvedColor =
        color ?? (bot?.custom ? avatarColorForTone(bot.avatarTone) : undefined);
    const ariaLabel =
        label ??
        (bot
            ? `${bot.name} avatar, ${STATE_LABELS[state]}`
            : `Bot is ${STATE_LABELS[state]}`);

    return (
        <span
            className={cn(
                'relative inline-grid shrink-0 place-items-center overflow-visible',
                className,
            )}
            data-bot-avatar
            data-bot-id={resolvedId}
            data-bot-state={STATE_MAP[state]}
            data-bot-type={resolvedType}
            style={{ width: px, height: px }}
        >
            {/* bot-avatars: type + state + seed. Docs: https://libraries.dev/bots.html */}
            <BotAvatar
                aria-label={ariaLabel}
                color={resolvedColor}
                face="mouth"
                interactive={size >= 28 && !reduceMotion}
                jumpEvery={size >= 28 ? 8 : 0}
                paused={Boolean(reduceMotion)}
                seed={seedFromBotId(resolvedId)}
                size={px}
                state={STATE_MAP[state]}
                theme="light"
                type={resolvedType}
            />
        </span>
    );
}
