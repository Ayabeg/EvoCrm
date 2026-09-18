<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\Quote;
use App\Models\User;
use App\Services\Crm\CrmFilter;
use App\Services\Crm\QuoteDocument;
use App\Services\Crm\QuoteMailer;
use App\Services\Crm\QuoteTotals;
use App\Support\CrmHub;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class QuoteController extends Controller
{
    public function index(Request $request, CrmFilter $filter, CrmHub $hub): InertiaResponse
    {
        /** @var User $user */
        $user = $request->user();
        $workspace = $user->workspace;

        $query = Quote::query()
            ->forWorkspace($workspace)
            ->with(['deal:id,title,owner_id,contact_id', 'deal.owner:id,name', 'deal.contact:id,first_name,last_name']);

        $this->constrain($query, $request);
        $query->latest('id');
        [$rows, $paginator] = $filter->paginate($query, $request);

        return Inertia::render('crm/quotes/index', [
            'quotes' => $rows->map(fn (Quote $quote): array => $this->presentList($quote))->values()->all(),
            'deals' => Deal::query()
                ->forWorkspace($workspace)
                ->orderBy('title')
                ->get(['id', 'title']),
            'members' => $hub->members($workspace),
            'savedFilters' => [],
            'activeFilters' => [
                'view' => $request->input('view', 'all'),
                'status' => $request->input('status'),
                'owner' => $request->input('owner'),
                'created' => $request->input('created'),
                'q' => $request->input('q'),
            ],
            'listView' => $hub->listViewMeta('quote'),
            'recordCount' => $paginator['total'],
            'paginator' => $paginator,
            'createOpen' => $request->boolean('create'),
            'can' => [
                'create' => $user->can('create', Quote::class),
            ],
        ]);
    }

    public function show(Request $request, Quote $quote): InertiaResponse
    {
        $this->authorize('view', $quote);
        abort_unless((int) $quote->workspace_id === (int) $request->user()->workspace_id, 404);

        $quote->load(['items', 'deal.owner:id,name', 'deal.contact:id,first_name,last_name,email', 'deal.company:id,name']);

        /** @var User $user */
        $user = $request->user();

        return Inertia::render('crm/quotes/show', [
            'quote' => $this->presentRecord($quote, $user),
        ]);
    }

    public function store(Request $request, Deal $deal, QuoteTotals $totals): RedirectResponse
    {
        $this->authorize('update', $deal);
        $this->authorize('create', Quote::class);

        $data = $request->validate([
            'status' => ['nullable', 'in:draft,sent,accepted'],
            'notes' => ['nullable', 'string'],
            'expires_at' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer'],
            'items.*.name' => ['required_without:items.*.product_id', 'nullable', 'string', 'max:180'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_dzd' => ['nullable', 'numeric', 'min:0'],
            'items.*.unit_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $quote = Quote::query()->create([
            'workspace_id' => $deal->workspace_id,
            'deal_id' => $deal->id,
            'status' => $data['status'] ?? 'draft',
            'currency' => 'DZD',
            'notes' => $data['notes'] ?? null,
            'expires_at' => $data['expires_at'] ?? null,
        ]);

        $totals->sync($quote, $data['items']);

        return back();
    }

    public function update(Request $request, Quote $quote, QuoteTotals $totals): RedirectResponse
    {
        $this->authorize('update', $quote);
        abort_if($quote->isImmutable(), 422, 'Sent quotes cannot be edited.');

        $data = $request->validate([
            'status' => ['nullable', 'in:draft,sent,accepted'],
            'notes' => ['nullable', 'string'],
            'expires_at' => ['nullable', 'date'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer'],
            'items.*.name' => ['required_without:items.*.product_id', 'nullable', 'string', 'max:180'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_dzd' => ['nullable', 'numeric', 'min:0'],
            'items.*.unit_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $quote->fill([
            'status' => $data['status'] ?? $quote->status,
            'notes' => $data['notes'] ?? $quote->notes,
            'expires_at' => $data['expires_at'] ?? $quote->expires_at,
        ])->save();

        if (! empty($data['items'])) {
            $totals->sync($quote, $data['items']);
        }

        return back();
    }

    public function preview(Request $request, Quote $quote, QuoteDocument $documents): Response
    {
        abort_unless((int) $quote->workspace_id === (int) $request->user()->workspace_id, 404);

        return response($documents->pdf($quote), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="quote-'.$quote->id.'.pdf"',
        ]);
    }

    public function send(Request $request, Quote $quote, QuoteMailer $mailer): RedirectResponse
    {
        abort_unless((int) $quote->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'to' => ['nullable', 'email'],
        ]);

        $to = $data['to'] ?? $quote->deal?->contact?->email;
        abort_unless(filled($to), 422);

        $mailer->send($quote, $request->user(), (string) $to);

        return back();
    }

    public function revoke(Request $request, Quote $quote): RedirectResponse
    {
        abort_unless((int) $quote->workspace_id === (int) $request->user()->workspace_id, 404);

        $quote->forceFill(['revoked_at' => now()])->save();

        return back();
    }

    /**
     * @param  Builder<Quote>  $query
     */
    protected function constrain(Builder $query, Request $request): void
    {
        $view = (string) $request->input('view', 'all');
        $status = $request->string('status')->toString();
        $owner = $request->input('owner');
        $created = $request->string('created')->toString();

        if (in_array($status, ['draft', 'sent', 'accepted'], true)) {
            $query->where('status', $status);
        }

        if ($view === 'my') {
            $query->whereHas('deal', fn (Builder $deal) => $deal->where('owner_id', $request->user()->id));
        }

        if ($owner === 'unassigned') {
            $query->whereHas('deal', fn (Builder $deal) => $deal->whereNull('owner_id'));
        } elseif (is_numeric($owner) && (int) $owner > 0) {
            $query->whereHas('deal', fn (Builder $deal) => $deal->where('owner_id', (int) $owner));
        }

        if ($created === 'today') {
            $query->whereDate('created_at', now());
        } elseif (in_array($created, ['7d', '30d', '90d'], true)) {
            $query->where('created_at', '>=', now()->subDays((int) $created));
        }

        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where(function (Builder $inner) use ($q): void {
                $inner->where('id', $q)
                    ->orWhereHas('deal', fn (Builder $deal) => $deal->where('title', 'like', '%'.$q.'%'));
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function presentList(Quote $quote): array
    {
        return [
            'id' => $quote->id,
            'title' => $quote->deal?->title ?? 'Quote #'.$quote->id,
            'status' => $quote->status,
            'status_label' => $this->statusLabel($quote->status),
            'total_cents' => $quote->total_cents,
            'created_at' => $quote->created_at?->toIso8601String(),
            'expires_at' => $quote->expires_at?->toIso8601String(),
            'sent_at' => $quote->sent_at?->toIso8601String(),
            'owner' => $quote->deal?->owner ? [
                'id' => $quote->deal->owner->id,
                'name' => $quote->deal->owner->name,
            ] : null,
            'deal' => $quote->deal ? [
                'id' => $quote->deal->id,
                'title' => $quote->deal->title,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function presentRecord(Quote $quote, User $user): array
    {
        return [
            'id' => $quote->id,
            'title' => $quote->deal?->title ?? 'Quote #'.$quote->id,
            'status' => $quote->status,
            'status_label' => $this->statusLabel($quote->status),
            'currency' => $quote->currency,
            'total_cents' => $quote->total_cents,
            'notes' => $quote->notes,
            'created_at' => $quote->created_at?->toIso8601String(),
            'expires_at' => $quote->expires_at?->toIso8601String(),
            'sent_at' => $quote->sent_at?->toIso8601String(),
            'accepted_at' => $quote->accepted_at?->toIso8601String(),
            'revoked_at' => $quote->revoked_at?->toIso8601String(),
            'public_url' => $quote->tokenIsUsable() ? url('/q/'.$quote->public_token) : null,
            'immutable' => $quote->isImmutable(),
            'can' => [
                'update' => $user->can('update', $quote),
            ],
            'owner' => $quote->deal?->owner ? [
                'id' => $quote->deal->owner->id,
                'name' => $quote->deal->owner->name,
            ] : null,
            'deal' => $quote->deal ? [
                'id' => $quote->deal->id,
                'title' => $quote->deal->title,
            ] : null,
            'contact' => $quote->deal?->contact ? [
                'id' => $quote->deal->contact->id,
                'first_name' => $quote->deal->contact->first_name,
                'last_name' => $quote->deal->contact->last_name,
                'email' => $quote->deal->contact->email,
            ] : null,
            'company' => $quote->deal?->company ? [
                'id' => $quote->deal->company->id,
                'name' => $quote->deal->company->name,
            ] : null,
            'items' => $quote->items->map(fn ($item): array => [
                'id' => $item->id,
                'name' => $item->name,
                'quantity' => $item->quantity,
                'unit_cents' => $item->unit_cents,
                'total_cents' => $item->total_cents,
            ])->values()->all(),
        ];
    }

    protected function statusLabel(?string $status): string
    {
        return match ($status) {
            'draft' => 'Draft',
            'sent' => 'Sent',
            'accepted' => 'Accepted',
            default => $status ? ucfirst($status) : 'Draft',
        };
    }
}
