<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

function apiToken(User $user, string $device = 'test'): string
{
    return $user->createToken($device, [$user->workspaceAbility()])->plainTextToken;
}
