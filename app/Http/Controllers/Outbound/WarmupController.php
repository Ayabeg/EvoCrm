<?php

namespace App\Http\Controllers\Outbound;

use App\Http\Controllers\Controller;
use App\Models\Mailbox;
use App\Models\OutboundMessage;
use App\Services\Outbound\WarmupPlanner;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class WarmupController extends Controller
{
    /**
     * The warmup dashboard: every sendable box (enabled, non-system unless
     * opted in) with its plan day, today's cap, sent/remaining, fail rate,
     * the sent-vs-cap EvoViz history, and tomorrow's cap preview.
     */
    public function index(Request $request, WarmupPlanner $planner): Response
    {
        $workspace = $request->user()->workspace;

        $mailboxes = Mailbox::query()
            ->forWorkspace($workspace)
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->get();

        $sendable = $planner->sendable($mailboxes);

        return Inertia::render('outbound/warmup', [
            'mailboxes' => $sendable->map(fn (Mailbox $box) => $this->row($box, $planner)),
            'systemMailboxes' => $mailboxes
                ->filter(fn (Mailbox $box) => $planner->isSystemAddress($box->from_address))
                ->map(fn (Mailbox $box) => [
                    'id' => $box->id,
                    'name' => $box->name,
                    'from_address' => $box->from_address,
                    'enabled' => $box->enabled,
                    'opted_in' => $box->warmup_opted_in,
                ])
                ->values(),
            'ramp' => WarmupPlanner::RAMP,
            'defaultCeiling' => WarmupPlanner::DEFAULT_CEILING,
            'summary' => [
                'warming' => $sendable->filter(fn (Mailbox $box) => $box->warming())->count(),
                'active' => $sendable->filter(fn (Mailbox $box) => $box->effectiveStatus() === 'active')->count(),
                'sent_today' => $sendable->sum(fn (Mailbox $box) => $box->sentToday()),
                'cap_today' => $sendable->sum('daily_limit'),
            ],
        ]);
    }

    /**
     * Warmup on/off. On drops the box to day 1 of the ramp; off marks it
     * active at its full ceiling. Disabled boxes can't start warmup.
     */
    public function toggle(Request $request, Mailbox $mailbox, WarmupPlanner $planner): RedirectResponse
    {
        abort_unless((int) $mailbox->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_if(! $mailbox->enabled, 422, 'Enable the mailbox under Outbound → Mailboxes first.');

        if ($mailbox->warming()) {
            $planner->stop($mailbox);
        } else {
            $planner->start($mailbox);
        }

        return back();
    }

    /** Operator settings: the ceiling the ramp holds at, and peer-ping opt-in. */
    public function update(Request $request, Mailbox $mailbox): RedirectResponse
    {
        abort_unless((int) $mailbox->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'warmup_ceiling' => ['required', 'integer', 'min:1', 'max:10000'],
            'warmup_peers' => ['nullable', 'boolean'],
        ]);

        $mailbox->forceFill([
            'warmup_ceiling' => $data['warmup_ceiling'],
            'warmup_peers' => (bool) ($data['warmup_peers'] ?? false),
        ])->save();

        // A ceiling cut below today's ramp cap clamps the cap honestly.
        if ($mailbox->warming() && $mailbox->daily_limit > $mailbox->warmup_ceiling) {
            $mailbox->forceFill(['daily_limit' => $mailbox->warmup_ceiling])->save();
        }

        return back();
    }

    /** System roles (abuse@, dmarc@, postmaster@, noreply@) join warmup only by explicit opt-in. */
    public function include(Request $request, Mailbox $mailbox, WarmupPlanner $planner): RedirectResponse
    {
        abort_unless((int) $mailbox->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless($planner->isSystemAddress($mailbox->from_address), 404);

        $mailbox->forceFill(['warmup_opted_in' => ! $mailbox->warmup_opted_in])->save();

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function row(Mailbox $box, WarmupPlanner $planner): array
    {
        $sentToday = $box->sentToday();
        $warming = $box->warming();

        return [
            'id' => $box->id,
            'name' => $box->name,
            'from_name' => $box->from_name,
            'from_address' => $box->from_address,
            'effective_status' => $box->effectiveStatus(),
            'is_system' => $planner->isSystemAddress($box->from_address),
            'warming' => $warming,
            'day' => $warming ? max(1, $box->warmup_day) : null,
            'cap' => $box->daily_limit,
            'sent_today' => $sentToday,
            'remaining' => max(0, $box->daily_limit - $sentToday),
            'ceiling' => $planner->ceiling($box),
            'peers' => $box->warmup_peers,
            'fail_rate' => $box->failRate(14),
            'next_cap' => $warming ? $planner->nextCap($box) : null,
            'chart' => $this->chart($box, $planner),
        ];
    }

    /**
     * evoviz.line — sent vs daily cap over the last 14 Algiers days. The cap
     * line is derived, never logged: for a warming box it is the ramp value
     * of the plan day each date (the pre-warmup limit before day 1); for any
     * other box it is the current daily_limit. Hidden when there were no
     * sends and no ramp is running — nothing honest to draw.
     *
     * @return array<string, mixed>|null
     */
    private function chart(Mailbox $box, WarmupPlanner $planner): ?array
    {
        $days = collect(range(13, 0))
            ->map(fn (int $ago) => now(WarmupPlanner::TIMEZONE)->subDays($ago)->startOfDay());

        $sent = OutboundMessage::query()
            ->where('mailbox_id', $box->id)
            ->where('direction', 'out')
            ->where('status', 'sent')
            ->where('sent_at', '>=', $days->first())
            ->get(['sent_at'])
            ->map(fn (OutboundMessage $message) => $message->sent_at)
            ->filter()
            ->map(fn ($sentAt) => Carbon::parse($sentAt)
                ->setTimezone(WarmupPlanner::TIMEZONE)
                ->toDateString())
            ->countBy();

        $sentData = $days->map(fn (CarbonInterface $day) => (int) $sent->get($day->toDateString(), 0));

        if ($sentData->sum() === 0 && ! $box->warming()) {
            return null;
        }

        $startDay = $box->warmup_started_at
            ? Carbon::parse($box->warmup_started_at)->setTimezone(WarmupPlanner::TIMEZONE)->startOfDay()
            : null;

        $capData = $days->map(function (CarbonInterface $day, int $index) use ($box, $planner, $startDay) {
            if ($box->warming() && $startDay && $day->gte($startDay)) {
                $planDay = max(1, $box->warmup_day - (13 - $index));

                return $planner->capForDay($planDay, $planner->ceiling($box));
            }

            if ($box->warming()) {
                return $box->warmup_previous_limit ?? $box->daily_limit;
            }

            return $box->daily_limit;
        });

        return [
            'id' => 'evoviz.line',
            'title' => 'Sent vs cap — last 14 days',
            'labels' => $days->map(fn (CarbonInterface $day) => $day->format('d/m'))->all(),
            'series' => [
                ['name' => 'Sent', 'data' => $sentData->all(), 'tone' => 'mark'],
                ['name' => 'Daily cap', 'data' => $capData->all(), 'tone' => 'mute'],
            ],
        ];
    }
}
