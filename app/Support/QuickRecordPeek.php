<?php

namespace App\Support;

use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Crm\DealAttentionEvaluator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;

/**
 * Compact read-only facts for QuickRecordDrawer.
 *
 * Why this exists: Inertia show pages are full workspaces (too heavy to
 * hydrate a peek). API v1 has no company show and omits associations /
 * quote deal-title presentation. One permission-aware, workspace-scoped
 * GET reuses policies + existing models. No parallel CRM API, no writes.
 */
class QuickRecordPeek
{
    public const TYPES = ['contact', 'company', 'lead', 'deal', 'quote', 'ticket'];

    public function __construct(private CrmHub $hub) {}

    /**
     * @return array<string, mixed>
     */
    public function present(User $user, string $type, int $id): array
    {
        if (! in_array($type, self::TYPES, true) || $id < 1) {
            abort(404);
        }

        $workspace = $user->workspace;
        abort_unless($workspace instanceof Workspace, 404);

        $record = $this->findInWorkspace($workspace, $type, $id);
        abort_unless($record instanceof Model, 404);

        if (! Gate::forUser($user)->allows('view', $record)) {
            abort(403);
        }

        return match ($type) {
            'contact' => $this->contact($user, $record),
            'company' => $this->company($user, $record),
            'lead' => $this->lead($user, $record),
            'deal' => $this->deal($user, $record),
            'quote' => $this->quote($user, $record),
            'ticket' => $this->ticket($user, $record),
            default => abort(404),
        };
    }

    public function findInWorkspace(Workspace $workspace, string $type, int $id): ?Model
    {
        return match ($type) {
            'contact' => Contact::query()->forWorkspace($workspace)->find($id),
            'company' => Company::query()->forWorkspace($workspace)->find($id),
            'lead' => Lead::query()->forWorkspace($workspace)->find($id),
            'deal' => Deal::query()->forWorkspace($workspace)->find($id),
            'quote' => Quote::query()->forWorkspace($workspace)->find($id),
            'ticket' => Ticket::query()->forWorkspace($workspace)->find($id),
            default => null,
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function contact(User $user, Contact $contact): array
    {
        $contact->loadMissing(['company:id,name', 'owner:id,name', 'deals:id,title,contact_id,company_id']);

        $timeline = $this->hub->timeline(contact: $contact);

        return $this->envelope(
            type: 'contact',
            id: (int) $contact->id,
            record: [
                'first_name' => $contact->first_name,
                'last_name' => $contact->last_name,
                'display_name' => $contact->displayName(),
                'email' => $contact->email,
                'phone_e164' => $contact->phone_e164,
                'city' => $contact->city,
                'wilaya' => $contact->wilaya,
                'lead_status' => $contact->lead_status,
                'source' => $contact->source,
                'company_id' => $contact->company_id,
                'company_name' => $contact->company?->name,
                'owner_id' => $contact->owner_id,
                'owner_name' => $contact->owner?->name,
                'created_at' => $contact->created_at?->toIso8601String(),
            ],
            associations: $this->compactRefs([
                $contact->company ? ['type' => 'company', 'id' => $contact->company->id, 'label' => $contact->company->name] : null,
                ...$contact->deals->map(fn (Deal $deal): array => [
                    'type' => 'deal',
                    'id' => $deal->id,
                    'label' => $deal->title,
                ])->all(),
            ]),
            activity: $timeline,
            user: $user,
            model: $contact,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function company(User $user, Company $company): array
    {
        $company->loadMissing([
            'owner:id,name',
            'contacts:id,first_name,last_name,company_id',
            'deals:id,title,company_id',
        ]);
        $company->loadCount(['contacts', 'deals']);

        $timeline = $this->hub->timeline(company: $company);

        return $this->envelope(
            type: 'company',
            id: (int) $company->id,
            record: [
                'name' => $company->name,
                'domain' => $company->domain,
                'industry' => $company->industry,
                'phone' => $company->phone,
                'city' => $company->city,
                'wilaya' => $company->wilaya,
                'country' => $company->country,
                'owner_id' => $company->owner_id,
                'owner_name' => $company->owner?->name,
                'contacts_count' => (int) $company->contacts_count,
                'deals_count' => (int) $company->deals_count,
            ],
            associations: $this->compactRefs([
                ...$company->contacts->map(fn (Contact $contact): array => [
                    'type' => 'contact',
                    'id' => $contact->id,
                    'label' => $contact->displayName(),
                ])->all(),
                ...$company->deals->map(fn (Deal $deal): array => [
                    'type' => 'deal',
                    'id' => $deal->id,
                    'label' => $deal->title,
                ])->all(),
            ]),
            activity: $timeline,
            user: $user,
            model: $company,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function lead(User $user, Lead $lead): array
    {
        $lead->loadMissing([
            'contact:id,first_name,last_name,email,phone_e164',
            'company:id,name',
            'deal:id,title,lead_id',
            'latestScore',
        ]);

        return $this->envelope(
            type: 'lead',
            id: (int) $lead->id,
            record: [
                'title' => $lead->title,
                'status' => $lead->status,
                'source' => $lead->source,
                'score' => $lead->score,
                'qualified_at' => $lead->qualified_at?->toIso8601String(),
                'contact_id' => $lead->contact_id,
                'contact_name' => $lead->contact?->displayName(),
                'contact_email' => $lead->contact?->email,
                'contact_phone_e164' => $lead->contact?->phone_e164,
                'company_id' => $lead->company_id,
                'company_name' => $lead->company?->name,
                'deal_id' => $lead->deal?->id,
                'deal_title' => $lead->deal?->title,
                'created_at' => $lead->created_at?->toIso8601String(),
            ],
            associations: $this->compactRefs([
                $lead->contact ? ['type' => 'contact', 'id' => $lead->contact->id, 'label' => $lead->contact->displayName()] : null,
                $lead->company ? ['type' => 'company', 'id' => $lead->company->id, 'label' => $lead->company->name] : null,
                $lead->deal ? ['type' => 'deal', 'id' => $lead->deal->id, 'label' => $lead->deal->title] : null,
            ]),
            activity: [],
            user: $user,
            model: $lead,
            supportsActivity: false,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function deal(User $user, Deal $deal): array
    {
        $deal->loadMissing([
            'stage:id,name,slug',
            'contact:id,first_name,last_name,email,phone_e164',
            'company:id,name',
            'owner:id,name',
            'lead:id,title',
            'quotes:id,deal_id,status,total_cents,currency',
        ]);

        $timeline = $this->hub->timeline(deal: $deal);
        $deal->loadMissing(['stage']);
        $attention = app(DealAttentionEvaluator::class)->presentMany(collect([$deal]))[(int) $deal->id] ?? null;

        return $this->envelope(
            type: 'deal',
            id: (int) $deal->id,
            attention: $attention,
            record: [
                'title' => $deal->title,
                'amount_cents' => (int) $deal->amount_cents,
                'currency' => $deal->currency ?? 'DZD',
                'stage_id' => $deal->stage_id,
                'stage_name' => $deal->stage?->name,
                'stage_slug' => $deal->stage?->slug,
                'priority' => $deal->priority,
                'source' => $deal->source,
                'close_date' => $deal->close_date?->toDateString(),
                'next_step' => $deal->next_step,
                'contact_id' => $deal->contact_id,
                'contact_name' => $deal->contact?->displayName(),
                'contact_email' => $deal->contact?->email,
                'contact_phone_e164' => $deal->contact?->phone_e164,
                'company_id' => $deal->company_id,
                'company_name' => $deal->company?->name,
                'owner_id' => $deal->owner_id,
                'owner_name' => $deal->owner?->name,
                'lead_id' => $deal->lead_id,
            ],
            associations: $this->compactRefs([
                $deal->company ? ['type' => 'company', 'id' => $deal->company->id, 'label' => $deal->company->name] : null,
                $deal->contact ? ['type' => 'contact', 'id' => $deal->contact->id, 'label' => $deal->contact->displayName()] : null,
                $deal->lead ? ['type' => 'lead', 'id' => $deal->lead->id, 'label' => $deal->lead->title] : null,
                ...$deal->quotes->map(fn (Quote $quote): array => [
                    'type' => 'quote',
                    'id' => $quote->id,
                    'label' => 'Quote #'.$quote->id,
                    'hint' => $quote->status,
                ])->all(),
            ]),
            activity: $timeline,
            user: $user,
            model: $deal,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function quote(User $user, Quote $quote): array
    {
        $quote->loadMissing([
            'deal:id,title,owner_id,contact_id,company_id',
            'deal.owner:id,name',
            'deal.contact:id,first_name,last_name,email',
            'deal.company:id,name',
        ]);

        return $this->envelope(
            type: 'quote',
            id: (int) $quote->id,
            record: [
                'title' => $quote->deal?->title ?? 'Quote #'.$quote->id,
                'status' => $quote->status,
                'currency' => $quote->currency,
                'total_cents' => (int) $quote->total_cents,
                'expires_at' => $quote->expires_at?->toIso8601String(),
                'sent_at' => $quote->sent_at?->toIso8601String(),
                'accepted_at' => $quote->accepted_at?->toIso8601String(),
                'deal_id' => $quote->deal_id,
                'deal_title' => $quote->deal?->title,
                'owner_id' => $quote->deal?->owner_id,
                'owner_name' => $quote->deal?->owner?->name,
            ],
            associations: $this->compactRefs([
                $quote->deal ? ['type' => 'deal', 'id' => $quote->deal->id, 'label' => $quote->deal->title] : null,
            ]),
            activity: [],
            user: $user,
            model: $quote,
            supportsActivity: false,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function ticket(User $user, Ticket $ticket): array
    {
        $ticket->loadMissing([
            'contact:id,first_name,last_name,email,phone_e164',
            'company:id,name',
            'deal:id,title',
            'owner:id,name',
        ]);

        return $this->envelope(
            type: 'ticket',
            id: (int) $ticket->id,
            record: [
                'subject' => $ticket->subject,
                'number' => $ticket->number,
                'status' => $ticket->status,
                'priority' => $ticket->priority,
                'channel' => $ticket->channel,
                'sla_label' => $ticket->present()['sla_label'] ?? null,
                'contact_id' => $ticket->contact_id,
                'contact_name' => $ticket->contact?->displayName(),
                'contact_email' => $ticket->contact?->email,
                'contact_phone_e164' => $ticket->contact?->phone_e164,
                'company_id' => $ticket->company_id,
                'company_name' => $ticket->company?->name,
                'deal_id' => $ticket->deal_id,
                'deal_title' => $ticket->deal?->title,
                'owner_id' => $ticket->owner_id,
                'owner_name' => $ticket->owner?->name,
                'created_at' => $ticket->created_at?->toIso8601String(),
            ],
            associations: $this->compactRefs([
                $ticket->company ? ['type' => 'company', 'id' => $ticket->company->id, 'label' => $ticket->company->name] : null,
                $ticket->contact ? ['type' => 'contact', 'id' => $ticket->contact->id, 'label' => $ticket->contact->displayName()] : null,
                $ticket->deal ? ['type' => 'deal', 'id' => $ticket->deal->id, 'label' => $ticket->deal->title] : null,
            ]),
            activity: [],
            user: $user,
            model: $ticket,
            supportsActivity: false,
        );
    }

    /**
     * @param  list<array<string, mixed>|null>  $refs
     * @return list<array{type: string, id: int, label: string, hint?: string}>
     */
    private function compactRefs(array $refs): array
    {
        $out = [];

        foreach ($refs as $ref) {
            if (! is_array($ref)) {
                continue;
            }

            $type = $ref['type'] ?? null;
            $id = isset($ref['id']) ? (int) $ref['id'] : 0;
            $label = isset($ref['label']) ? trim((string) $ref['label']) : '';

            if (! in_array($type, self::TYPES, true) || $id < 1 || $label === '') {
                continue;
            }

            $item = [
                'type' => $type,
                'id' => $id,
                'label' => $label,
            ];

            if (isset($ref['hint']) && is_string($ref['hint']) && $ref['hint'] !== '') {
                $item['hint'] = $ref['hint'];
            }

            $out[] = $item;
        }

        return $out;
    }

    /**
     * @param  list<Activity>  $activity
     * @return array<string, mixed>
     */
    private function envelope(
        string $type,
        int $id,
        array $record,
        array $associations,
        array $activity,
        User $user,
        Model $model,
        bool $supportsActivity = true,
        ?array $attention = null,
    ): array {
        $presented = array_map(fn (Activity $item): array => $this->presentActivity($item), $activity);

        return [
            'type' => $type,
            'id' => $id,
            'record' => $record,
            'attention' => $attention,
            'associations' => $associations,
            'activity' => $supportsActivity ? array_slice($presented, 0, 8) : [],
            'notes' => $supportsActivity ? $this->ofType($presented, 'note') : [],
            'tasks' => $supportsActivity ? $this->ofType($presented, 'task') : [],
            'capabilities' => [
                'overview' => true,
                'activity' => $supportsActivity,
                'notes' => $supportsActivity,
                'tasks' => $supportsActivity,
                'associations' => $associations !== [],
                'actions' => true,
            ],
            'permissions' => [
                'can_view' => true,
                'can_update' => Gate::forUser($user)->allows('update', $model),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentActivity(Activity $activity): array
    {
        return [
            'id' => $activity->id,
            'type' => $activity->type,
            'subject' => $activity->subject,
            'body' => $activity->body,
            'done' => (bool) $activity->done,
            'due_at' => $activity->due_at?->toIso8601String(),
            'created_at' => $activity->created_at?->toIso8601String(),
            'owner_name' => $activity->owner?->name,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $items
     * @return list<array<string, mixed>>
     */
    private function ofType(array $items, string $type): array
    {
        return array_values(array_slice(array_filter(
            $items,
            fn (array $item): bool => ($item['type'] ?? null) === $type,
        ), 0, 5));
    }
}
