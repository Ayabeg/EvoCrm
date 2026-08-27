<?php

namespace App\Services\Enrichment;

use App\Models\Company;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\Workspace;
use App\Support\AlgerianPhone;
use App\Support\AlgerianWilaya;

class EnrichmentPersister
{
    /**
     * Store a proposed value. Auto-apply only when the field is empty and confidence is high.
     * Never overwrite a human-set (already populated) field silently.
     *
     * @param  array<string, mixed>  $raw
     */
    public function persistProposal(
        Workspace $workspace,
        string $targetType,
        Company|Contact|Lead $target,
        string $source,
        string $field,
        string $value,
        float $confidence,
        array $raw = [],
    ): EnrichmentRun {
        $value = $this->normalizeValue($field, $value);

        $duplicate = EnrichmentRun::query()
            ->forWorkspace($workspace)
            ->where('target_type', $targetType)
            ->where('target_id', $target->id)
            ->where('source', $source)
            ->where('field', $field)
            ->where('value', $value)
            ->whereIn('status', [
                EnrichmentRun::STATUS_PROPOSED,
                EnrichmentRun::STATUS_APPLIED,
                EnrichmentRun::STATUS_DISMISSED,
            ])
            ->latest('id')
            ->first();

        if ($duplicate) {
            return $duplicate;
        }

        $occupied = $this->currentValue($target, $field) !== null;
        $status = EnrichmentRun::STATUS_PROPOSED;

        if (! $occupied && $confidence >= EnrichmentRun::HIGH_CONFIDENCE) {
            if ($this->writeField($target, $field, $value, force: false)) {
                $status = EnrichmentRun::STATUS_APPLIED;
            }
        }

        return EnrichmentRun::query()->create([
            'workspace_id' => $workspace->id,
            'target_type' => $targetType,
            'target_id' => $target->id,
            'source' => $source,
            'field' => $field,
            'value' => $value,
            'confidence' => $confidence,
            'raw' => $raw,
            'status' => $status,
        ]);
    }

    /**
     * @param  array<string, mixed>  $raw
     */
    public function persistSkip(
        Workspace $workspace,
        string $targetType,
        int $targetId,
        string $source,
        string $field,
        string $error,
        array $raw = [],
    ): EnrichmentRun {
        return EnrichmentRun::query()->create([
            'workspace_id' => $workspace->id,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'source' => $source,
            'field' => $field,
            'value' => null,
            'confidence' => 0,
            'raw' => $raw,
            'status' => EnrichmentRun::STATUS_SKIPPED,
            'error' => $error,
        ]);
    }

    /**
     * @param  array<string, mixed>  $raw
     */
    public function persistFailure(
        Workspace $workspace,
        string $targetType,
        int $targetId,
        string $source,
        string $field,
        string $error,
        array $raw = [],
    ): EnrichmentRun {
        return EnrichmentRun::query()->create([
            'workspace_id' => $workspace->id,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'source' => $source,
            'field' => $field,
            'value' => null,
            'confidence' => 0,
            'raw' => $raw,
            'status' => EnrichmentRun::STATUS_FAILED,
            'error' => $error,
        ]);
    }

    public function currentValue(Company|Contact|Lead $target, string $field): ?string
    {
        $contact = $this->relatedContact($target);
        $company = $this->relatedCompany($target);

        $value = match ($field) {
            'email' => $contact?->email,
            'phone' => $target instanceof Company
                ? $company?->phone
                : ($contact?->phone_e164 ?: $contact?->phone),
            'city' => $contact?->city ?: $company?->city,
            'wilaya' => $contact?->wilaya ?: $company?->wilaya,
            'domain' => $company?->domain,
            default => null,
        };

        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value !== '' ? $value : null;
    }

    public function writeField(Company|Contact|Lead $target, string $field, string $value, bool $force): bool
    {
        $value = $this->normalizeValue($field, $value);

        return match ($field) {
            'email' => $this->writeEmail($target, $value, $force),
            'phone' => $this->writeScalar($target, 'phone', $value, $force),
            'city', 'wilaya', 'domain' => $this->writeScalar($target, $field, $value, $force),
            default => $this->writeExtra($target, $field, $value),
        };
    }

    private function writeEmail(Company|Contact|Lead $target, string $value, bool $force): bool
    {
        $contact = $this->relatedContact($target);

        if (! $contact instanceof Contact) {
            return $this->writeExtra($target, 'email', $value);
        }

        $exists = Contact::query()
            ->forWorkspace($contact->workspace_id)
            ->where('email', strtolower($value))
            ->where('id', '!=', $contact->id)
            ->exists();

        if ($exists) {
            return false;
        }

        if (! $force && filled($contact->email)) {
            return false;
        }

        $contact->forceFill(['email' => $value])->save();

        if ($target instanceof Lead) {
            $this->writeExtra($target, 'email', $value);
        }

        return true;
    }

    private function writeScalar(Company|Contact|Lead $target, string $column, string $value, bool $force): bool
    {
        if ($target instanceof Lead) {
            $contact = $this->relatedContact($target);
            $company = $this->relatedCompany($target);

            if ($contact instanceof Contact && ($force || blank($contact->getAttribute($column)))) {
                $contact->forceFill([$column => $value])->save();
            }

            if ($company instanceof Company && in_array($column, ['phone', 'city', 'wilaya', 'domain'], true)
                && ($force || blank($company->getAttribute($column)))) {
                $company->forceFill([$column => $value])->save();
            }

            $this->writeExtra($target, $column, $value);

            return true;
        }

        if (! $force && filled($target->getAttribute($column))) {
            return false;
        }

        $target->forceFill([$column => $value])->save();

        return true;
    }

    private function writeExtra(Company|Contact|Lead $target, string $field, string $value): bool
    {
        if ($target instanceof Contact) {
            $meta = $this->bag($target->getAttribute('meta'));
            $meta['enrichment'][$field] = $value;
            $target->forceFill(['meta' => $meta])->save();

            return true;
        }

        if ($target instanceof Lead) {
            $payload = $this->bag($target->getAttribute('payload'));
            $payload['enrichment'][$field] = $value;
            $target->forceFill(['payload' => $payload])->save();

            return true;
        }

        return true;
    }

    public function normalizeValue(string $field, string $value): string
    {
        $value = trim($value);

        if ($field === 'phone') {
            return AlgerianPhone::normalize($value) ?? $value;
        }

        if ($field === 'wilaya') {
            return AlgerianWilaya::normalize($value) ?? $value;
        }

        if ($field === 'email') {
            return strtolower($value);
        }

        if ($field === 'currency_hint') {
            return 'DZD';
        }

        return $value;
    }

    private function relatedContact(Company|Contact|Lead $target): ?Contact
    {
        if ($target instanceof Contact) {
            return $target;
        }

        if ($target instanceof Lead) {
            $related = $target->contact;

            return $related instanceof Contact ? $related : null;
        }

        return null;
    }

    private function relatedCompany(Company|Contact|Lead $target): ?Company
    {
        if ($target instanceof Company) {
            return $target;
        }

        $related = $target->company;

        return $related instanceof Company ? $related : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function bag(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }
}
