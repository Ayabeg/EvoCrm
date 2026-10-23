<?php

namespace App\Services\Enrichment;

use App\Models\Company;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\Workspace;

final class EmailVerificationEnricher
{
    public function __construct(private EmailVerificationProvider $provider, private EnrichmentPersister $runs) {}

    public function enrich(Workspace $workspace, string $targetType, Company|Contact|Lead $target): void
    {
        $contact = $target instanceof Contact
            ? $target
            : ($target instanceof Lead && $target->contact instanceof Contact ? $target->contact : null);

        if (! $contact instanceof Contact) {
            return;
        }

        $email = strtolower(trim((string) $contact->email));

        if ($email === '') {
            return;
        }

        $cacheHours = max(0, (int) config('evosales.enrichment.email_verification_cache_hours', 168));
        $cachedRun = EnrichmentRun::query()
            ->forWorkspace($workspace)
            ->where('target_type', $targetType)
            ->where('target_id', $target->id)
            ->where('source', EnrichmentRun::SOURCE_EMAIL_VERIFICATION)
            ->where('field', 'email')
            ->where('value', $email)
            ->latest('id')
            ->first();

        if ($cachedRun instanceof EnrichmentRun
            && $cachedRun->retrieved_at?->gte(now()->subHours($cacheHours))
            && $cachedRun->verification_status !== EnrichmentRun::VERIFICATION_TEMPORARY_FAILURE
            && data_get($cachedRun->raw, 'provider') === $this->provider->name()) {
            return;
        }

        try {
            $result = $this->provider->verify($email);
        } catch (TransientEnrichmentException $exception) {
            $this->runs->persistFailure(
                $workspace,
                $targetType,
                (int) $target->id,
                EnrichmentRun::SOURCE_EMAIL_VERIFICATION,
                'email',
                $exception->getMessage(),
                ['provider' => $this->provider->name(), 'email' => $email],
                $email,
                EnrichmentRun::VERIFICATION_TEMPORARY_FAILURE,
            );

            throw $exception;
        }

        $status = (string) ($result['status'] ?? EnrichmentRun::VERIFICATION_UNKNOWN);
        $raw = [
            'provider' => $this->provider->name(),
            'email' => $email,
            ...((array) ($result['raw'] ?? [])),
        ];

        if ($status === EnrichmentRun::VERIFICATION_TEMPORARY_FAILURE) {
            $this->runs->persistFailure(
                $workspace,
                $targetType,
                (int) $target->id,
                EnrichmentRun::SOURCE_EMAIL_VERIFICATION,
                'email',
                (string) ($result['error'] ?? 'Email verification temporarily failed.'),
                $raw,
                $email,
                $status,
            );

            return;
        }

        $this->runs->persistProposal(
            $workspace,
            $targetType,
            $target,
            EnrichmentRun::SOURCE_EMAIL_VERIFICATION,
            'email',
            $email,
            (float) ($result['confidence'] ?? 0.0),
            $raw,
            $status,
            is_string($result['evidence_url'] ?? null) ? $result['evidence_url'] : null,
            null,
            is_string($result['error'] ?? null) ? $result['error'] : null,
        );
    }
}
