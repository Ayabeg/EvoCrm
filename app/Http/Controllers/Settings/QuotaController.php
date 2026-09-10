<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SalesQuota;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuotaController extends Controller
{
    public function edit(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $quotas = SalesQuota::query()
            ->forWorkspace($workspace)
            ->get()
            ->keyBy('user_id');

        return Inertia::render('settings/quotas', [
            'workspace_amount_dzd' => $this->centsToDzd($workspace->monthly_quota_cents),
            'timezone' => 'Africa/Algiers',
            'month_label' => now('Africa/Algiers')->format('F Y'),
            'people' => User::query()
                ->where('workspace_id', $workspace->id)
                ->orderByRaw("case role when 'owner' then 0 when 'admin' then 1 else 2 end")
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role->value,
                    'amount_dzd' => $this->centsToDzd($quotas->get($user->id)?->amount_cents),
                ])
                ->values()
                ->all(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $workspace = $request->user()->workspace;

        $data = $request->validate([
            'workspace_amount_dzd' => ['nullable', 'numeric', 'min:0', 'max:999999999999'],
            'people' => ['nullable', 'array'],
            'people.*.id' => ['required', 'integer'],
            'people.*.amount_dzd' => ['nullable', 'numeric', 'min:0', 'max:999999999999'],
        ]);

        $workspace->forceFill([
            'monthly_quota_cents' => $this->dzdToCents($data['workspace_amount_dzd'] ?? null),
        ])->save();

        $ids = User::query()
            ->where('workspace_id', $workspace->id)
            ->pluck('id')
            ->all();

        foreach ($data['people'] ?? [] as $row) {
            $userId = (int) $row['id'];
            if (! in_array($userId, $ids, true)) {
                continue;
            }

            $cents = $this->dzdToCents($row['amount_dzd'] ?? null);

            if ($cents === null) {
                SalesQuota::query()
                    ->forWorkspace($workspace)
                    ->where('user_id', $userId)
                    ->delete();

                continue;
            }

            SalesQuota::query()->updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'user_id' => $userId,
                ],
                ['amount_cents' => $cents],
            );
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Monthly quotas saved. Home uses the current Africa/Algiers calendar month.',
        ]);

        return redirect()->route('settings.quotas');
    }

    protected function dzdToCents(mixed $dzd): ?int
    {
        if ($dzd === null || $dzd === '') {
            return null;
        }

        $cents = (int) round(((float) $dzd) * 100);

        return $cents > 0 ? $cents : null;
    }

    protected function centsToDzd(mixed $cents): ?int
    {
        if ($cents === null || (int) $cents <= 0) {
            return null;
        }

        return (int) round(((int) $cents) / 100);
    }
}
