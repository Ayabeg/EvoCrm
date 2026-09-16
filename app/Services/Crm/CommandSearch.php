<?php

namespace App\Services\Crm;

use App\Models\Activity;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;

class CommandSearch
{
    public const PER_TYPE = 6;

    public const MAX_TOTAL = 30;

    /**
     * Permission-safe bounded record search. Compact payload only —
     * no emails, phones, amounts, activity bodies, or other-workspace rows.
     *
     * @return list<array{type: string, id: int, label: string, href: string, recordRef?: array{type: string, id: int}}>
     */
    public function search(User $user, string $query): array
    {
        $workspace = $user->workspace;
        $term = trim($query);

        if (! $workspace instanceof Workspace || $term === '') {
            return [];
        }

        $term = mb_substr($term, 0, 80);
        $like = '%'.addcslashes($term, '%_\\').'%';

        return collect()
            ->concat($this->contacts($user, $workspace, $like, $term))
            ->concat($this->companies($user, $workspace, $like))
            ->concat($this->leads($user, $workspace, $like))
            ->concat($this->deals($user, $workspace, $like))
            ->concat($this->quotes($user, $workspace, $like, $term))
            ->concat($this->activities($user, $workspace, $like))
            ->take(self::MAX_TOTAL)
            ->values()
            ->all();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function contacts(User $user, Workspace $workspace, string $like, string $term): Collection
    {
        $tokens = preg_split('/\s+/', $term) ?: [];

        return Contact::query()
            ->forWorkspace($workspace)
            ->where(function (Builder $inner) use ($like, $tokens): void {
                $inner->where('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like)
                    ->orWhere('email', 'like', $like);

                foreach ($tokens as $token) {
                    if ($token === '') {
                        continue;
                    }

                    $tokenLike = '%'.addcslashes($token, '%_\\').'%';
                    $inner->orWhere('first_name', 'like', $tokenLike)
                        ->orWhere('last_name', 'like', $tokenLike);
                }
            })
            ->orderByDesc('id')
            ->limit(self::PER_TYPE)
            ->get(['id', 'first_name', 'last_name', 'workspace_id'])
            ->filter(fn (Contact $row): bool => $this->visible($user, $row))
            ->map(fn (Contact $row): array => $this->hit(
                'contact',
                $row->id,
                $row->displayName(),
                '/crm/contacts/'.$row->id,
            ))
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function companies(User $user, Workspace $workspace, string $like): Collection
    {
        return Company::query()
            ->forWorkspace($workspace)
            ->where('name', 'like', $like)
            ->orderByDesc('id')
            ->limit(self::PER_TYPE)
            ->get(['id', 'name', 'workspace_id'])
            ->filter(fn (Company $row): bool => $this->visible($user, $row))
            ->map(fn (Company $row): array => $this->hit(
                'company',
                $row->id,
                (string) $row->name,
                '/crm/companies/'.$row->id,
            ))
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function leads(User $user, Workspace $workspace, string $like): Collection
    {
        return Lead::query()
            ->forWorkspace($workspace)
            ->where('title', 'like', $like)
            ->orderByDesc('id')
            ->limit(self::PER_TYPE)
            ->get(['id', 'title', 'workspace_id'])
            ->filter(fn (Lead $row): bool => $this->visible($user, $row))
            ->map(fn (Lead $row): array => $this->hit(
                'lead',
                $row->id,
                $row->title ?: 'Lead #'.$row->id,
                '/crm/leads/'.$row->id,
            ))
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function deals(User $user, Workspace $workspace, string $like): Collection
    {
        return Deal::query()
            ->forWorkspace($workspace)
            ->where('title', 'like', $like)
            ->orderByDesc('id')
            ->limit(self::PER_TYPE)
            ->get(['id', 'title', 'workspace_id'])
            ->filter(fn (Deal $row): bool => $this->visible($user, $row))
            ->map(fn (Deal $row): array => $this->hit(
                'deal',
                $row->id,
                (string) $row->title,
                '/crm/deals/'.$row->id,
            ))
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function quotes(User $user, Workspace $workspace, string $like, string $term): Collection
    {
        $numericId = ctype_digit($term) ? (int) $term : null;

        return Quote::query()
            ->forWorkspace($workspace)
            ->with(['deal:id,title,workspace_id'])
            ->where(function (Builder $inner) use ($like, $numericId): void {
                $inner->where('status', 'like', $like)
                    ->orWhereHas(
                        'deal',
                        fn (Builder $deal): Builder => $deal->where('title', 'like', $like),
                    );

                if ($numericId) {
                    $inner->orWhere('quotes.id', $numericId);
                }
            })
            ->orderByDesc('id')
            ->limit(self::PER_TYPE)
            ->get(['id', 'status', 'deal_id', 'workspace_id'])
            ->filter(fn (Quote $row): bool => $this->visible($user, $row))
            ->map(fn (Quote $row): array => $this->hit(
                'quote',
                $row->id,
                $row->deal?->title ?: 'Quote #'.$row->id,
                '/crm/quotes/'.$row->id,
            ))
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function activities(User $user, Workspace $workspace, string $like): Collection
    {
        return Activity::query()
            ->forWorkspace($workspace)
            ->with([
                'deal:id,title,workspace_id',
                'contact:id,first_name,last_name,workspace_id',
                'company:id,name,workspace_id',
            ])
            ->where('subject', 'like', $like)
            ->orderByDesc('id')
            ->limit(self::PER_TYPE)
            ->get(['id', 'subject', 'contact_id', 'company_id', 'deal_id', 'workspace_id'])
            ->filter(fn (Activity $row): bool => $this->visible($user, $row))
            ->map(function (Activity $row) use ($user): array {
                $related = $this->relatedRecord($user, $row);

                $hit = [
                    'type' => 'activity',
                    'id' => $row->id,
                    'label' => $row->subject ?: 'Activity',
                    'href' => $related['href'],
                ];

                if ($related['recordRef'] !== null) {
                    $hit['recordRef'] = $related['recordRef'];
                }

                return $hit;
            })
            ->values();
    }

    /**
     * @return array{href: string, recordRef: array{type: string, id: int}|null}
     */
    private function relatedRecord(User $user, Activity $activity): array
    {
        if ($activity->deal instanceof Deal && $this->visible($user, $activity->deal)) {
            return [
                'href' => '/crm/deals/'.$activity->deal->id,
                'recordRef' => ['type' => 'deal', 'id' => $activity->deal->id],
            ];
        }

        if ($activity->contact instanceof Contact && $this->visible($user, $activity->contact)) {
            return [
                'href' => '/crm/contacts/'.$activity->contact->id,
                'recordRef' => ['type' => 'contact', 'id' => $activity->contact->id],
            ];
        }

        if ($activity->company instanceof Company && $this->visible($user, $activity->company)) {
            return [
                'href' => '/crm/companies/'.$activity->company->id,
                'recordRef' => ['type' => 'company', 'id' => $activity->company->id],
            ];
        }

        return [
            'href' => '/crm/activities',
            'recordRef' => null,
        ];
    }

    /**
     * @return array{type: string, id: int, label: string, href: string, recordRef: array{type: string, id: int}}
     */
    private function hit(string $type, int $id, string $label, string $href): array
    {
        return [
            'type' => $type,
            'id' => $id,
            'label' => $label,
            'href' => $href,
            'recordRef' => [
                'type' => $type,
                'id' => $id,
            ],
        ];
    }

    private function visible(User $user, Model $record): bool
    {
        return Gate::forUser($user)->allows('view', $record);
    }
}
