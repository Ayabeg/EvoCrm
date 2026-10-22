<?php

namespace App\Services\Outbound;

use App\Enums\EmailVerificationPolicy;
use App\Models\Contact;
use App\Models\ContactConsent;
use App\Models\Enrollment;
use App\Models\Sequence;
use App\Models\Workspace;
use App\Support\AlgerianPhone;

/**
 * Last-mile checks shared by enrollment and dispatch. Consent policy remains
 * explicit in SequenceEnrollment; this service covers addressability,
 * suppression, and conflicting active sequences.
 */
final class OutboundEligibility
{
    public function __construct(private SuppressionService $suppressions) {}

    public function reason(
        Workspace $workspace,
        Contact $contact,
        string $channel,
        ?Sequence $sequence = null,
        ?string $emailVerificationPolicy = null,
    ): ?string {
        if ((int) $contact->workspace_id !== (int) $workspace->id) {
            return 'Contact does not belong to this workspace.';
        }

        if ($this->suppressions->isSuppressed($workspace, $contact->email, $contact->phone_e164)) {
            return 'Contact is on the suppression list.';
        }

        if ($channel === 'email') {
            $email = trim((string) $contact->email);
            $policy = EmailVerificationPolicy::tryFrom($emailVerificationPolicy ?? EmailVerificationPolicy::Strict->value)
                ?? EmailVerificationPolicy::Strict;

            if ($email === '') {
                return 'Contact has no usable business email address.';
            }

            if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return 'Contact has an invalid business email address.';
            }

            $verificationStatus = data_get($contact->meta, 'email_verification.status');
            if (in_array($verificationStatus, ['invalid', 'temporary_failure', 'unsupported'], true)) {
                return match ($verificationStatus) {
                    'temporary_failure' => 'Contact email verification is temporarily unavailable.',
                    'unsupported' => 'Contact email verification is unsupported for this address.',
                    default => 'Contact email verification marked this address invalid.',
                };
            }

            if ($verificationStatus === 'catch_all'
                && (config('evosales.outbound.block_catch_all', true) || ! $policy->allowsCatchAll())) {
                return 'Contact email verification marked this address catch-all.';
            }

            if ($verificationStatus === 'unknown'
                && (config('evosales.outbound.block_unknown_verification', true) || ! $policy->allowsUnknown())) {
                return 'Contact email verification is unknown.';
            }
        }

        if ($channel === 'sms' && ! AlgerianPhone::isMobile($contact->phone_e164 ?? $contact->phone)) {
            return 'SMS sequences only enroll Algerian mobiles (+213 05 / 06 / 07).';
        }

        $consentReason = $this->marketingConsentReason($contact, $channel);

        if ($consentReason !== null) {
            return $consentReason;
        }

        if ($sequence && Enrollment::query()
            ->where('workspace_id', $workspace->id)
            ->where('contact_id', $contact->id)
            ->where('status', 'active')
            ->where('sequence_id', '!=', $sequence->id)
            ->whereHas('sequence', fn ($query) => $query->where('channel', $channel))
            ->exists()) {
            return 'Contact is already active in another sequence on this channel.';
        }

        return null;
    }

    private function marketingConsentReason(Contact $contact, string $channel): ?string
    {
        $consentChannels = match ($channel) {
            'whatsapp_cloud' => ['whatsapp', 'whatsapp_cloud'],
            'sms' => ['sms'],
            default => ['email'],
        };
        $consent = $contact->consents()
            ->where('purpose', 'marketing')
            ->whereIn('channel', $consentChannels)
            ->latest('id')
            ->first();

        if ($consent instanceof ContactConsent && ! $consent->isGranted()) {
            return 'Contact has not granted marketing consent for this channel.';
        }

        if (config('evosales.outbound.require_marketing_consent', true) && ! $consent instanceof ContactConsent) {
            return 'Contact has no recorded marketing consent for this channel.';
        }

        return null;
    }
}
