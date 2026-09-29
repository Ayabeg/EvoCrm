<?php

namespace App\Support;

final class SignupMode
{
    public const INVITE = 'invite';

    public const OPEN = 'open';

    public static function value(): string
    {
        $mode = strtolower(trim((string) config('evosales.signup.mode', self::INVITE)));

        return $mode === self::OPEN ? self::OPEN : self::INVITE;
    }

    public static function isOpen(): bool
    {
        return self::value() === self::OPEN;
    }

    public static function isInviteOnly(): bool
    {
        return ! self::isOpen();
    }

    public static function requestUrl(): string
    {
        $url = trim((string) config('evosales.signup.request_url', ''));

        return $url !== '' ? $url : 'mailto:hello@evotechly.com';
    }

    public static function closedStatus(): string
    {
        return 'Invite-only pilot — request access from a workspace admin.';
    }
}
