<?php

namespace App\Services\Crm;

use App\Models\RecordLayout;
use App\Models\User;

/**
 * Persisted HubSpot-style board card options (entity deals_board).
 *
 * @see https://mobbin.com/screens/d9777088-2fcd-4363-9f4a-eec9f1282860
 */
class DealBoardOptions
{
    public const ENTITY = 'deals_board';

    /**
     * @return array{
     *     card_style: string,
     *     show_priority: bool,
     *     show_associations: bool,
     *     show_activity: bool,
     *     mark_inactive: bool,
     *     inactive_after_days: int,
     *     sort: string
     * }
     */
    public static function defaults(): array
    {
        return [
            'card_style' => 'default',
            'show_priority' => true,
            'show_associations' => true,
            'show_activity' => true,
            'mark_inactive' => true,
            'inactive_after_days' => 14,
            'sort' => 'last_activity',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function forUser(User $user): array
    {
        $layout = RecordLayout::query()
            ->where('workspace_id', $user->workspace_id)
            ->where('user_id', $user->id)
            ->where('entity', self::ENTITY)
            ->first();

        return $this->normalize($layout?->layout ?? []);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function save(User $user, array $data): array
    {
        $normalized = $this->normalize($data);

        RecordLayout::query()->updateOrCreate(
            [
                'workspace_id' => $user->workspace_id,
                'user_id' => $user->id,
                'entity' => self::ENTITY,
            ],
            ['layout' => $normalized],
        );

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function normalize(array $data): array
    {
        $defaults = self::defaults();
        $style = ($data['card_style'] ?? $defaults['card_style']) === 'compact' ? 'compact' : 'default';
        $sort = (string) ($data['sort'] ?? $defaults['sort']);
        if (! in_array($sort, ['last_activity', 'amount', 'close_date', 'title'], true)) {
            $sort = 'last_activity';
        }

        $days = (int) ($data['inactive_after_days'] ?? $defaults['inactive_after_days']);
        $days = max(1, min(90, $days));

        return [
            'card_style' => $style,
            'show_priority' => (bool) ($data['show_priority'] ?? $defaults['show_priority']),
            'show_associations' => (bool) ($data['show_associations'] ?? $defaults['show_associations']),
            'show_activity' => (bool) ($data['show_activity'] ?? $defaults['show_activity']),
            'mark_inactive' => (bool) ($data['mark_inactive'] ?? $defaults['mark_inactive']),
            'inactive_after_days' => $days,
            'sort' => $sort,
        ];
    }
}
