<?php

namespace App\Support;

final class CsvExport
{
    /** Keep user-controlled strings from being interpreted as spreadsheet formulas. */
    public static function cell(mixed $value): mixed
    {
        if (! is_string($value) || $value === '') {
            return $value;
        }

        return preg_match('/^[=+\-@]/u', $value) === 1 ? "'".$value : $value;
    }

    /** @param array<int, mixed> $values */
    public static function row(array $values): array
    {
        return array_map([self::class, 'cell'], $values);
    }
}
