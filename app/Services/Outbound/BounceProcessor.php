<?php

namespace App\Services\Outbound;

use App\Models\OutboundMessage;
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
    public function process(Workspace $workspace, array $payload): OutboundMessage
    {
        $eventId = (string) ($payload['event_id'] ?? $payload['id'] ?? '');
        abort_unless($eventId !== '', 422);

        $existing = OutboundMessage::query()
            ->forWorkspace($workspace)
            ->where('provider_event_id', $eventId)
            ->first();

        if ($existing instanceof OutboundMessage) {
            return $existing;
        }

        $message = $this->resolveMessage($workspace, $payload);
        $type = strtolower((string) ($payload['type'] ?? $payload['bounce_type'] ?? 'hard'));
        $type = in_array($type, ['soft', 'hard'], true) ? $type : 'hard';

        $message->forceFill([
            'status' => 'bounced',
            'failure_reason' => $type === 'hard' ? 'hard bounce' : 'soft bounce',
            'bounce_type' => $type,
            'bounced_at' => $payload['bounced_at'] ?? now(),
            'provider_event_id' => $eventId,
        ])->save();

        if ($type === 'hard' && filled($message->to_address)) {
            $this->suppressions->suppress($workspace, 'email', (string) $message->to_address, 'hard_bounce', 'webhook');
        }

        $this->analytics->capture(ProductAnalytics::EMAIL_BOUNCED, [
            'message_id' => $message->id,
            'bounce_type' => $type,
            'contact_id' => $message->contact_id,
        ], null, $workspace);

        return $message->fresh() ?? $message;
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
