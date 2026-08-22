<?php

namespace App\Support;

use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
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
     * @return array<string, mixed>
     */
    public function attributeBag(Workspace $workspace, string $entity, int $entityId): array
    {
        return [
            'definitions' => $this->attributes->definitions($workspace, $entity)->values(),
            'values' => $this->attributes->valuesFor($workspace, $entity, $entityId),
        ];
    }
}
