<?php

namespace App\Services\Ai;

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;

final class AskEvoRateLimiter
{
    public const MAX_ATTEMPTS = 20;

    public const DECAY_SECONDS = 60;

    public function tooManyAttempts(User $user): bool
    {
        return RateLimiter::tooManyAttempts($this->key($user), self::MAX_ATTEMPTS);
    }

    public function hit(User $user): void
    {
        RateLimiter::hit($this->key($user), self::DECAY_SECONDS);
    }

    public function remaining(User $user): int
    {
        return RateLimiter::remaining($this->key($user), self::MAX_ATTEMPTS);
    }

    private function key(User $user): string
    {
        return 'ask-evo:'.$user->id.':'.(int) $user->workspace_id;
    }
}
