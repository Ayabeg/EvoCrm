<?php

namespace App\Services\Meta;

use App\Models\MetaFieldMapping;
use App\Models\Workspace;

class MetaFieldMapper
{
    /**
     * Built-in Meta Instant Form / Lead Ads names → EvoSales properties.
     * Unknown custom fields stay in the mapped bag under their original key.
     *
     * @see https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving
     *
     * @return array<string, string>
     */
    public static function defaults(): array
    {
        return [
            'email' => 'email',
            'email_address' => 'email',
            'work_email' => 'email',
            'phone' => 'phone',
            'phone_number' => 'phone',
            'work_phone_number' => 'phone',
            'full_name' => 'full_name',
            'full name' => 'full_name',
            'first_name' => 'first_name',
            'last_name' => 'last_name',
            'company' => 'company',
            'company_name' => 'company',
            'job_title' => 'job_title',
            'job title' => 'job_title',
            'city' => 'wilaya',
            'wilaya' => 'wilaya',
            'state' => 'wilaya',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function forWorkspace(Workspace $workspace): array
    {
        $map = self::defaults();

        foreach (MetaFieldMapping::query()->forWorkspace($workspace)->get() as $row) {
            $map[self::normalizeKey($row->meta_field)] = $row->crm_property;
        }

        return $map;
    }

    /**
     * @param  array<int|string, mixed>  $fields
     * @return array{mapped: array<string, string>, custom: array<string, string>, raw: array<string, string>}
     */
    public function map(Workspace $workspace, array $fields): array
    {
        $raw = $this->flatten($fields);
        $map = $this->forWorkspace($workspace);
        $mapped = [];
        $custom = [];

        foreach ($raw as $key => $value) {
            $normalized = self::normalizeKey($key);
            $property = $map[$normalized] ?? $map[$key] ?? null;

            if ($property === null) {
                $custom[$key] = $value;
                $mapped[$key] = $value;

                continue;
            }

            $mapped[$property] = $value;
        }

        return [
            'mapped' => $mapped,
            'custom' => $custom,
            'raw' => $raw,
        ];
    }

    public function replace(Workspace $workspace, array $mappings): void
    {
        $keep = [];

        foreach ($mappings as $row) {
            $field = self::normalizeKey((string) ($row['meta_field'] ?? ''));
            $property = trim((string) ($row['crm_property'] ?? ''));

            if ($field === '' || $property === '') {
                continue;
            }

            $keep[] = $field;

            MetaFieldMapping::query()->updateOrCreate(
                ['workspace_id' => $workspace->id, 'meta_field' => $field],
                [
                    'crm_property' => $property,
                    'is_custom' => ! array_key_exists($field, self::defaults()),
                ],
            );
        }

        MetaFieldMapping::query()
            ->forWorkspace($workspace)
            ->when($keep !== [], fn ($query) => $query->whereNotIn('meta_field', $keep))
            ->when($keep === [], fn ($query) => $query)
            ->delete();
    }

    public static function normalizeKey(string $key): string
    {
        return strtolower(trim(str_replace([' ', '-'], '_', $key)));
    }

    /**
     * @param  array<int|string, mixed>  $fields
     * @return array<string, string>
     */
    public function flatten(array $fields): array
    {
        $flat = [];

        foreach ($fields as $key => $value) {
            if (is_array($value) && isset($value['name'])) {
                $flat[(string) $value['name']] = (string) ($value['values'][0] ?? $value['value'] ?? '');

                continue;
            }

            if (is_string($key)) {
                $flat[$key] = is_scalar($value) ? (string) $value : (json_encode($value) ?: '');
            }
        }

        return $flat;
    }
}
