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
            'product_id' => ['required', 'integer'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'unit_dzd' => ['nullable', 'numeric', 'min:0'],
            'unit_cents' => ['nullable', 'integer', 'min:0'],
        ]);

        $product = Product::query()
            ->forWorkspace($deal->workspace_id)
            ->active()
            ->findOrFail($data['product_id']);

        $totals->add($deal, $data, $product);

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
