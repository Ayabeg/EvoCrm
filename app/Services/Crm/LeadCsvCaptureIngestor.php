<?php

namespace App\Services\Crm;

use App\Models\LeadCapture;
use App\Models\User;
use App\Models\Workspace;
use App\Support\LeadCaptureNormalizer;
use Illuminate\Http\UploadedFile;

class LeadCsvCaptureIngestor
{
    public const ALIASES = [
        'name' => 'name',
        'full name' => 'name',
        'full_name' => 'name',
        'nom' => 'name',
        'nom complet' => 'name',
        'first name' => 'name',
        'firstname' => 'name',
        'prenom' => 'name',
        'prénom' => 'name',
        'phone' => 'phone',
        'phone number' => 'phone',
        'telephone' => 'phone',
        'téléphone' => 'phone',
        'tel' => 'phone',
        'mobile' => 'phone',
        'mobile phone number' => 'phone',
        'portable' => 'phone',
        'email' => 'email',
        'e-mail' => 'email',
        'mail' => 'email',
        'courriel' => 'email',
        'company' => 'company',
        'company name' => 'company',
        'societe' => 'company',
        'société' => 'company',
        'entreprise' => 'company',
        'wilaya' => 'wilaya',
        'city' => 'wilaya',
        'ville' => 'wilaya',
        'state' => 'wilaya',
        'province' => 'wilaya',
    ];

    public function __construct(
        private CsvUpload $csv,
        private LeadCaptureDeduper $deduper,
    ) {}

    /**
     * @return list<LeadCapture>
     */
    public function ingest(Workspace $workspace, User $actor, UploadedFile $file): array
    {
        $parsed = $this->csv->read($file);
        $mapping = $this->mapHeaders($parsed['headers']);
        $captures = [];

        foreach ($parsed['rows'] as $row) {
            $values = $this->mappedValues($row['raw'], $mapping);
            $normalized = LeadCaptureNormalizer::normalize($values);

            $captures[] = $this->deduper->record(
                $workspace->id,
                LeadCapture::SOURCE_CSV,
                $normalized,
                [
                    'filename' => $parsed['filename'],
                    'row_number' => $row['row_number'],
                    'raw' => $row['raw'],
                ],
                $actor->id,
            );
        }

        return $captures;
    }

    /**
     * @param  list<string>  $headers
     * @return array<string, string>
     */
    private function mapHeaders(array $headers): array
    {
        $mapping = [];

        foreach ($headers as $header) {
            $field = $this->csv->suggestField($header, self::ALIASES);
            $mapping[$header] = $field ?? '';
        }

        return $mapping;
    }

    /**
     * @param  array<string, string>  $raw
     * @param  array<string, string>  $mapping
     * @return array<string, string>
     */
    private function mappedValues(array $raw, array $mapping): array
    {
        $values = [];

        foreach ($mapping as $header => $field) {
            if ($field === '') {
                continue;
            }

            $value = trim((string) ($raw[$header] ?? ''));

            if ($field === 'name' && isset($values['name']) && $values['name'] !== '') {
                continue;
            }

            $values[$field] = $value;
        }

        return $values;
    }
}
