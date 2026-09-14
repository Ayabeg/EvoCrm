<?php

namespace App\Services\Home;

use App\Enums\ConnectorProvider;
use App\Enums\ConnectorStatus;
use App\Models\Deal;
use App\Models\Mailbox;
use App\Models\Sequence;
use App\Models\Workspace;
use App\Services\Connectors\ConnectorRegistrar;
use App\Services\Evolution\EvolutionCloudService;
use App\Support\Integrations;
use Illuminate\Support\Collection;

/**
 * HubSpot-shaped guided actions that hit real EvoSales settings.
 *
 * @see https://mobbin.com/screens/1f571c85-2b3e-4f10-8125-f6aac6e49748
 */
class GuidedActionBuilder
{
    public function __construct(
        private ConnectorRegistrar $connectors,
        private EvolutionCloudService $evolution,
    ) {}

    /**
     * @param  Collection<int, Deal>  $openDeals
     * @return list<array{key: string, category: string, title: string, description: string, actionLabel: string, href: string}>
     */
    public function build(Workspace $workspace, Collection $openDeals): array
    {
        $actions = [];
        $integrations = Integrations::forWorkspace($workspace);
        $hasMailbox = Mailbox::query()->forWorkspace($workspace)->where('enabled', true)->exists();

        if (! $hasMailbox) {
            $actions[] = $this->action(
                'connect_mailbox',
                'prospecting',
                'Connect a sending mailbox',
                'Sequences and campaigns send through your own SMTP stack.',
                'Go to mailboxes',
                '/outbound/mailboxes',
            );
        }

        if (! ($integrations['meta']['connected'] ?? false)) {
            $actions[] = $this->action(
                'connect_meta',
                'setup',
                'Connect Meta Ads',
                'Ingest lead forms and campaign stats into this workspace.',
                'Open Apps',
                '/settings/apps',
            );
        }

        if (! ($this->evolution->configured() && $this->evolution->cloudCredentialsPresent())) {
            $actions[] = $this->action(
                'connect_whatsapp',
                'setup',
                'Connect WhatsApp Cloud',
                'Official Cloud API through Evolution. No QR or linked devices.',
                'Open Evolution',
                '/settings/evolution',
            );
        }

        if (! $this->calendarConnected($workspace)) {
            $actions[] = $this->action(
                'connect_calendar',
                'prospecting',
                'Connect Google Calendar',
                'Log meetings on contact and deal timelines from the same Google client.',
                'Open connectors',
                '/settings/connectors',
            );
        }

        $openDeals
            ->filter(fn (Deal $deal) => blank($deal->next_step))
            ->take(3)
            ->each(function (Deal $deal) use (&$actions): void {
                $actions[] = $this->action(
                    'deal_next_step_'.$deal->id,
                    'deal',
                    __('Set a next step on :title', ['title' => $deal->title]),
                    'This open deal has no next action.',
                    'Open deal',
                    '/crm/deals/'.$deal->id,
                );
            });

        if ($hasMailbox && Sequence::query()->forWorkspace($workspace)->doesntExist()) {
            $actions[] = $this->action(
                'create_sequence',
                'prospecting',
                'Create an outreach sequence',
                'Automate follow-up from your connected mailbox.',
                'Open sequences',
                '/outbound/sequences',
            );
        }

        return $actions;
    }

    private function calendarConnected(Workspace $workspace): bool
    {
        $row = collect($this->connectors->googleCatalog($workspace))
            ->firstWhere('provider', ConnectorProvider::GoogleCalendar->value);

        return ($row['status'] ?? null) === ConnectorStatus::Connected->value;
    }

    /**
     * @return array{key: string, category: string, title: string, description: string, actionLabel: string, href: string}
     */
    private function action(
        string $key,
        string $category,
        string $title,
        string $description,
        string $actionLabel,
        string $href,
    ): array {
        return [
            'key' => $key,
            'category' => $category,
            'title' => __($title),
            'description' => __($description),
            'actionLabel' => __($actionLabel),
            'href' => $href,
        ];
    }
}
