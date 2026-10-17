<?php

namespace App\Services\Crm;

use App\Models\SupportQueue;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TicketRouter
{
    public function nextOwnerId(SupportQueue $queue): ?int
    {
        if (! $queue->is_active || ! $queue->round_robin) {
            return null;
        }

        return DB::transaction(function () use ($queue): ?int {
            $lockedQueue = SupportQueue::query()
                ->forWorkspace($queue->workspace_id)
                ->lockForUpdate()
                ->find($queue->id);

            if (! $lockedQueue || ! $lockedQueue->is_active || ! $lockedQueue->round_robin) {
                return null;
            }

            $members = User::query()
                ->where('workspace_id', $lockedQueue->workspace_id)
                ->orderBy('id')
                ->get(['id']);

            if ($members->isEmpty()) {
                return null;
            }

            $index = $lockedQueue->round_robin_cursor % $members->count();
            $ownerId = (int) $members[$index]->id;

            $lockedQueue->forceFill([
                'round_robin_cursor' => ($index + 1) % $members->count(),
            ])->save();

            return $ownerId;
        });
    }
}
