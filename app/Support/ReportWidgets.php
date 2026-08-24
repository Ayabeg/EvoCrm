<?php

namespace App\Support;

/**
 * Catalog of addable report widgets. Every key points at an existing
 * EvoViz chart already built by the Reports rooms — no new chart types.
 */
final class ReportWidgets
{
    /**
     * @var array<string, array{room: string, roomTitle: string, id: string, title: string}>
     */
    public const CATALOG = [
        'pipeline.evoviz.bar' => [
            'room' => 'pipeline',
            'roomTitle' => 'Pipeline',
            'id' => 'evoviz.bar',
            'title' => 'Open pipeline value by stage',
        ],
        'pipeline.evoviz.area' => [
            'room' => 'pipeline',
            'roomTitle' => 'Pipeline',
            'id' => 'evoviz.area',
            'title' => 'Deals won per day',
        ],
        'pipeline.evoviz.donut' => [
            'room' => 'pipeline',
            'roomTitle' => 'Pipeline',
            'id' => 'evoviz.donut',
            'title' => 'Outcomes in window',
        ],
        'leads.evoviz.area' => [
            'room' => 'leads',
            'roomTitle' => 'Leads',
            'id' => 'evoviz.area',
            'title' => 'New leads per day',
        ],
        'leads.evoviz.donut' => [
            'room' => 'leads',
            'roomTitle' => 'Leads',
            'id' => 'evoviz.donut',
            'title' => 'Leads by status',
        ],
        'leads.evoviz.ranked-bars' => [
            'room' => 'leads',
            'roomTitle' => 'Leads',
            'id' => 'evoviz.ranked-bars',
            'title' => 'Leads by source',
        ],
        'outbound.evoviz.area' => [
            'room' => 'outbound',
            'roomTitle' => 'Outbound',
            'id' => 'evoviz.area',
            'title' => 'Sent per day',
        ],
        'outbound.evoviz.bar' => [
            'room' => 'outbound',
            'roomTitle' => 'Outbound',
            'id' => 'evoviz.bar',
            'title' => 'Engagement of window sends',
        ],
        'ads.evoviz.area' => [
            'room' => 'ads',
            'roomTitle' => 'Ads',
            'id' => 'evoviz.area',
            'title' => 'Spend per day',
        ],
        'ads.evoviz.ranked-bars' => [
            'room' => 'ads',
            'roomTitle' => 'Ads',
            'id' => 'evoviz.ranked-bars',
            'title' => 'Spend by campaign',
        ],
        'desk.evoviz.area' => [
            'room' => 'desk',
            'roomTitle' => 'Desk',
            'id' => 'evoviz.area',
            'title' => 'Messages per day',
        ],
        'desk.evoviz.donut' => [
            'room' => 'desk',
            'roomTitle' => 'Desk',
            'id' => 'evoviz.donut',
            'title' => 'Threads by status',
        ],
        'activity.evoviz.bar' => [
            'room' => 'activity',
            'roomTitle' => 'Activity',
            'id' => 'evoviz.bar',
            'title' => 'Logged by type',
        ],
        'activity.evoviz.area' => [
            'room' => 'activity',
            'roomTitle' => 'Activity',
            'id' => 'evoviz.area',
            'title' => 'Completed per day',
        ],
    ];

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return array_keys(self::CATALOG);
    }

    /**
     * @return array{room: string, roomTitle: string, id: string, title: string}|null
     */
    public static function get(string $key): ?array
    {
        return self::CATALOG[$key] ?? null;
    }

    /**
     * @return list<array{key: string, room: string, roomTitle: string, id: string, title: string}>
     */
    public static function catalog(): array
    {
        $items = [];

        foreach (self::CATALOG as $key => $meta) {
            $items[] = ['key' => $key, ...$meta];
        }

        return $items;
    }
}
