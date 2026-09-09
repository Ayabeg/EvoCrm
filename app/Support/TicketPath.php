<?php

namespace App\Support;

use App\Models\Ticket;

final class TicketPath
{
    /**
     * Salesforce Path chrome on HubSpot support statuses.
     *
     * @var list<array{key: string, label: string, status: string}>
     */
    public const STEPS = [
        ['key' => Ticket::STATUS_NEW, 'label' => 'New', 'status' => Ticket::STATUS_NEW],
        ['key' => Ticket::STATUS_WAITING_ON_CONTACT, 'label' => 'Waiting on contact', 'status' => Ticket::STATUS_WAITING_ON_CONTACT],
        ['key' => Ticket::STATUS_WAITING_ON_US, 'label' => 'Waiting on us', 'status' => Ticket::STATUS_WAITING_ON_US],
        ['key' => Ticket::STATUS_CLOSED, 'label' => 'Closed', 'status' => Ticket::STATUS_CLOSED],
    ];

    /**
     * @return array{steps: list<array{key: string, label: string, status: string}>, current: string, next: string|null, complete: bool}
     */
    public static function present(Ticket $ticket): array
    {
        $current = (string) $ticket->status;
        $keys = array_column(self::STEPS, 'key');
        $index = array_search($current, $keys, true);
        $next = is_int($index) ? ($keys[$index + 1] ?? null) : null;

        return [
            'steps' => self::STEPS,
            'current' => $current,
            'next' => $next,
            'complete' => $current === Ticket::STATUS_CLOSED,
        ];
    }
}
