<?php

namespace App\Services\Outbound;

use App\Models\OutboundMessage;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class OutboundSendClaim
{
    private const STALE_AFTER_MINUTES = 15;

    public function claim(OutboundMessage $message): ?OutboundMessage
    {
        return DB::transaction(function () use ($message): ?OutboundMessage {
            $current = OutboundMessage::query()
                ->whereKey($message->id)
                ->lockForUpdate()
                ->first();

            if (! $current || $current->status !== 'queued') {
                return null;
            }

            $current->forceFill([
                'status' => 'sending',
                'sending_at' => now(),
            ])->save();

            return $current;
        });
    }

    public function recoverStale(?Workspace $workspace = null): int
    {
        $query = OutboundMessage::query()
            ->where('status', 'sending')
            ->whereNotNull('sending_at')
            ->where('sending_at', '<=', now()->subMinutes(self::STALE_AFTER_MINUTES));

        if ($workspace instanceof Workspace) {
            $query->forWorkspace($workspace);
        }

        return $query->update([
            // A provider may have accepted the message before the worker
            // crashed. Quarantine the outcome instead of risking a duplicate
            // SMTP delivery on automatic recovery.
            'status' => 'failed',
            'sending_at' => null,
            'failure_reason' => 'Provider outcome unknown after the send lease expired; manual reconciliation required.',
        ]);
    }
}
