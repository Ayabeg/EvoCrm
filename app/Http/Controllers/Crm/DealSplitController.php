<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\DealSplit;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DealSplitController extends Controller
{
    public function update(Request $request, Deal $deal): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless($request->user()->role->canManageSettings(), 403);

        $data = $request->validate([
            'splits' => ['required', 'array', 'min:1'],
            'splits.*.user_id' => ['required', 'integer'],
            'splits.*.percent' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $total = collect($data['splits'])->sum('percent');
        abort_unless($total === 100, 422);

        $deal->splits()->delete();

        foreach ($data['splits'] as $row) {
            User::query()
                ->where('workspace_id', $deal->workspace_id)
                ->findOrFail($row['user_id']);

            DealSplit::query()->create([
                'deal_id' => $deal->id,
                'user_id' => $row['user_id'],
                'percent' => $row['percent'],
                'amount_cents' => (int) round(((int) $deal->amount_cents) * ($row['percent'] / 100)),
            ]);
        }

        return back();
    }
}
