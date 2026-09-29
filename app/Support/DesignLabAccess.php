<?php

namespace App\Support;

use App\Models\User;

final class DesignLabAccess
{
    public static function allowed(?User $user): bool
    {
        if (! app()->isProduction()) {
            return true;
        }

        return $user?->role?->canManageSettings() === true;
    }
}
