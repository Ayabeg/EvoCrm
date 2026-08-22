<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\Quote;
use App\Services\Crm\QuoteTotals;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function store(Request $request, Deal $deal, QuoteTotals $totals): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'status' => ['nullable', 'in:draft,sent,accepted'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.name' => ['required', 'string', 'max:180'],
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
        ]);

        $totals->sync($quote, $data['items']);

        return back();
    }

    public function update(Request $request, Quote $quote, QuoteTotals $totals): RedirectResponse
    {
        abort_unless((int) $quote->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'status' => ['nullable', 'in:draft,sent,accepted'],
            'notes' => ['nullable', 'string'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.name' => ['required_with:items', 'string', 'max:180'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1'],
            'items.*.unit_dzd' => ['nullable', 'numeric', 'min:0'],
            'items.*.unit_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $quote->fill([
            'status' => $data['status'] ?? $quote->status,
            'notes' => $data['notes'] ?? $quote->notes,
        ])->save();

        if (! empty($data['items'])) {
            $totals->sync($quote, $data['items']);
        }

        return back();
    }
}
