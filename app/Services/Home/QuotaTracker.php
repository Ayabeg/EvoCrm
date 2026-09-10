<?php

namespace App\Services\Home;

use App\Models\Deal;
use App\Models\SalesQuota;
use App\Models\User;
use App\Models\Workspace;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * Monthly DZD quota vs closed-won. Calendar month is always Africa/Algiers.
 * Workspace target and per-user targets are independent (not summed).
 */
class QuotaTracker
{
    public const TZ = 'Africa/Algiers';

    /**
     * @return array<string, mixed>
     */
    public function present(Workspace $workspace, ?int $ownerId = null, bool $canManage = false, ?CarbonInterface $now = null): array
    {
        $now = $now?->copy()->timezone(self::TZ) ?? now(self::TZ);
        $from = $now->copy()->startOfMonth();
        $to = $now->copy()->endOfMonth();
        $day = (int) $now->day;
        $days = (int) $now->daysInMonth;
        $elapsedPct = round($day / max($days, 1) * 100, 1);

        $won = Deal::query()
            ->forWorkspace($workspace)
            ->with(['stage', 'owner'])
            ->whereNotNull('closed_at')
            ->whereBetween('closed_at', [$from, $to])
            ->whereHas('stage', fn ($stage) => $stage->where('is_won', true))
            ->when($ownerId, fn ($query) => $query->where('owner_id', $ownerId))
            ->get();

        $quotas = SalesQuota::query()
            ->forWorkspace($workspace)
            ->when($ownerId, fn ($query) => $query->where('user_id', $ownerId))
            ->get()
            ->keyBy('user_id');

        $users = User::query()
            ->where('workspace_id', $workspace->id)
            ->when($ownerId, fn ($query) => $query->whereKey($ownerId))
            ->orderBy('name')
            ->get()
            ->keyBy('id');

        $owners = $this->ownerRows($won, $users, $quotas, $elapsedPct);

        $workspaceTarget = $ownerId
            ? $this->positiveCents($quotas->get($ownerId)?->amount_cents)
            : $this->positiveCents($workspace->monthly_quota_cents);

        $wonCents = (int) $won->sum('amount_cents');
        $wonCount = $won->count();

        $snapshot = $this->snapshot($workspaceTarget, $wonCents, $elapsedPct);

        return [
            'month' => $now->format('Y-m'),
            'label' => $now->format('F Y'),
            'timezone' => self::TZ,
            'day' => $day,
            'days' => $days,
            'elapsed_pct' => $elapsedPct,
            'target_cents' => $snapshot['target_cents'],
            'won_cents' => $wonCents,
            'won_count' => $wonCount,
            'remaining_cents' => $snapshot['remaining_cents'],
            'attainment_pct' => $snapshot['attainment_pct'],
            'expected_cents' => $snapshot['expected_cents'],
            'status' => $snapshot['status'],
            'can_manage' => $canManage,
            'settings_href' => '/settings/quotas',
            'owners' => $owners,
        ];
    }

    /**
     * @param  Collection<int, Deal>  $won
     * @param  Collection<int, User>  $users
     * @param  Collection<int, SalesQuota>  $quotas
     * @return list<array<string, mixed>>
     */
    protected function ownerRows(Collection $won, Collection $users, Collection $quotas, float $elapsedPct): array
    {
        $ids = $quotas->keys()
            ->merge($won->pluck('owner_id')->filter())
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $rows = $ids->map(function ($userId) use ($won, $users, $quotas, $elapsedPct) {
            $userWon = $won->where('owner_id', $userId);
            $target = $this->positiveCents($quotas->get($userId)?->amount_cents);
            $snapshot = $this->snapshot($target, (int) $userWon->sum('amount_cents'), $elapsedPct);

            return [
                'user_id' => (int) $userId,
                'name' => $users->get($userId)?->name ?? 'Unknown',
                'target_cents' => $snapshot['target_cents'],
                'won_cents' => (int) $userWon->sum('amount_cents'),
                'won_count' => $userWon->count(),
                'remaining_cents' => $snapshot['remaining_cents'],
                'attainment_pct' => $snapshot['attainment_pct'],
                'expected_cents' => $snapshot['expected_cents'],
                'status' => $snapshot['status'],
            ];
        });

        $unassigned = $won->whereNull('owner_id');
        if ($unassigned->isNotEmpty()) {
            $snapshot = $this->snapshot(null, (int) $unassigned->sum('amount_cents'), $elapsedPct);
            $rows->push([
                'user_id' => null,
                'name' => 'Unassigned',
                'target_cents' => null,
                'won_cents' => (int) $unassigned->sum('amount_cents'),
                'won_count' => $unassigned->count(),
                'remaining_cents' => $snapshot['remaining_cents'],
                'attainment_pct' => $snapshot['attainment_pct'],
                'expected_cents' => $snapshot['expected_cents'],
                'status' => 'no_target',
            ]);
        }

        return $rows
            ->sortByDesc('won_cents')
            ->values()
            ->all();
    }

    /**
     * @return array{
     *     target_cents: int|null,
     *     remaining_cents: int|null,
     *     attainment_pct: float|null,
     *     expected_cents: int|null,
     *     status: string
     * }
     */
    protected function snapshot(?int $targetCents, int $wonCents, float $elapsedPct): array
    {
        if ($targetCents === null) {
            return [
                'target_cents' => null,
                'remaining_cents' => null,
                'attainment_pct' => null,
                'expected_cents' => null,
                'status' => 'no_target',
            ];
        }

        $expected = (int) round($targetCents * $elapsedPct / 100);
        $attainment = round($wonCents / max($targetCents, 1) * 100, 1);
        $status = 'behind';

        if ($wonCents >= $targetCents) {
            $status = 'hit';
        } elseif ($wonCents >= $expected) {
            $status = 'on_track';
        }

        return [
            'target_cents' => $targetCents,
            'remaining_cents' => max(0, $targetCents - $wonCents),
            'attainment_pct' => $attainment,
            'expected_cents' => $expected,
            'status' => $status,
        ];
    }

    protected function positiveCents(mixed $value): ?int
    {
        if ($value === null || $value === '' || (int) $value <= 0) {
            return null;
        }

        return (int) $value;
    }
}
