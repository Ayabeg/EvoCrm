<?php

namespace App\Services\Outbound;

use App\Models\Enrollment;
use App\Models\OutboundMessage;
use App\Models\OutboundProviderEvent;
use App\Models\Workspace;
use App\Services\Analytics\ProductAnalytics;

class BounceProcessor
{
    public function __construct(
        private SuppressionService $suppressions,
        private ProductAnalytics $analytics,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function process(Workspace $workspace, array $payload, string $provider = 'outbound'): OutboundMessage
    {
        $eventId = (string) ($payload['event_id'] ?? $payload['id'] ?? '');
        abort_unless($eventId !== '', 422);

        $provider = strtolower(trim($provider));
        $provider = $provider !== '' ? $provider : 'outbound';

        $existing = OutboundProviderEvent::query()
            ->forWorkspace($workspace)
            ->where('provider', $provider)
            ->where('provider_event_id', $eventId)
            ->with('message')
            ->first();

        if ($existing instanceof OutboundProviderEvent && $existing->message instanceof OutboundMessage) {
            return $existing->message;
        }

        // Keep the legacy lookup for events received before the event ledger
        // existed, and retain provider_event_id on the message for existing
        // integrations and reports.
        $legacy = OutboundMessage::query()
            ->forWorkspace($workspace)
            ->where('provider_event_id', $eventId)
            ->first();

        if ($legacy instanceof OutboundMessage) {
            return $legacy;
        }

        $message = $this->resolveMessage($workspace, $payload);
        $eventType = $this->eventType($payload);
        $receivedAt = now();

        OutboundProviderEvent::query()->create([
            'workspace_id' => $workspace->id,
            'outbound_message_id' => $message->id,
            'provider' => $provider,
            'provider_event_id' => $eventId,
            'event_type' => $eventType,
            'payload' => $payload,
            'received_at' => $receivedAt,
        ]);

        $message->forceFill(['provider_event_id' => $eventId]);

        if ($eventType === 'delivered') {
            $message->forceFill([
                'delivered_at' => $payload['delivered_at'] ?? $receivedAt,
            ])->save();

            $this->analytics->capture(ProductAnalytics::EMAIL_DELIVERED, [
                'message_id' => $message->id,
                'contact_id' => $message->contact_id,
            ], null, $workspace);

            return $message->fresh() ?? $message;
        }

        if ($eventType === 'complaint') {
            $message->forceFill([
                'status' => 'failed',
                'failure_reason' => 'provider complaint',
                'complained_at' => $payload['complained_at'] ?? $receivedAt,
            ])->save();

            $this->suppressAndPause($workspace, $message, 'complaint');
            $this->analytics->capture(ProductAnalytics::EMAIL_COMPLAINED, [
                'message_id' => $message->id,
                'contact_id' => $message->contact_id,
            ], null, $workspace);

            return $message->fresh() ?? $message;
        }

        $bounceType = $this->bounceType($payload);
        $message->forceFill([
            'status' => 'bounced',
            'failure_reason' => $bounceType === 'hard' ? 'hard bounce' : 'soft bounce',
            'bounce_type' => $bounceType,
            'bounced_at' => $payload['bounced_at'] ?? $receivedAt,
        ])->save();

        if ($bounceType === 'hard') {
            $this->suppressAndPause($workspace, $message, 'hard_bounce');
        }

        $this->analytics->capture(ProductAnalytics::EMAIL_BOUNCED, [
            'message_id' => $message->id,
            'bounce_type' => $bounceType,
            'contact_id' => $message->contact_id,
        ], null, $workspace);

        return $message->fresh() ?? $message;
    }

    /** @param array<string, mixed> $payload */
    private function eventType(array $payload): string
    {
        $raw = strtolower(trim((string) ($payload['type'] ?? $payload['event_type'] ?? $payload['event'] ?? $payload['status'] ?? 'bounce')));
        $normalized = str_replace(['-', ' '], '_', $raw);

        if (str_contains($normalized, 'complaint')) {
            return 'complaint';
        }

        if (in_array($normalized, ['delivery', 'delivered', 'delivery_success'], true)) {
            return 'delivered';
        }

        return 'bounced';
    }

    /** @param array<string, mixed> $payload */
    private function bounceType(array $payload): string
    {
        $raw = strtolower(trim((string) ($payload['bounce_type'] ?? $payload['type'] ?? 'hard')));

        return in_array($raw, ['soft', 'temporary', 'transient'], true) ? 'soft' : 'hard';
    }

    private function suppressAndPause(Workspace $workspace, OutboundMessage $message, string $reason): void
    {
        if (filled($message->to_address)) {
            $this->suppressions->suppress($workspace, 'email', (string) $message->to_address, $reason, 'webhook');
        }

        if (! $message->sequence_id || ! $message->contact_id) {
            return;
        }

        Enrollment::query()
            ->forWorkspace($workspace)
            ->where('contact_id', $message->contact_id)
            ->where('sequence_id', $message->sequence_id)
            ->where('status', 'active')
            ->update(['status' => 'paused', 'next_run_at' => null]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolveMessage(Workspace $workspace, array $payload): OutboundMessage
    {
        $messageId = (int) ($payload['message_id'] ?? 0);

        if ($messageId > 0) {
            return OutboundMessage::query()
                ->forWorkspace($workspace)
                ->whereKey($messageId)
                ->firstOrFail();
        }

        $to = strtolower(trim((string) ($payload['email'] ?? $payload['to'] ?? '')));
        abort_unless($to !== '', 404);

        return OutboundMessage::query()
            ->forWorkspace($workspace)
            ->where('to_address', $to)
            ->latest('id')
            ->firstOrFail();
    }
}
