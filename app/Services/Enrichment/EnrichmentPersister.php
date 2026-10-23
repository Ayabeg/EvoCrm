<?php

namespace App\Services\Enrichment;

use App\Models\Company;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\Workspace;
use App\Support\AlgerianPhone;
use App\Support\AlgerianWilaya;
use Illuminate\Support\Carbon;

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
        string $verificationStatus = EnrichmentRun::VERIFICATION_EVIDENCE_SUPPORTED,
        ?string $evidenceUrl = null,
        ?Carbon $retrievedAt = null,
        ?string $error = null,
    ): EnrichmentRun {
        $value = $this->normalizeValue($field, $value);
        $verificationStatus = $this->normalizeVerificationStatus($verificationStatus);

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

        $safeToAutoApply = $field !== 'email' || in_array($verificationStatus, [
            EnrichmentRun::VERIFICATION_VERIFIED,
            EnrichmentRun::VERIFICATION_EVIDENCE_SUPPORTED,
        ], true);

        if (! $occupied && $safeToAutoApply && $confidence >= EnrichmentRun::HIGH_CONFIDENCE) {
            if ($this->writeField($target, $field, $value, force: false)) {
                $status = EnrichmentRun::STATUS_APPLIED;
            }
        }

        $run = EnrichmentRun::query()->create([
            'workspace_id' => $workspace->id,
            'target_type' => $targetType,
            'target_id' => $target->id,
            'source' => $source,
            'field' => $field,
            'value' => $value,
            'confidence' => $confidence,
            'raw' => $raw,
            'status' => $status,
            'verification_status' => $verificationStatus,
            'evidence_url' => $evidenceUrl ?: $this->evidenceUrl($raw),
            'retrieved_at' => $retrievedAt ?? now(),
            'verified_at' => $verificationStatus === EnrichmentRun::VERIFICATION_VERIFIED ? ($retrievedAt ?? now()) : null,
            'error' => $error,
        ]);

        if ($field === 'email') {
            $this->recordEmailVerification($target, $run);
        }

        return $run;
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
            'verification_status' => EnrichmentRun::VERIFICATION_UNKNOWN,
            'retrieved_at' => now(),
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
        ?string $value = null,
        string $verificationStatus = EnrichmentRun::VERIFICATION_UNKNOWN,
    ): EnrichmentRun {
        $run = EnrichmentRun::query()->create([
            'workspace_id' => $workspace->id,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'source' => $source,
            'field' => $field,
            'value' => $value !== null ? $this->normalizeValue($field, $value) : null,
            'confidence' => 0,
            'raw' => $raw,
            'status' => EnrichmentRun::STATUS_FAILED,
            'verification_status' => $this->normalizeVerificationStatus($verificationStatus),
            'retrieved_at' => now(),
            'error' => $error,
        ]);

        if ($field === 'email' && $value !== null) {
            $this->recordEmailVerification($this->resolveTarget($workspace, $targetType, $targetId), $run);
        }

        return $run;
    }

    private function resolveTarget(Workspace $workspace, string $targetType, int $targetId): Company|Contact|Lead
    {
        return match ($targetType) {
            EnrichmentRun::TARGET_COMPANY => Company::query()->forWorkspace($workspace)->findOrFail($targetId),
            EnrichmentRun::TARGET_CONTACT => Contact::query()->forWorkspace($workspace)->findOrFail($targetId),
            EnrichmentRun::TARGET_LEAD => Lead::query()->forWorkspace($workspace)->with('contact')->findOrFail($targetId),
            default => throw new \InvalidArgumentException('Unknown enrichment target type.'),
        };
    }

    /**
     * @param  array<string, mixed>  $raw
     */
    private function evidenceUrl(array $raw): ?string
    {
        foreach (['evidence_url', 'url'] as $key) {
            $value = $raw[$key] ?? null;

            if (is_string($value) && filter_var($value, FILTER_VALIDATE_URL)) {
                return mb_substr($value, 0, 2048);
            }
        }

        return null;
    }

    private function normalizeVerificationStatus(string $status): string
    {
        return in_array($status, [
            EnrichmentRun::VERIFICATION_VERIFIED,
            EnrichmentRun::VERIFICATION_EVIDENCE_SUPPORTED,
            EnrichmentRun::VERIFICATION_UNKNOWN,
            EnrichmentRun::VERIFICATION_NOT_FOUND,
            EnrichmentRun::VERIFICATION_NOT_DETECTED,
            EnrichmentRun::VERIFICATION_CONFLICTING,
            EnrichmentRun::VERIFICATION_INVALID,
            EnrichmentRun::VERIFICATION_CATCH_ALL,
            EnrichmentRun::VERIFICATION_TEMPORARY_FAILURE,
            EnrichmentRun::VERIFICATION_UNSUPPORTED,
        ], true) ? $status : EnrichmentRun::VERIFICATION_UNKNOWN;
    }

    private function recordEmailVerification(Company|Contact|Lead $target, EnrichmentRun $run): void
    {
        $contact = $this->relatedContact($target);

        if (! $contact instanceof Contact) {
            return;
        }

        $candidateEmail = strtolower(trim((string) $run->value));
        $currentEmail = strtolower(trim((string) $contact->email));

        if ($candidateEmail === '') {
            return;
        }

        // Keep proposals for other addresses in the run history, but do not
        // let them change the verification state for the current address.
        if ($currentEmail !== '' && $candidateEmail !== $currentEmail) {
            return;
        }

        $meta = $this->bag($contact->getAttribute('meta'));
        $existing = $meta['email_verification'] ?? null;

        if (is_array($existing)
            && ($existing['email'] ?? null) === $candidateEmail
            && $this->shouldPreserveEmailVerification($existing, $run->verification_status)) {
            return;
        }

        $meta['email_verification'] = [
            'status' => $run->verification_status,
            'source' => $run->source,
            'evidence_url' => $run->evidence_url,
            'email' => $candidateEmail,
            'retrieved_at' => $run->retrieved_at?->toIso8601String(),
            'confidence' => (float) $run->confidence,
            'run_id' => $run->id,
        ];
        $contact->forceFill(['meta' => $meta])->save();
    }

    /**
     * Keep stronger existing evidence when a later proposal is weaker or
     * inconclusive. The EnrichmentRun history still records the later result.
     *
     * @param  array<string, mixed>  $existing
     */
    private function shouldPreserveEmailVerification(array $existing, string $incomingStatus): bool
    {
        $existingStatus = is_string($existing['status'] ?? null) ? $existing['status'] : null;

        if ($existingStatus === EnrichmentRun::VERIFICATION_VERIFIED
            && in_array($incomingStatus, $this->inconclusiveVerificationStatuses(), true)) {
            return true;
        }

        return $existingStatus === EnrichmentRun::VERIFICATION_EVIDENCE_SUPPORTED
            && in_array($incomingStatus, $this->inconclusiveVerificationStatuses(), true);
    }

    /**
     * @return list<string>
     */
    private function inconclusiveVerificationStatuses(): array
    {
        return [
            EnrichmentRun::VERIFICATION_UNKNOWN,
            EnrichmentRun::VERIFICATION_NOT_FOUND,
            EnrichmentRun::VERIFICATION_NOT_DETECTED,
            EnrichmentRun::VERIFICATION_TEMPORARY_FAILURE,
            EnrichmentRun::VERIFICATION_UNSUPPORTED,
        ];
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
