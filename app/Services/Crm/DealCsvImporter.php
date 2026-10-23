<?php

namespace App\Services\Crm;

use App\Jobs\ProcessImportBatch;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\ImportBatch;
use App\Models\ImportRow;
use App\Models\Pipeline;
use App\Models\Stage;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Operations\AuditLogger;
use App\Support\AlgerianPhone;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class DealCsvImporter
{
    private const PROCESS_CHUNK_SIZE = 100;

    public const FIELDS = [
        'external_id' => 'External ID',
        'title' => 'Deal name',
        'amount' => 'Amount',
        'currency' => 'Currency',
        'close_date' => 'Close date',
        'pipeline' => 'Pipeline',
        'stage' => 'Stage',
        'contact_email' => 'Contact email',
        'contact_phone' => 'Contact phone',
        'contact_external_id' => 'Contact external ID',
        'company_name' => 'Company name',
        'owner' => 'Owner',
        'source' => 'Source',
    ];

    public const ALIASES = [
        'record id' => 'external_id',
        'deal id' => 'external_id',
        'hs_object_id' => 'external_id',
        'external id' => 'external_id',
        'deal name' => 'title',
        'title' => 'title',
        'amount' => 'amount',
        'deal amount' => 'amount',
        'currency' => 'currency',
        'deal currency' => 'currency',
        'close date' => 'close_date',
        'closedate' => 'close_date',
        'pipeline' => 'pipeline',
        'deal stage' => 'stage',
        'stage' => 'stage',
        'associated contact email' => 'contact_email',
        'contact email' => 'contact_email',
        'associated contact ids' => 'contact_external_id',
        'contact record id' => 'contact_external_id',
        'contact phone' => 'contact_phone',
        'company name' => 'company_name',
        'associated company' => 'company_name',
        'hubspot owner' => 'owner',
        'owner' => 'owner',
        'deal owner' => 'owner',
        'source' => 'source',
    ];

    public function __construct(
        private CsvUpload $csv,
        private CustomAttributes $attributes,
    ) {}

    public function createBatch(Workspace $workspace, User $actor, UploadedFile $file): ImportBatch
    {
        $parsed = $this->csv->read($file);
        $definitions = $this->attributes->definitions($workspace, 'deal');
        $mapping = $this->suggestMapping($parsed['headers'], $definitions->pluck('key')->all());

        $batch = ImportBatch::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $actor->id,
            'type' => ImportBatch::TYPE_DEALS,
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
            $this->attributes->definitions($batch->workspace, 'deal')
                ->map(fn ($definition) => 'attr.'.$definition->key)
                ->all(),
            [''],
        );

        $clean = [];
        foreach ($batch->headers ?? [] as $header) {
            $value = $mapping[$header] ?? '';
            if (! in_array($value, $allowed, true)) {
                throw ValidationException::withMessages([
                    "mapping.{$header}" => 'That field is not available for deal import.',
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
        do {
            $hasMore = $this->processChunk($batch);
        } while ($hasMore);
    }

    /**
     * Process one bounded page for the durable queue worker.
     *
     * @return bool Whether another page of pending rows remains.
     */
    public function processChunk(ImportBatch $batch): bool
    {
        if ($batch->status === ImportBatch::STATUS_COMPLETED) {
            return false;
        }

        $batch->forceFill([
            'status' => ImportBatch::STATUS_PROCESSING,
            'started_at' => $batch->started_at ?? now(),
        ])->save();

        try {
            $rows = $batch->rows()
                ->where('status', ImportRow::STATUS_PENDING)
                ->orderBy('id')
                ->limit(self::PROCESS_CHUNK_SIZE)
                ->get();

            foreach ($rows as $row) {
                $this->processRow($batch->fresh() ?? $batch, $row);
            }

            $batch->refresh();
            $hasMore = $batch->rows()
                ->where('status', ImportRow::STATUS_PENDING)
                ->exists();

            if (! $hasMore) {
                $this->complete($batch);
            }

            return $hasMore;
        } catch (Throwable $exception) {
            $batch->forceFill([
                'status' => ImportBatch::STATUS_FAILED,
                'finished_at' => now(),
                'error_summary' => app(WorkflowExecutionRedactor::class)->redactError($exception->getMessage()),
            ])->save();

            throw $exception;
        }
    }

    private function complete(ImportBatch $batch): void
    {
        $batch->forceFill([
            'status' => ImportBatch::STATUS_COMPLETED,
            'finished_at' => now(),
            'processed_rows' => $batch->total_rows,
        ])->save();

        if ($batch->workspace) {
            app(AuditLogger::class)->record(
                $batch->workspace,
                'import.completed',
                'Deal import '.$batch->filename.' finished',
                $batch->user,
                $batch,
                [
                    'created' => $batch->created_count,
                    'updated' => $batch->updated_count,
                    'filename' => $batch->filename,
                ],
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function present(ImportBatch $batch): array
    {
        $fields = self::FIELDS;
        foreach ($this->attributes->definitions($batch->workspace, 'deal') as $definition) {
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
                        'title' => $mapped['title'] ?? '',
                        'amount' => $mapped['amount'] ?? '',
                        'stage' => $mapped['stage'] ?? '',
                        'contact' => $mapped['contact_email'] ?? $mapped['contact_phone'] ?? '',
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
     * @return array{action: string, error: ?string, deal: ?Deal, values: array<string, mixed>}
     */
    private function decide(Workspace $workspace, array $raw, array $mapping): array
    {
        $values = $this->mappedValues($raw, $mapping);
        $normalized = $this->normalize($workspace, $values);

        if ($normalized['error'] !== null) {
            return [
                'action' => ImportRow::ACTION_ERROR,
                'error' => $normalized['error'],
                'deal' => null,
                'values' => $normalized,
            ];
        }

        $deal = $this->findExisting($workspace, $normalized);

        if (! $deal) {
            return [
                'action' => ImportRow::ACTION_CREATE,
                'error' => null,
                'deal' => null,
                'values' => $normalized,
            ];
        }

        return [
            'action' => $this->hasChanges($deal, $normalized) ? ImportRow::ACTION_UPDATE : ImportRow::ACTION_SKIP,
            'error' => null,
            'deal' => $deal,
            'values' => $normalized,
        ];
    }

    private function processRow(ImportBatch $batch, ImportRow $row): void
    {
        $workspace = $batch->workspace;

        try {
            DB::transaction(function () use ($batch, $row, $workspace): void {
                $lockedRow = ImportRow::query()
                    ->whereKey($row->id)
                    ->lockForUpdate()
                    ->first();

                if (! $lockedRow || $lockedRow->status !== ImportRow::STATUS_PENDING) {
                    return;
                }

                $decision = $this->decide($workspace, $lockedRow->raw ?? [], $batch->mapping ?? []);
                $status = $decision['action'];
                $deal = $decision['deal'];

                if ($decision['action'] === ImportRow::ACTION_CREATE) {
                    $deal = $this->writeDeal($workspace, null, $decision['values']);
                    $status = ImportRow::STATUS_CREATED;
                    $batch->increment('created_count');
                } elseif ($decision['action'] === ImportRow::ACTION_UPDATE && $deal) {
                    $deal = $this->writeDeal($workspace, $deal, $decision['values']);
                    $status = ImportRow::STATUS_UPDATED;
                    $batch->increment('updated_count');
                } elseif ($decision['action'] === ImportRow::ACTION_SKIP) {
                    $status = ImportRow::STATUS_SKIPPED;
                    $batch->increment('skipped_count');
                } else {
                    $status = ImportRow::STATUS_ERROR;
                    $batch->increment('error_count');
                }

                $lockedRow->forceFill([
                    'status' => $status,
                    'preview_action' => $decision['action'],
                    'error_message' => $decision['error'],
                    'record_id' => $deal?->id,
                ])->save();

                $batch->increment('processed_rows');
            });
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
    private function normalize(Workspace $workspace, array $values): array
    {
        $title = trim((string) ($values['title'] ?? ''));
        if ($title === '') {
            return ['error' => 'Deal name is required.'];
        }

        $amount = $this->parseAmount($values['amount'] ?? null);
        if ($amount === null) {
            return ['error' => 'Amount could not be parsed.'];
        }

        $closeDate = $this->parseDate($values['close_date'] ?? null);
        if (filled($values['close_date'] ?? null) && $closeDate === null) {
            return ['error' => 'Close date could not be parsed.'];
        }

        $pipeline = $this->resolvePipeline($workspace, $values['pipeline'] ?? null);
        if (! $pipeline) {
            return ['error' => 'Pipeline could not be resolved.'];
        }

        $stage = $this->resolveStage($pipeline, $values['stage'] ?? null);
        if (! $stage) {
            return ['error' => 'Stage could not be resolved.'];
        }

        $contact = $this->resolveContact($workspace, $values);
        if (! $contact) {
            return ['error' => 'Contact could not be resolved.'];
        }

        $currency = strtoupper(trim((string) ($values['currency'] ?? 'DZD')));
        if ($currency === '') {
            $currency = 'DZD';
        }

        return [
            'error' => null,
            'external_id' => filled($values['external_id'] ?? null) ? trim((string) $values['external_id']) : null,
            'title' => $title,
            'amount_cents' => $amount,
            'currency' => $currency,
            'close_date' => $closeDate,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stage->id,
            'contact_id' => $contact->id,
            'company_name' => filled($values['company_name'] ?? null) ? trim((string) $values['company_name']) : null,
            'owner_value' => filled($values['owner'] ?? null) ? trim((string) $values['owner']) : null,
            'source' => filled($values['source'] ?? null) ? trim((string) $values['source']) : 'import',
            'attributes' => $values['attributes'] ?? [],
        ];
    }

    private function parseAmount(mixed $raw): ?int
    {
        if ($raw === null || trim((string) $raw) === '') {
            return 0;
        }

        $clean = preg_replace('/[^\d.,\-]/', '', (string) $raw) ?? '';
        if ($clean === '' || $clean === '-' || $clean === '.' || $clean === ',') {
            return null;
        }

        if (str_contains($clean, ',') && str_contains($clean, '.')) {
            $clean = str_replace(',', '', $clean);
        } elseif (str_contains($clean, ',') && ! str_contains($clean, '.')) {
            $clean = preg_match('/,\d{1,2}$/', $clean) === 1
                ? str_replace(',', '.', $clean)
                : str_replace(',', '', $clean);
        }

        if (! is_numeric($clean)) {
            return null;
        }

        return (int) round(((float) $clean) * 100);
    }

    private function parseDate(mixed $raw): ?string
    {
        if ($raw === null || trim((string) $raw) === '') {
            return null;
        }

        try {
            return Carbon::parse((string) $raw)->toDateString();
        } catch (Throwable) {
            return null;
        }
    }

    private function resolvePipeline(Workspace $workspace, mixed $raw): ?Pipeline
    {
        $name = trim((string) ($raw ?? ''));
        if ($name === '') {
            return $workspace->pipelines()->where('is_default', true)->first()
                ?? $workspace->pipelines()->first();
        }

        return $workspace->pipelines()
            ->whereRaw('lower(name) = ?', [mb_strtolower($name)])
            ->first();
    }

    private function resolveStage(Pipeline $pipeline, mixed $raw): ?Stage
    {
        $name = trim((string) ($raw ?? ''));
        if ($name === '') {
            return $pipeline->stageBySlug('new') ?? $pipeline->stages()->first();
        }

        $needle = mb_strtolower($name);

        return $pipeline->stages()
            ->where(function ($query) use ($needle): void {
                $query->whereRaw('lower(name) = ?', [$needle])
                    ->orWhereRaw('lower(slug) = ?', [$needle]);
            })
            ->first();
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function resolveContact(Workspace $workspace, array $values): ?Contact
    {
        $externalId = trim((string) ($values['contact_external_id'] ?? ''));
        if ($externalId !== '') {
            $match = Contact::query()->forWorkspace($workspace)->where('external_id', $externalId)->first();
            if ($match) {
                return $match;
            }
        }

        $email = strtolower(trim((string) ($values['contact_email'] ?? '')));
        if ($email !== '') {
            $match = Contact::query()->forWorkspace($workspace)->where('email', $email)->first();
            if ($match) {
                return $match;
            }
        }

        $phone = AlgerianPhone::normalize($values['contact_phone'] ?? null);
        if ($phone) {
            return Contact::query()->forWorkspace($workspace)->where('phone_e164', $phone)->first();
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function findExisting(Workspace $workspace, array $values): ?Deal
    {
        if (filled($values['external_id'] ?? null)) {
            $match = Deal::query()
                ->forWorkspace($workspace)
                ->with('company')
                ->where('external_id', $values['external_id'])
                ->first();

            if ($match) {
                return $match;
            }
        }

        return Deal::query()
            ->forWorkspace($workspace)
            ->with('company')
            ->where('title', $values['title'])
            ->where('contact_id', $values['contact_id'])
            ->first();
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function hasChanges(Deal $deal, array $values): bool
    {
        foreach (['title', 'amount_cents', 'currency', 'pipeline_id', 'stage_id', 'contact_id', 'external_id', 'source'] as $field) {
            $incoming = $values[$field] ?? null;
            if ($incoming === null || $incoming === '') {
                continue;
            }

            if ((string) $deal->{$field} !== (string) $incoming) {
                return true;
            }
        }

        if (filled($values['close_date'] ?? null) && $deal->close_date?->toDateString() !== $values['close_date']) {
            return true;
        }

        if (filled($values['company_name'] ?? null)) {
            $current = $deal->company?->name;
            if ($current === null || mb_strtolower($current) !== mb_strtolower((string) $values['company_name'])) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function writeDeal(Workspace $workspace, ?Deal $deal, array $values): Deal
    {
        $companyId = $deal?->company_id;
        if (filled($values['company_name'] ?? null)) {
            $companyId = $this->resolveCompany($workspace, (string) $values['company_name'])->id;
        } elseif (! $companyId) {
            $companyId = Contact::query()->forWorkspace($workspace)->find($values['contact_id'])?->company_id;
        }

        $ownerId = $deal?->owner_id;
        if (filled($values['owner_value'] ?? null)) {
            $ownerId = $this->resolveOwner($workspace, (string) $values['owner_value'])?->id ?? $ownerId;
        }

        $payload = [
            'workspace_id' => $workspace->id,
            'external_id' => $values['external_id'] ?? $deal?->external_id,
            'title' => $values['title'],
            'amount_cents' => $values['amount_cents'],
            'currency' => $values['currency'] ?? 'DZD',
            'close_date' => $values['close_date'] ?? $deal?->close_date,
            'pipeline_id' => $values['pipeline_id'],
            'stage_id' => $values['stage_id'],
            'contact_id' => $values['contact_id'],
            'company_id' => $companyId,
            'owner_id' => $ownerId,
            'source' => $values['source'] ?? $deal?->source ?? 'import',
        ];

        if ($deal) {
            $deal->fill($payload)->save();
        } else {
            $deal = Deal::query()->create($payload);
        }

        if (($values['attributes'] ?? []) !== []) {
            $this->attributes->saveValues($deal->workspace, 'deal', $deal->id, $values['attributes']);
        }

        return $deal->fresh(['contact', 'company', 'stage']) ?? $deal;
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
}
