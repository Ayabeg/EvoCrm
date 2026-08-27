<?php

namespace App\Support;

final class LeadCaptureNormalizer
{
    /**
     * @param  array<string, mixed>  $input
     * @return array{name: ?string, phone: ?string, email: ?string, company: ?string, wilaya: ?string}
     */
    public static function normalize(array $input): array
    {
        $email = isset($input['email']) ? strtolower(trim((string) $input['email'])) : '';
        $email = $email !== '' ? $email : null;

        $phone = AlgerianPhone::normalize(
            isset($input['phone']) && trim((string) $input['phone']) !== ''
                ? (string) $input['phone']
                : null
        );

        return [
            'name' => self::nullableString($input['name'] ?? null),
            'phone' => $phone,
            'email' => $email,
            'company' => self::nullableString($input['company'] ?? null),
            'wilaya' => self::nullableString($input['wilaya'] ?? null),
        ];
    }

    /**
     * @return array{first_name: string, last_name: ?string}
     */
    public static function splitName(?string $name): array
    {
        $value = trim((string) $name);

        if ($value === '') {
            return ['first_name' => 'Lead', 'last_name' => null];
        }

        $parts = preg_split('/\s+/', $value, 2) ?: [$value];

        return [
            'first_name' => $parts[0],
            'last_name' => $parts[1] ?? null,
        ];
    }

    public static function leadTitle(string $name, ?string $company, string $source): string
    {
        if ($name !== '') {
            return $name;
        }

        if (filled($company)) {
            return (string) $company;
        }

        return match ($source) {
            'meta_form' => 'Meta lead form',
            'csv' => 'CSV capture',
            'url' => 'Public URL capture',
            'maps_search' => 'Maps search capture',
            default => 'Inbound capture',
        };
    }

    private static function nullableString(mixed $value): ?string
    {
        $text = trim((string) $value);

        return $text !== '' ? $text : null;
    }
}
