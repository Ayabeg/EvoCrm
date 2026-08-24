<?php

namespace App\Support;

use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Message;
use App\Models\SavedFilter;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Crm\CustomAttributes;

class CrmHub
{
    public function __construct(private CustomAttributes $attributes) {}

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
     * @return array<string, mixed>
     */
    public function filters(Workspace $workspace, string $entity): array
    {
        return SavedFilter::query()
            ->forWorkspace($workspace)
            ->where('entity', $entity)
            ->orderBy('name')
            ->get()
            ->all();
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
            'threads.channel',
            'enrollments.sequence',
        ]);

        return [
            'company' => $contact->company,
            'deals' => $contact->deals,
            'leads' => $contact->leads,
            'threads' => $contact->threads,
            'enrollments' => $contact->enrollments,
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
        ]);

        return [
            'contact' => $deal->contact,
            'company' => $deal->company,
            'lead' => $deal->lead,
            'threads' => $deal->contact?->threads ?? [],
            'enrollments' => $deal->contact?->enrollments ?? [],
            'quotes' => $deal->quotes,
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
     * @return array<int, Activity>
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

        return $query->limit(80)->get()->all();
    }

    /**
     * Recent inbound desk messages vs outbound activity for a contact.
     *
     * @return array{inbound: array<int, array<string, mixed>>, outbound: array<int, array<string, mixed>>}
     */
    public function catchUp(Contact $contact): array
    {
        $messages = Message::query()
            ->where('contact_id', $contact->id)
            ->latest()
            ->limit(24)
            ->get();

        $inbound = $messages
            ->where('direction', 'inbound')
            ->take(6)
            ->values()
            ->map(fn (Message $message) => [
                'id' => 'msg-'.$message->id,
                'label' => $message->body ?: 'Inbound message',
                'at' => $message->created_at?->toIso8601String(),
                'source' => 'inbound',
            ])
            ->all();

        $outboundMessages = $messages
            ->where('direction', 'outbound')
            ->take(6)
            ->values()
            ->map(fn (Message $message) => [
                'id' => 'msg-'.$message->id,
                'label' => $message->body ?: 'Outbound message',
                'at' => $message->created_at?->toIso8601String(),
                'source' => 'outbound',
            ]);

        $outboundActivities = Activity::query()
            ->where('contact_id', $contact->id)
            ->whereIn('type', ['email', 'sequence', 'call', 'note'])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Activity $activity) => [
                'id' => 'act-'.$activity->id,
                'label' => $activity->subject ?? $activity->body ?? $activity->type,
                'at' => $activity->created_at?->toIso8601String(),
                'source' => $activity->type,
            ]);

        return [
            'inbound' => $inbound,
            'outbound' => $outboundMessages->concat($outboundActivities)->take(8)->values()->all(),
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
