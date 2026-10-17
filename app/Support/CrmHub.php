<?php

namespace App\Support;

use App\Http\Resources\SavedFilterResource;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Message;
use App\Models\OutboundMessage;
use App\Models\Playbook;
use App\Models\SavedFilter;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\CustomAttributes;
use Illuminate\Support\Collection;

class CrmHub
{
    public function __construct(private CustomAttributes $attributes, private CrmFilter $filter) {}

    /**
     * @return array<string, mixed>
     */
    public function members(Workspace $workspace): array
    {
        return User::query()
            ->where('workspace_id', $workspace->id)
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function filters(Workspace $workspace, string $entity, ?User $viewer = null): array
    {
        $viewerId = $viewer?->id;

        return SavedFilter::query()
            ->forWorkspace($workspace)
            ->where('entity', $entity)
            ->where(function ($query) use ($viewerId) {
                $query->whereIn('visibility', ['workspace', 'team']);
                if ($viewerId) {
                    $query->orWhere('user_id', $viewerId);
                }
            })
            ->orderByDesc('is_workspace_default')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->map(function (SavedFilter $savedFilter) use ($workspace, $entity) {
                $resolved = $this->filter->fromSaved($savedFilter);
                $savedFilter->setAttribute('record_count', $this->filter->count($workspace, $entity, $resolved));

                return (new SavedFilterResource($savedFilter))->resolve();
            })
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function listViewMeta(string $entity, ?array $columns = null, ?array $sort = null, ?Workspace $workspace = null): array
    {
        $extraColumns = $workspace ? $this->customColumnDefs($workspace, $entity) : [];

        return [
            'columnDefs' => array_merge(ListViewConfig::columns($entity), $extraColumns),
            'filterFields' => array_merge(
                ListViewConfig::filterFields($entity),
                $workspace ? $this->associationFilterFields($workspace, $entity) : [],
            ),
            'columns' => ListViewConfig::normalizeColumns($entity, $columns, $extraColumns),
            'sort' => $sort ?? ListViewConfig::defaultSort($entity),
        ];
    }

    /**
     * @param  Collection<int, Contact|Deal|Company>  $rows
     * @return list<array<string, mixed>>
     */
    public function withListAttributes(Workspace $workspace, string $entity, $rows): array
    {
        return $rows->map(fn ($row) => array_merge($row->toArray(), [
            'attributes' => $this->attributes->valuesFor($workspace, $entity, (int) $row->id),
        ]))->values()->all();
    }

    /**
     * @return list<array{id: int, name: string, body: string}>
     */
    public function playbooks(Workspace $workspace, string $entity): array
    {
        return Playbook::query()
            ->forWorkspace($workspace)
            ->where('entity', $entity)
            ->orderBy('position')
            ->orderBy('name')
            ->get(['id', 'name', 'body'])
            ->map(fn (Playbook $playbook) => [
                'id' => $playbook->id,
                'name' => $playbook->name,
                'body' => $playbook->body,
            ])
            ->all();
    }

    /**
     * @return list<array{id: string, label: string, defaultVisible: bool}>
     */
    protected function customColumnDefs(Workspace $workspace, string $entity): array
    {
        return $this->attributes->definitions($workspace, $entity)
            ->map(fn ($definition) => [
                'id' => 'custom:'.$definition->key,
                'label' => $definition->type === 'calculated' ? $definition->label.' (calc)' : $definition->label,
                'defaultVisible' => false,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: string, label: string, type: string, options?: list<string>}>
     */
    protected function associationFilterFields(Workspace $workspace, string $entity): array
    {
        if (! in_array($entity, ['contact', 'company', 'deal'], true)) {
            return [];
        }

        if ($entity === 'deal') {
            return [
                ['id' => 'has_associated_company', 'label' => 'Has associated company', 'type' => 'boolean'],
            ];
        }

        $pipeline = $workspace->defaultPipeline();
        $pipeline->loadMissing('stages');
        $stages = $pipeline->stages->pluck('slug')->filter()->values()->all();

        $fields = [
            ['id' => 'has_open_deal', 'label' => 'Has open deal', 'type' => 'boolean'],
            [
                'id' => 'deal_stage',
                'label' => 'Deal stage',
                'type' => 'select',
                'options' => $stages,
            ],
        ];

        if ($entity === 'contact') {
            $fields[] = ['id' => 'has_won_deal', 'label' => 'Has won deal', 'type' => 'boolean'];
            $fields[] = ['id' => 'has_company', 'label' => 'Has company', 'type' => 'boolean'];
            $fields[] = ['id' => 'deal_min_amount', 'label' => 'Min deal amount (DZD)', 'type' => 'number'];
        }

        return $fields;
    }

    /**
     * @return array<string, mixed>
     */
    public function contactAssociations(Contact $contact): array
    {
        $contact->loadMissing([
            'company',
            'owner',
            'leads',
            'deals.stage',
            'deals.owner',
            'deals.quotes',
            'threads.channel',
            'enrollments.sequence',
            'tickets',
        ]);

        return [
            'company' => $contact->company,
            'deals' => $contact->deals,
            'leads' => $contact->leads,
            'threads' => $contact->threads,
            'enrollments' => $contact->enrollments,
            'quotes' => $contact->deals->flatMap->quotes,
            'tickets' => Ticket::presentRelatedList($contact->tickets),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function dealAssociations(Deal $deal): array
    {
        $deal->loadMissing([
            'contact.company',
            'contact.threads',
            'contact.enrollments.sequence',
            'company',
            'owner',
            'lead',
            'quotes.items',
            'lineItems.product',
            'tickets',
        ]);

        return [
            'contact' => $deal->contact,
            'company' => $deal->company,
            'lead' => $deal->lead,
            'threads' => $deal->contact?->threads ?? [],
            'enrollments' => $deal->contact?->enrollments ?? [],
            'quotes' => $deal->quotes,
            'line_items' => $deal->lineItems,
            'tickets' => Ticket::presentRelatedList($deal->tickets),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function companyAssociations(Company $company): array
    {
        $company->loadMissing([
            'contacts.owner',
            'contacts.threads',
            'contacts.enrollments.sequence',
            'deals.stage',
            'deals.owner',
            'owner',
        ]);

        return [
            'contacts' => $company->contacts,
            'deals' => $company->deals,
            'threads' => $company->contacts->flatMap->threads,
            'enrollments' => $company->contacts->flatMap->enrollments,
        ];
    }

    /**
     * Return one chronological stream for activities and channel messages.
     *
     * Messages are intentionally represented as lightweight timeline rows so
     * the existing record activity UI can render them without exposing the
     * full conversation payload.
     *
     * @return array<int, Activity|array<string, mixed>>
     */
    public function timeline(?Contact $contact = null, ?Deal $deal = null, ?Company $company = null): array
    {
        $query = Activity::query()->with(['owner', 'actor'])->latest();

        if ($deal) {
            $query->where(function ($q) use ($deal) {
                $q->where('deal_id', $deal->id);
                if ($deal->contact_id) {
                    $q->orWhere(function ($inner) use ($deal) {
                        $inner->where('contact_id', $deal->contact_id)->whereNull('deal_id');
                    });
                }
            });
        } elseif ($contact) {
            $query->where('contact_id', $contact->id);
        } elseif ($company) {
            $query->where('company_id', $company->id);
        } else {
            return [];
        }

        $activities = $query->limit(80)->get();

        if (! $contact && $deal) {
            $deal->loadMissing('contact');
            $contact = $deal->contact;
        }

        $messages = $contact
            ? Message::query()
                ->with(['user', 'thread.channel'])
                ->where('contact_id', $contact->id)
                ->latest()
                ->limit(80)
                ->get()
                ->map(fn (Message $message): array => [
                    'id' => 'message-'.$message->id,
                    'type' => $message->direction === 'inbound' ? 'inbound_message' : 'outbound_message',
                    'subject' => $message->thread?->subject,
                    'body' => $message->body,
                    'done' => true,
                    'created_at' => $message->created_at,
                    'owner' => null,
                    'actor' => $message->user ? ['name' => $message->user->name] : null,
                    'meta' => [
                        'direction' => $message->direction,
                        'channel' => $message->thread?->channel?->type?->value,
                        'status' => $message->status,
                    ],
                ])
            : collect();

        $outboundMessages = $contact
            ? OutboundMessage::query()
                ->where('contact_id', $contact->id)
                ->latest('created_at')
                ->limit(80)
                ->get()
                ->map(fn (OutboundMessage $message): array => [
                    'id' => 'outbound-message-'.$message->id,
                    'type' => $message->direction === 'in' ? 'inbound_email' : 'outbound_email',
                    'subject' => $message->subject,
                    'body' => $message->body,
                    'done' => in_array($message->status, ['sent', 'delivered', 'opened', 'clicked', 'replied'], true),
                    'created_at' => $message->sent_at ?? $message->created_at,
                    'owner' => null,
                    'actor' => null,
                    'meta' => [
                        'channel' => $message->channel,
                        'direction' => $message->direction,
                        'status' => $message->status,
                        'failure_reason' => $message->failure_reason,
                        'to_address' => $message->to_address,
                        'opened_at' => $message->opened_at,
                        'replied_at' => $message->replied_at,
                        'campaign_id' => $message->campaign_id,
                        'sequence_id' => $message->sequence_id,
                    ],
                ])
            : collect();

        return $activities
            ->concat($messages)
            ->concat($outboundMessages)
            ->sortByDesc(function (Activity|array $item): int {
                $createdAt = $item instanceof Activity ? $item->created_at : ($item['created_at'] ?? null);

                return $createdAt?->getTimestamp() ?? 0;
            })
            ->take(80)
            ->values()
            ->all();
    }

    /**
     * Recent inbound desk messages vs outbound activity for a contact or deal.
     *
     * @return array{inbound: array<int, array<string, mixed>>, outbound: array<int, array<string, mixed>>}
     */
    public function catchUp(?Contact $contact = null, ?Deal $deal = null): array
    {
        if ($deal && ! $contact) {
            $deal->loadMissing('contact');
            $contact = $deal->contact;
        }

        if (! $contact) {
            return ['inbound' => [], 'outbound' => []];
        }

        $messages = Message::query()
            ->where('contact_id', $contact->id)
            ->latest()
            ->limit(24)
            ->get();

        $inbound = $messages
            ->where('direction', 'inbound')
            ->take(6)
            ->values()
            ->map(fn (Message $message) => $this->catchUpMessage($message, 'inbound'))
            ->all();

        $outboundMessages = $messages
            ->where('direction', 'outbound')
            ->take(6)
            ->values()
            ->map(fn (Message $message) => $this->catchUpMessage($message, 'outbound'));

        $activityQuery = Activity::query()
            ->whereIn('type', ['email', 'sequence', 'call', 'note'])
            ->latest()
            ->limit(6);

        if ($deal) {
            $activityQuery->where(function ($query) use ($deal): void {
                $query->where('deal_id', $deal->id);
                if ($deal->contact_id) {
                    $query->orWhere(function ($inner) use ($deal): void {
                        $inner->where('contact_id', $deal->contact_id)->whereNull('deal_id');
                    });
                }
            });
        } else {
            $activityQuery->where('contact_id', $contact->id);
        }

        $outboundActivities = $activityQuery->get()->map(fn (Activity $activity) => [
            'id' => 'act-'.$activity->id,
            'label' => $activity->subject ?? $activity->body ?? $activity->type,
            'at' => $activity->created_at?->toIso8601String(),
            'source' => $activity->type,
            'href' => null,
        ]);

        return [
            'inbound' => $inbound,
            'outbound' => $outboundMessages
                ->concat($outboundActivities)
                ->sortByDesc(fn (array $item) => $item['at'] ?? '')
                ->take(8)
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array{id: string, label: string, at: string|null, source: string, href: string|null}
     */
    protected function catchUpMessage(Message $message, string $source): array
    {
        return [
            'id' => 'msg-'.$message->id,
            'label' => $message->body ?: ($source === 'inbound' ? 'Inbound message' : 'Outbound message'),
            'at' => $message->created_at?->toIso8601String(),
            'source' => $source,
            'href' => $message->thread_id ? '/conversations?thread='.$message->thread_id : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function attributeBag(Workspace $workspace, string $entity, int $entityId): array
    {
        return [
            'definitions' => $this->attributes->definitions($workspace, $entity)
                ->map(fn ($definition) => $this->attributes->presentDefinition($definition))
                ->values(),
            'values' => $this->attributes->valuesFor($workspace, $entity, $entityId),
        ];
    }
}
