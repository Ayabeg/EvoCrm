<?php

namespace App\Support;

use App\Models\Workspace;
use Illuminate\Http\Request;

class SimpleMode
{
    /** @var list<array{id: string, label: string, href: string}> */
    public const SIMPLE_NAV = [
        ['id' => 'home', 'label' => 'Home', 'href' => '/dashboard'],
        ['id' => 'inbox', 'label' => 'Inbox', 'href' => '/inbox'],
        ['id' => 'leads', 'label' => 'Leads', 'href' => '/crm/leads'],
        ['id' => 'contacts', 'label' => 'Contacts', 'href' => '/crm/contacts'],
        ['id' => 'companies', 'label' => 'Companies', 'href' => '/crm/companies'],
        ['id' => 'deals', 'label' => 'Deals', 'href' => '/crm/deals'],
        ['id' => 'quotes', 'label' => 'Quotes', 'href' => '/crm/quotes'],
        ['id' => 'activities', 'label' => 'Activities', 'href' => '/crm/activities'],
    ];

    /**
     * @var list<array{id: string, label: string, href: string}>
     */
    public const FULL_NAV = [
        ['id' => 'home', 'label' => 'Home', 'href' => '/dashboard'],
        ['id' => 'inbox', 'label' => 'Inbox', 'href' => '/inbox'],
        ['id' => 'leads', 'label' => 'Leads', 'href' => '/crm/leads'],
        ['id' => 'contacts', 'label' => 'Contacts', 'href' => '/crm/contacts'],
        ['id' => 'companies', 'label' => 'Companies', 'href' => '/crm/companies'],
        ['id' => 'deals', 'label' => 'Deals', 'href' => '/crm/deals'],
        ['id' => 'quotes', 'label' => 'Quotes', 'href' => '/crm/quotes'],
        ['id' => 'activities', 'label' => 'Activities', 'href' => '/crm/activities'],
        ['id' => 'tickets', 'label' => 'Tickets', 'href' => '/crm/tickets'],
        ['id' => 'ads', 'label' => 'Ads', 'href' => '/ads'],
        ['id' => 'outbound-warmup', 'label' => 'Warmup', 'href' => '/outbound/warmup'],
        ['id' => 'report-builder', 'label' => 'Report builder', 'href' => '/crm/report-builder'],
        ['id' => 'sms', 'label' => 'SMS', 'href' => '/settings/sms'],
    ];

    public static function enabled(?Workspace $workspace): bool
    {
        return (bool) ($workspace?->simple_mode);
    }

    /**
     * @return array{
     *     tickets: bool,
     *     sms: bool,
     *     ask_evo: bool,
     *     ads: bool,
     *     warmup: bool,
     *     report_builder: bool
     * }
     */
    public static function features(?Workspace $workspace): array
    {
        $on = ! self::enabled($workspace);

        return [
            'tickets' => $on,
            'sms' => $on,
            'ask_evo' => $on,
            'ads' => $on,
            'warmup' => $on,
            'report_builder' => $on,
        ];
    }

    /**
     * @return list<array{id: string, label: string, href: string}>
     */
    public static function nav(?Workspace $workspace): array
    {
        $items = self::enabled($workspace) ? self::SIMPLE_NAV : self::FULL_NAV;

        return array_map(
            fn (array $item): array => [
                ...$item,
                'label' => __($item['label']),
            ],
            $items,
        );
    }

    public static function blocks(Request $request): bool
    {
        if (! self::enabled($request->user()?->workspace)) {
            return false;
        }

        $path = '/'.$request->path();
        $name = (string) $request->route()?->getName();

        if (str_starts_with($path, '/crm/tickets') || str_starts_with($path, '/ads')) {
            return true;
        }

        if (str_starts_with($path, '/outbound/warmup') || str_starts_with($path, '/crm/report-builder')) {
            return true;
        }

        if ($name === 'desk.ticket.open') {
            return true;
        }

        return str_ends_with($name, '.ask')
            || str_contains($name, 'draft-email')
            || $name === 'ask-evo'
            || $name === 'ask-evo.context';
    }
}
