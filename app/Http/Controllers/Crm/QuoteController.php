<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\Quote;
use App\Services\Crm\QuoteDocument;
use App\Services\Crm\QuoteMailer;
use App\Services\Crm\QuoteTotals;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class QuoteController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $workspace = $request->user()->workspace;

        $quotes = Quote::query()
            ->forWorkspace($workspace)
            ->with(['deal:id,title'])
            ->latest('id')
            ->limit(50)
            ->get()
            ->map(fn (Quote $quote): array => [
                'id' => $quote->id,
                'status' => $quote->status,
                'total_cents' => $quote->total_cents,
                'deal' => $quote->deal ? [
                    'id' => $quote->deal->id,
                    'title' => $quote->deal->title,
                ] : null,
            ]);

        return Inertia::render('crm/quotes/index', [
            'quotes' => $quotes,
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
}
