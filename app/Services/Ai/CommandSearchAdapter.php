<?php

namespace App\Services\Ai;

use App\Models\User;
use App\Services\Crm\CommandSearch;

/**
 * Global Ask Evo search goes through the existing authorized Command search.
 */
final class CommandSearchAdapter
{
    public function __construct(private CommandSearch $search) {}

    /**
     * @return list<array{type: string, id: int, label: string, href: string, recordRef?: array{type: string, id: int}}>
     */
    public function hits(User $user, string $question): array
    {
        return $this->search->search($user, $question);
    }
}
