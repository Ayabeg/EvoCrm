<?php

namespace App\Services\Operations;

use App\Models\AuditEvent;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Model;

class AuditLogger
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function record(
        Workspace $workspace,
        string $action,
        string $summary,
        ?User $actor = null,
        ?Model $subject = null,
        array $payload = [],
        ?string $ip = null,
    ): AuditEvent {
        return AuditEvent::query()->create([
            'workspace_id' => $workspace->id,
            'actor_id' => $actor?->id,
            'action' => $action,
            'subject_type' => $subject ? $subject::class : null,
            'subject_id' => $subject?->getKey(),
            'summary' => $summary,
            'payload' => $payload,
            'ip' => $ip ?? request()->ip(),
        ]);
    }
}
