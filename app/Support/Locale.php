<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Cookie;

final class Locale
{
    public const COOKIE = 'locale';

    /** @var list<string> */
    public const SUPPORTED = ['fr', 'en', 'ar'];

    public static function normalize(mixed $value): ?string
    {
        $locale = strtolower(trim((string) $value));

        return in_array($locale, self::SUPPORTED, true) ? $locale : null;
    }

    public static function applicationDefault(): string
    {
        return self::normalize(config('app.locale')) ?? 'fr';
    }

    /**
     * @param  array<string, mixed>|null  $preferences
     */
    public static function fromPreferences(mixed $preferences): ?string
    {
        if (! is_array($preferences)) {
            return null;
        }

        return self::normalize($preferences['locale'] ?? null);
    }

    public static function resolve(?User $user = null, ?Request $request = null): string
    {
        $request ??= request();

        if ($user) {
            $preferred = self::fromPreferences($user->preferences);

            if ($preferred !== null) {
                return $preferred;
            }

            $workspace = $user->relationLoaded('workspace')
                ? $user->workspace
                : $user->workspace()->first();

            $workspaceLocale = self::fromPreferences($workspace?->preferences);

            if ($workspaceLocale !== null) {
                return $workspaceLocale;
            }
        }

        $cookie = self::normalize($request?->cookie(self::COOKIE));

        if ($cookie !== null) {
            return $cookie;
        }

        return self::applicationDefault();
    }

    public static function direction(string $locale): string
    {
        return $locale === 'ar' ? 'rtl' : 'ltr';
    }

    public static function htmlLang(string $locale): string
    {
        return self::normalize($locale) ?? self::applicationDefault();
    }

    public static function intl(string $locale): string
    {
        return match (self::normalize($locale) ?? self::applicationDefault()) {
            'ar' => 'ar-DZ',
            'en' => 'en-DZ',
            default => 'fr-DZ',
        };
    }

    /**
     * Calendar chrome. Latin digits in every language, Africa/Algiers.
     */
    public static function formatDisplayDate(
        \DateTimeInterface $date,
        string $pattern = 'EEEE, d MMMM y',
        ?string $locale = null,
    ): string {
        $intl = self::intl($locale ?? app()->getLocale()).'@numbers=latn';
        $formatter = new \IntlDateFormatter(
            $intl,
            \IntlDateFormatter::FULL,
            \IntlDateFormatter::NONE,
            'Africa/Algiers',
            \IntlDateFormatter::GREGORIAN,
            $pattern,
        );

        return $formatter->format($date) ?: $date->format('Y-m-d');
    }

    public static function formatMonthLabel(\DateTimeInterface $date, ?string $locale = null): string
    {
        return self::formatDisplayDate($date, 'MMMM y', $locale);
    }

    public static function formatMonthShort(\DateTimeInterface $date, ?string $locale = null): string
    {
        return self::formatDisplayDate($date, 'MMM', $locale);
    }

    /**
     * @param  array<string, mixed>|null  $preferences
     * @return array<string, mixed>
     */
    public static function mergePreference(?array $preferences, string $locale): array
    {
        $bag = is_array($preferences) ? $preferences : [];
        $bag['locale'] = $locale;

        return $bag;
    }

    public static function cookie(string $locale): Cookie
    {
        return cookie(
            self::COOKIE,
            $locale,
            60 * 24 * 365,
            '/',
            null,
            config('session.secure'),
            false,
            false,
            'lax',
        );
    }

    public static function forWorkspace(mixed $workspace): string
    {
        $preferences = is_object($workspace) ? ($workspace->preferences ?? null) : null;

        return self::fromPreferences($preferences) ?? self::applicationDefault();
    }
}
