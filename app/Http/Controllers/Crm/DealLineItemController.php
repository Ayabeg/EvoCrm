<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\DealLineItem;
use App\Models\Product;
use App\Services\Crm\DealLineTotals;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DealLineItemController extends Controller
{
    public function store(Request $request, Deal $deal, DealLineTotals $totals): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'product_id' => ['nullable', 'integer'],
            'name' => ['required_without:product_id', 'nullable', 'string', 'max:180'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'unit_dzd' => ['nullable', 'numeric', 'min:0'],
            'unit_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $product = filled($data['product_id'] ?? null)
            ? Product::query()
                ->forWorkspace($deal->workspace_id)
                ->active()
                ->whereKey($data['product_id'])
                ->firstOrFail()
            : null;

        $totals->add($deal, $data, $product);

        return back();
    }

    public function update(Request $request, Deal $deal, DealLineItem $lineItem, DealLineTotals $totals): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless((int) $lineItem->deal_id === (int) $deal->id, 404);

        $data = $request->validate([
            'product_id' => ['nullable', 'integer'],
            'name' => ['nullable', 'string', 'max:180'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'unit_dzd' => ['nullable', 'numeric', 'min:0'],
            'unit_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $product = filled($data['product_id'] ?? null)
            ? Product::query()
                ->forWorkspace($deal->workspace_id)
                ->active()
                ->whereKey($data['product_id'])
                ->firstOrFail()
            : $lineItem->product;

        $totals->update($lineItem, $data, $product);

        return back();
    }

    public function destroy(Request $request, Deal $deal, DealLineItem $lineItem, DealLineTotals $totals): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless((int) $lineItem->deal_id === (int) $deal->id, 404);

        $totals->remove($lineItem);

        return back();
    }
}
