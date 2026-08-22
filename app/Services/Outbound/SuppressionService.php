<?php

namespace App\Services\Outbound;

use App\Models\Suppression;
use App\Models\Workspace;
use App\Support\AlgerianPhone;

class SuppressionService
{
    public function isSuppressed(Workspace $workspace, ?string $email = null, ?string $phone = null): bool
    {
        if ($email) {
            $email = strtolower(trim($email));
            if (Suppression::query()->forWorkspace($workspace)->where('type', 'email')->where('value', $email)->exists()) {
                return true;
            }
        }

        $normalized = AlgerianPhone::normalize($phone);
        if ($normalized && Suppression::query()->forWorkspace($workspace)->where('type', 'phone')->where('value', $normalized)->exists()) {
            return true;
        }

        return false;
    }

    public function suppress(Workspace $workspace, string $type, string $value, string $reason = 'unsubscribe', string $source = 'public'): Suppression
    {
        $normalized = $type === 'phone'
            ? (AlgerianPhone::normalize($value) ?? $value)
            : strtolower(trim($value));

        return Suppression::query()->updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'type' => $type,
                'value' => $normalized,
            ],
            [
                'reason' => $reason,
                'source' => $source,
            ]
        );
    }
}
