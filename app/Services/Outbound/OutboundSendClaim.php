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
            'status' => 'queued',
            'sending_at' => null,
        ]);
    }
}
