<?php

namespace App\Services\Crm;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class CsvUpload
{
    public const MAX_ROWS = 10_000;

    /**
     * @return array{filename: string, hash: string, headers: list<string>, rows: list<array{row_number: int, raw: array<string, string>}>}
     */
    public function read(UploadedFile $file): array
    {
        $path = $file->getRealPath();
        if ($path === false) {
            throw ValidationException::withMessages([
                'file' => 'The CSV file could not be read.',
            ]);
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            throw ValidationException::withMessages([
                'file' => 'The CSV file could not be opened.',
            ]);
        }

        try {
            $headers = fgetcsv($handle);
            if (! is_array($headers) || $headers === []) {
                throw ValidationException::withMessages([
                    'file' => 'The CSV file must include a header row.',
                ]);
            }

            $headers = array_map(function (mixed $header): string {
                $value = trim((string) $header);

                return preg_replace('/^\xEF\xBB\xBF/', '', $value) ?? $value;
            }, $headers);

            if ($headers === [] || implode('', $headers) === '') {
                throw ValidationException::withMessages([
                    'file' => 'The CSV file must include a header row.',
                ]);
            }

            $rows = [];
            $rowNumber = 0;

            while (($data = fgetcsv($handle)) !== false) {
                $rowNumber++;

                if ($this->isEmpty($data)) {
                    continue;
                }

                $raw = [];
                foreach ($headers as $index => $header) {
                    $raw[$header] = trim((string) ($data[$index] ?? ''));
                }

                $rows[] = [
                    'row_number' => $rowNumber,
                    'raw' => $raw,
                ];

                if (count($rows) > self::MAX_ROWS) {
                    throw ValidationException::withMessages([
                        'file' => 'CSV imports are limited to '.self::MAX_ROWS.' rows.',
                    ]);
                }
            }
        } finally {
            fclose($handle);
        }

        if ($rows === []) {
            throw ValidationException::withMessages([
                'file' => 'The CSV file does not contain any data rows.',
            ]);
        }

        return [
            'filename' => $file->getClientOriginalName() ?: 'import.csv',
            'hash' => hash_file('sha256', $path) ?: hash('sha256', $file->getContent()),
            'headers' => $headers,
            'rows' => $rows,
        ];
    }

    /**
     * @param  array<int, mixed>  $data
     */
    private function isEmpty(array $data): bool
    {
        foreach ($data as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  array<string, string>  $aliases
     */
    public function suggestField(string $header, array $aliases): ?string
    {
        $normalized = strtolower(trim(preg_replace('/\s+/', ' ', $header) ?? $header));

        return $aliases[$normalized] ?? null;
    }
}
