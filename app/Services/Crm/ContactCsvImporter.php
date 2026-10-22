<?php

namespace App\Services\Crm;

use App\Jobs\EnrichRecordJob;
use App\Jobs\ProcessImportBatch;
use App\Models\Company;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\ImportBatch;
use App\Models\ImportRow;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Operations\AuditLogger;
use App\Support\AlgerianPhone;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class ContactCsvImporter
{
    public const FIELDS = [
        'external_id' => 'External ID',
        'first_name' => 'First name',
        'last_name' => 'Last name',
        'email' => 'Email',
        'phone' => 'Phone',
        'company_name' => 'Company name',
        'owner' => 'Owner',
        'city' => 'City',
        'wilaya' => 'Wilaya',
        'source' => 'Source',
        'lead_status' => 'Lead status',
    ];

    public const ALIASES = [
        'record id' => 'external_id',
        'contact id' => 'external_id',
        'hs_object_id' => 'external_id',
        'external id' => 'external_id',
        'first name' => 'first_name',
        'lastname' => 'last_name',
        'last name' => 'last_name',
        'email' => 'email',
        'e-mail' => 'email',
        'phone number' => 'phone',
        'phone' => 'phone',
        'mobile phone number' => 'phone',
        'mobile' => 'phone',
        'company name' => 'company_name',
        'company' => 'company_name',
        'hubspot owner' => 'owner',
        'owner' => 'owner',
        'contact owner' => 'owner',
        'city' => 'city',
        'wilaya' => 'wilaya',
        'lead status' => 'lead_status',
        'source' => 'source',
        'original source' => 'source',
    ];

    public function __construct(
        private CsvUpload $csv,
        private CustomAttributes $attributes,
    ) {}

    public function createBatch(Workspace $workspace, User $actor, UploadedFile $file): ImportBatch
    {
        $parsed = $this->csv->read($file);
        $definitions = $this->attributes->definitions($workspace, 'contact');
        $mapping = $this->suggestMapping($parsed['headers'], $definitions->pluck('key')->all());

        $batch = ImportBatch::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $actor->id,
            'type' => ImportBatch::TYPE_CONTACTS,
            'status' => ImportBatch::STATUS_UPLOADED,
            'filename' => $parsed['filename'],
            'source_hash' => $parsed['hash'],
            'headers' => $parsed['headers'],
            'mapping' => $mapping,
            'total_rows' => count($parsed['rows']),
        ]);

        foreach ($parsed['rows'] as $row) {
            ImportRow::query()->create([
                'import_batch_id' => $batch->id,
                'row_number' => $row['row_number'],
                'raw' => $row['raw'],
                'status' => ImportRow::STATUS_PENDING,
            ]);
        }

        $this->classify($batch->fresh(['rows']) ?? $batch);

        return $batch->fresh(['rows']) ?? $batch;
    }

    /**
     * @param  list<string>  $headers
     * @param  list<string>  $attributeKeys
     * @return array<string, string>
     */
    public function suggestMapping(array $headers, array $attributeKeys = []): array
    {
        $attributeAliases = [];
        foreach ($attributeKeys as $key) {
            $attributeAliases[strtolower(str_replace('_', ' ', $key))] = 'attr.'.$key;
            $attributeAliases[strtolower($key)] = 'attr.'.$key;
        }

        $mapping = [];
        foreach ($headers as $header) {
            $field = $this->csv->suggestField($header, self::ALIASES)
                ?? $this->csv->suggestField($header, $attributeAliases);

            $mapping[$header] = $field ?? '';
        }

        return $mapping;
    }

    /**
     * @param  array<string, string>  $mapping
     */
    public function applyMapping(ImportBatch $batch, array $mapping): ImportBatch
    {
        $allowed = array_merge(
            array_keys(self::FIELDS),
            $this->attributes->definitions($batch->workspace, 'contact')
                ->map(fn ($definition) => 'attr.'.$definition->key)
                ->all(),
            [''],
        );

        $clean = [];
        foreach ($batch->headers ?? [] as $header) {
            $value = $mapping[$header] ?? '';
            if (! in_array($value, $allowed, true)) {
                throw ValidationException::withMessages([
                    "mapping.{$header}" => 'That field is not available for contact import.',
                ]);
            }
            $clean[$header] = $value;
        }

        $batch->forceFill([
            'mapping' => $clean,
            'status' => ImportBatch::STATUS_MAPPED,
        ])->save();

        $this->classify($batch->fresh(['rows']) ?? $batch);

        return $batch->fresh(['rows']) ?? $batch;
    }

    public function commit(ImportBatch $batch): void
    {
        if (in_array($batch->status, [ImportBatch::STATUS_PROCESSING, ImportBatch::STATUS_COMPLETED], true)) {
            return;
        }

        $batch->forceFill([
            'status' => ImportBatch::STATUS_PROCESSING,
            'started_at' => $batch->started_at ?? now(),
            'error_summary' => null,
        ])->save();

        ProcessImportBatch::dispatch($batch->id);
    }

    public function process(ImportBatch $batch): void
    {
        $batch->forceFill([
            'status' => ImportBatch::STATUS_PROCESSING,
            'started_at' => $batch->started_at ?? now(),
        ])->save();

        try {
            $batch->rows()
                ->where('status', ImportRow::STATUS_PENDING)
                ->orderBy('row_number')
                ->chunkById(100, function ($rows) use ($batch): void {
                    foreach ($rows as $row) {
                        $this->processRow($batch->fresh() ?? $batch, $row);
                    }
                });

            $batch->refresh();
            $batch->forceFill([
                'status' => ImportBatch::STATUS_COMPLETED,
                'finished_at' => now(),
                'processed_rows' => $batch->total_rows,
            ])->save();

            if ($batch->workspace) {
                app(AuditLogger::class)->record(
                    $batch->workspace,
                    'import.completed',
                    'Contact import '.$batch->filename.' finished',
                    $batch->user,
                    $batch,
                    [
                        'created' => $batch->created_count,
                        'updated' => $batch->updated_count,
                        'filename' => $batch->filename,
                    ],
                );
            }
        } catch (Throwable $exception) {
            $batch->forceFill([
                'status' => ImportBatch::STATUS_FAILED,
                'finished_at' => now(),
                'error_summary' => mb_substr($exception->getMessage(), 0, 500),
            ])->save();

            throw $exception;
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function present(ImportBatch $batch): array
    {
        $workspace = $batch->workspace;
        $definitions = $this->attributes->definitions($workspace, 'contact');
        $fields = self::FIELDS;
        foreach ($definitions as $definition) {
            $fields['attr.'.$definition->key] = $definition->label;
        }

        $preview = [
            'created' => $batch->rows()->where('preview_action', ImportRow::ACTION_CREATE)->count(),
            'updated' => $batch->rows()->where('preview_action', ImportRow::ACTION_UPDATE)->count(),
            'skipped' => $batch->rows()->where('preview_action', ImportRow::ACTION_SKIP)->count(),
            'errors' => $batch->rows()->where('preview_action', ImportRow::ACTION_ERROR)->count(),
            'total' => $batch->total_rows,
        ];

        $samples = $batch->rows()
            ->limit(8)
            ->get()
            ->map(function (ImportRow $row) use ($batch): array {
                $mapped = $this->mappedValues($row->raw ?? [], $batch->mapping ?? []);

                return [
                    'row_number' => $row->row_number,
                    'action' => $row->status !== ImportRow::STATUS_PENDING ? $row->status : $row->preview_action,
                    'values' => [
                        'name' => trim(($mapped['first_name'] ?? '').' '.($mapped['last_name'] ?? '')),
                        'email' => $mapped['email'] ?? '',
                        'phone' => $mapped['phone'] ?? '',
                        'company' => $mapped['company_name'] ?? '',
                    ],
                    'error' => $row->error_message,
                ];
            })
            ->values()
            ->all();

        $errors = $batch->rows()
            ->where(function ($query): void {
                $query->where('preview_action', ImportRow::ACTION_ERROR)
                    ->orWhere('status', ImportRow::STATUS_ERROR);
            })
            ->orderBy('row_number')
            ->limit(25)
            ->get(['row_number', 'error_message'])
            ->map(fn (ImportRow $row) => [
                'row_number' => $row->row_number,
                'message' => $row->error_message,
            ])
            ->values()
            ->all();

        return [
            'id' => $batch->id,
            'type' => $batch->type,
            'status' => $batch->status,
            'filename' => $batch->filename,
            'headers' => $batch->headers,
            'mapping' => $batch->mapping ?? [],
            'fields' => $fields,
            'preview' => $preview,
            'progress' => [
                'processed' => $batch->processed_rows,
                'total' => $batch->total_rows,
                'created' => $batch->created_count,
                'updated' => $batch->updated_count,
                'skipped' => $batch->skipped_count,
                'errors' => $batch->error_count,
            ],
            'samples' => $samples,
            'errors' => $errors,
        ];
    }

    private function classify(ImportBatch $batch): void
    {
        $workspace = $batch->workspace;

        foreach ($batch->rows as $row) {
            $decision = $this->decide($workspace, $row->raw ?? [], $batch->mapping ?? []);
            $row->forceFill([
                'preview_action' => $decision['action'],
                'error_message' => $decision['error'],
            ])->save();
        }
    }

    /**
     * @param  array<string, string>  $raw
     * @param  array<string, string>  $mapping
     * @return array{action: string, error: ?string, contact: ?Contact, values: array<string, mixed>}
     */
    private function decide(Workspace $workspace, array $raw, array $mapping): array
    {
        $values = $this->mappedValues($raw, $mapping);
        $normalized = $this->normalize($values);

        if ($normalized['error'] !== null) {
            return [
                'action' => ImportRow::ACTION_ERROR,
                'error' => $normalized['error'],
                'contact' => null,
                'values' => $normalized,
            ];
        }

        $contact = $this->findExisting($workspace, $normalized);

        if (! $contact) {
            return [
                'action' => ImportRow::ACTION_CREATE,
                'error' => null,
                'contact' => null,
                'values' => $normalized,
            ];
        }

        return [
            'action' => $this->hasChanges($contact, $normalized) ? ImportRow::ACTION_UPDATE : ImportRow::ACTION_SKIP,
            'error' => null,
            'contact' => $contact,
            'values' => $normalized,
        ];
    }

    private function processRow(ImportBatch $batch, ImportRow $row): void
    {
        $workspace = $batch->workspace;
        $decision = $this->decide($workspace, $row->raw ?? [], $batch->mapping ?? []);

        try {
            $contact = DB::transaction(function () use ($batch, $row, $decision, $workspace): ?Contact {
                $status = $decision['action'];
                $contact = $decision['contact'];

                if ($decision['action'] === ImportRow::ACTION_CREATE) {
                    $contact = $this->writeContact($workspace, null, $decision['values']);
                    $status = ImportRow::STATUS_CREATED;
                    $batch->increment('created_count');
                } elseif ($decision['action'] === ImportRow::ACTION_UPDATE && $contact) {
                    $contact = $this->writeContact($workspace, $contact, $decision['values']);
                    $status = ImportRow::STATUS_UPDATED;
                    $batch->increment('updated_count');
                } elseif ($decision['action'] === ImportRow::ACTION_SKIP) {
                    $status = ImportRow::STATUS_SKIPPED;
                    $batch->increment('skipped_count');
                } else {
                    $status = ImportRow::STATUS_ERROR;
                    $batch->increment('error_count');
                }

                $row->forceFill([
                    'status' => $status,
                    'preview_action' => $decision['action'],
                    'error_message' => $decision['error'],
                    'record_id' => $contact?->id,
                ])->save();

                $batch->increment('processed_rows');

                return $contact;
            });

            if ($contact instanceof Contact && $this->needsEnrichment($contact)) {
                EnrichRecordJob::dispatch(
                    $workspace->id,
                    EnrichmentRun::TARGET_CONTACT,
                    (int) $contact->id,
                );
            }
        } catch (Throwable $exception) {
            $row->forceFill([
                'status' => ImportRow::STATUS_ERROR,
                'preview_action' => ImportRow::ACTION_ERROR,
                'error_message' => mb_substr($exception->getMessage(), 0, 500),
            ])->save();
            $batch->increment('error_count');
            $batch->increment('processed_rows');
        }
    }

    /**
     * @param  array<string, string>  $raw
     * @param  array<string, string>  $mapping
     * @return array<string, mixed>
     */
    private function mappedValues(array $raw, array $mapping): array
    {
        $values = ['attributes' => []];

        foreach ($mapping as $header => $field) {
            if ($field === '' || $field === null) {
                continue;
            }

            $value = trim((string) ($raw[$header] ?? ''));

            if (str_starts_with($field, 'attr.')) {
                $values['attributes'][substr($field, 5)] = $value;

                continue;
            }

            $values[$field] = $value;
        }

        return $values;
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function normalize(array $values): array
    {
        $email = isset($values['email']) ? strtolower(trim((string) $values['email'])) : '';
        $email = $email !== '' ? $email : null;
        $phoneRaw = isset($values['phone']) ? trim((string) $values['phone']) : '';
        $phone = $phoneRaw !== '' ? AlgerianPhone::normalize($phoneRaw) : null;
        $externalId = isset($values['external_id']) ? trim((string) $values['external_id']) : '';
        $externalId = $externalId !== '' ? $externalId : null;

        if ($email !== null && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return ['error' => 'Email is not valid.'];
        }

        if ($phoneRaw !== '' && $phone === null) {
            return ['error' => 'Phone number could not be normalized.'];
        }

        $companyName = isset($values['company_name']) ? trim((string) $values['company_name']) : '';
        $ownerValue = isset($values['owner']) ? trim((string) $values['owner']) : '';
        $city = filled($values['city'] ?? null) ? trim((string) $values['city']) : null;
        $wilaya = filled($values['wilaya'] ?? null) ? trim((string) $values['wilaya']) : null;

        if ($email === null && $phone === null && $externalId === null && $companyName === '' && $city === null && $wilaya === null) {
            return ['error' => 'Row needs an email, phone, external ID, company name, city, or wilaya.'];
        }

        return [
            'error' => null,
            'external_id' => $externalId,
            'first_name' => $this->firstName($values),
            'last_name' => filled($values['last_name'] ?? null) ? trim((string) $values['last_name']) : null,
            'email' => $email,
            'phone' => $phoneRaw !== '' ? $phoneRaw : $phone,
            'phone_e164' => $phone,
            'city' => $city,
            'wilaya' => $wilaya,
            'source' => filled($values['source'] ?? null) ? trim((string) $values['source']) : 'import',
            'lead_status' => filled($values['lead_status'] ?? null) ? trim((string) $values['lead_status']) : null,
            'company_name' => $companyName !== '' ? $companyName : null,
            'owner_value' => $ownerValue !== '' ? $ownerValue : null,
            'attributes' => $values['attributes'] ?? [],
        ];
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function firstName(array $values): string
    {
        $first = trim((string) ($values['first_name'] ?? ''));
        if ($first !== '') {
            return $first;
        }

        $email = trim((string) ($values['email'] ?? ''));
        if ($email !== '' && str_contains($email, '@')) {
            return Str::before($email, '@');
        }

        return 'Contact';
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function findExisting(Workspace $workspace, array $values): ?Contact
    {
        if (filled($values['external_id'] ?? null)) {
            $match = Contact::query()
                ->forWorkspace($workspace)
                ->with('company')
                ->where('external_id', $values['external_id'])
                ->first();

            if ($match) {
                return $match;
            }
        }

        if (filled($values['email'] ?? null)) {
            $match = Contact::query()
                ->forWorkspace($workspace)
                ->with('company')
                ->where('email', $values['email'])
                ->first();

            if ($match) {
                return $match;
            }
        }

        if (filled($values['phone_e164'] ?? null)) {
            $match = Contact::query()
                ->forWorkspace($workspace)
                ->with('company')
                ->where('phone_e164', $values['phone_e164'])
                ->first();

            if ($match) {
                return $match;
            }
        }

        $identity = $this->importIdentity($values);
        if ($identity !== null) {
            return Contact::query()
                ->forWorkspace($workspace)
                ->with('company')
                ->where('meta->import_identity', $identity)
                ->first();
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function hasChanges(Contact $contact, array $values): bool
    {
        foreach (['first_name', 'last_name', 'email', 'phone_e164', 'city', 'wilaya', 'source', 'lead_status', 'external_id'] as $field) {
            $incoming = $values[$field] ?? null;
            if ($incoming === null || $incoming === '') {
                continue;
            }

            if ((string) $contact->{$field} !== (string) $incoming) {
                return true;
            }
        }

        if (filled($values['company_name'] ?? null)) {
            $current = $contact->company?->name;
            if ($current === null || mb_strtolower($current) !== mb_strtolower((string) $values['company_name'])) {
                return true;
            }
        }

        if (filled($values['owner_value'] ?? null)) {
            $owner = $this->resolveOwner($contact->workspace, (string) $values['owner_value']);
            if ($owner && (int) $contact->owner_id !== (int) $owner->id) {
                return true;
            }
        }

        foreach ($values['attributes'] ?? [] as $key => $value) {
            if ($value === '' || $value === null) {
                continue;
            }

            $current = $this->attributes->valuesFor($contact->workspace, 'contact', $contact->id)[$key] ?? null;
            if ((string) $current !== (string) $value) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function writeContact(Workspace $workspace, ?Contact $contact, array $values): Contact
    {
        $companyId = $contact?->company_id;
        if (filled($values['company_name'] ?? null)) {
            $companyId = $this->resolveCompany($workspace, (string) $values['company_name'])->id;
        }

        $ownerId = $contact?->owner_id;
        if (filled($values['owner_value'] ?? null)) {
            $ownerId = $this->resolveOwner($workspace, (string) $values['owner_value'])?->id ?? $ownerId;
        }

        $payload = array_filter([
            'workspace_id' => $workspace->id,
            'external_id' => $values['external_id'] ?? $contact?->external_id,
            'first_name' => $values['first_name'] ?? $contact?->first_name,
            'last_name' => $values['last_name'] ?? $contact?->last_name,
            'email' => $values['email'] ?? $contact?->email,
            'phone' => $values['phone'] ?? $contact?->phone,
            'city' => $values['city'] ?? $contact?->city,
            'wilaya' => $values['wilaya'] ?? $contact?->wilaya,
            'source' => $values['source'] ?? $contact?->source,
            'lead_status' => $values['lead_status'] ?? $contact?->lead_status,
            'company_id' => $companyId,
            'owner_id' => $ownerId,
        ], fn ($value) => $value !== null && $value !== '');

        if ($contact) {
            $contact->fill($payload);
            $meta = $contact->meta ?? [];
            $identity = $this->importIdentity($values);
            if ($identity !== null) {
                $meta['import_identity'] = $identity;
            }
            if (filled($values['external_id'] ?? null)) {
                $meta['external_id'] = $values['external_id'];
            }
            $contact->meta = $meta !== [] ? $meta : null;
            $contact->save();
        } else {
            $meta = [];
            $identity = $this->importIdentity($values);
            if ($identity !== null) {
                $meta['import_identity'] = $identity;
            }
            if (filled($values['external_id'] ?? null)) {
                $meta['external_id'] = $values['external_id'];
            }

            $contact = Contact::query()->create([
                ...$payload,
                'workspace_id' => $workspace->id,
                'meta' => $meta !== [] ? $meta : null,
            ]);
        }

        if (($values['attributes'] ?? []) !== []) {
            $this->attributes->saveValues($contact->workspace, 'contact', $contact->id, $values['attributes']);
        }

        return $contact->fresh(['company']) ?? $contact;
    }

    private function resolveCompany(Workspace $workspace, string $name): Company
    {
        $existing = Company::query()
            ->forWorkspace($workspace)
            ->whereRaw('lower(name) = ?', [mb_strtolower($name)])
            ->first();

        return $existing ?? Company::query()->create([
            'workspace_id' => $workspace->id,
            'name' => $name,
        ]);
    }

    private function resolveOwner(Workspace $workspace, string $value): ?User
    {
        $needle = mb_strtolower($value);

        return User::query()
            ->where('workspace_id', $workspace->id)
            ->where(function ($query) use ($needle): void {
                $query->whereRaw('lower(email) = ?', [$needle])
                    ->orWhereRaw('lower(name) = ?', [$needle]);
            })
            ->first();
    }

    private function needsEnrichment(Contact $contact): bool
    {
        return blank($contact->email) || blank($contact->phone_e164);
    }

    /**
     * Keep re-imports of incomplete rows idempotent without treating a name
     * alone as a globally unique contact identity.
     *
     * @param  array<string, mixed>  $values
     */
    private function importIdentity(array $values): ?string
    {
        $identity = array_filter([
            'external_id' => $values['external_id'] ?? null,
            'email' => $values['email'] ?? null,
            'phone' => $values['phone_e164'] ?? null,
            'first_name' => $values['first_name'] ?? null,
            'last_name' => $values['last_name'] ?? null,
            'company_name' => $values['company_name'] ?? null,
            'city' => $values['city'] ?? null,
            'wilaya' => $values['wilaya'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');

        if ($identity === []) {
            return null;
        }

        ksort($identity);

        return hash('sha256', json_encode($identity, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
}
