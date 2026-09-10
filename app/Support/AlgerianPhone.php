<?php

namespace App\Support;

final class AlgerianPhone
{
    public static function normalize(?string $raw, string $defaultCountry = '213'): ?string
    {
        if ($raw === null) {
            return null;
        }

        $value = trim($raw);

        if ($value === '') {
            return null;
        }

        $value = preg_replace('/[\s().-]+/', '', $value) ?? $value;

        if (str_starts_with($value, '00')) {
            $value = '+'.substr($value, 2);
        }

        if (str_starts_with($value, '+')) {
            $digits = preg_replace('/\D+/', '', $value) ?? '';

            return $digits !== '' ? '+'.$digits : null;
        }

        $digits = preg_replace('/\D+/', '', $value) ?? '';

        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, $defaultCountry)) {
            return '+'.$digits;
        }

        if (str_starts_with($digits, '0')) {
            return '+'.$defaultCountry.substr($digits, 1);
        }

        return '+'.$defaultCountry.$digits;
    }

    public static function toWhatsAppJid(?string $e164): ?string
    {
        if ($e164 === null || $e164 === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $e164) ?? '';

        return $digits !== '' ? $digits.'@s.whatsapp.net' : null;
    }

    public static function fromJid(?string $jid): ?string
    {
        if ($jid === null || $jid === '') {
            return null;
        }

        $local = explode('@', $jid)[0] ?? '';
        $local = explode(':', $local)[0] ?? '';
        $digits = preg_replace('/\D+/', '', $local) ?? '';

        return $digits !== '' ? '+'.$digits : null;
    }

    /**
     * Algerian mobiles: +213 then 5 (Ooredoo), 6 (Mobilis), or 7 (Djezzy), then 8 digits.
     */
    public static function isMobile(?string $raw): bool
    {
        $e164 = self::normalize($raw);

        return $e164 !== null && (bool) preg_match('/^\+213[567]\d{8}$/', $e164);
    }

    public static function operator(?string $raw): ?string
    {
        $e164 = self::normalize($raw);

        if ($e164 === null || ! self::isMobile($e164)) {
            return null;
        }

        return match ($e164[4] ?? '') {
            '5' => 'ooredoo',
            '6' => 'mobilis',
            '7' => 'djezzy',
            default => null,
        };
    }
}
