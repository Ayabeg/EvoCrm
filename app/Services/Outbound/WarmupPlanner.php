<?php

namespace App\Services\Outbound;

use App\Models\Contact;
use App\Models\Mailbox;
use App\Models\Workspace;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * The warmup ramp engine. A warming mailbox climbs a conservative daily-cap
 * ladder — 8, 12, 18, 25, 35, 45 — then holds at the ceiling the operator
 * set on the box (default 40). The outbound:warmup scheduler command calls
 * advance() once per Africa/Algiers day; the dashboard reads the same math
 * for the "tomorrow's cap" preview.
 *
 * There is no third-party warmup network here: the optional peer pings only
 * ever run between the workspace's own enabled, non-system mailboxes.
 */
class WarmupPlanner
{
    public const TIMEZONE = 'Africa/Algiers';

    /** @var array<int, int> */
    public const RAMP = [8, 12, 18, 25, 35, 45];

    public const DEFAULT_CEILING = 40;

    /** Local parts that stay out of warmup unless the operator opts them in. */
    public const SYSTEM_ROLES = ['abuse', 'dmarc', 'postmaster', 'noreply'];

    /** Peer pings per sender per day never exceed this, however big the cap. */
    public const MAX_PEER_PINGS_PER_SENDER = 3;

    public function __construct(
        private OutboundDispatcher $dispatcher,
        private QuietHoursGuard $quietHours,
    ) {}

    /**
     * Cap for a plan day: the ramp step while climbing, the ceiling once the
     * ramp is done — and never above the ceiling either way.
     */
    public function capForDay(int $day, int $ceiling = self::DEFAULT_CEILING): int
    {
        $day = max(1, $day);
        $ceiling = max(1, $ceiling);

        $target = $day <= count(self::RAMP)
            ? self::RAMP[$day - 1]
            : $ceiling;

        return min($target, $ceiling);
    }

    /** What the box's cap becomes on the next advance — the dashboard preview. */
    public function nextCap(Mailbox $mailbox): int
    {
        return $this->capForDay($mailbox->warmup_day + 1, $this->ceiling($mailbox));
    }

    public function ceiling(Mailbox $mailbox): int
    {
        return max(1, (int) ($mailbox->warmup_ceiling ?: self::DEFAULT_CEILING));
    }

    public function isSystemAddress(?string $address): bool
    {
        $local = strtolower(Str::before((string) $address, '@'));

        return in_array($local, self::SYSTEM_ROLES, true);
    }

    /**
     * The boxes the warmup dashboard manages: enabled, and not a system role
     * unless the operator explicitly opted that address in.
     *
     * @param  Collection<int, Mailbox>  $mailboxes
     * @return Collection<int, Mailbox>
     */
    public function sendable(Collection $mailboxes): Collection
    {
        return $mailboxes
            ->filter(fn (Mailbox $box) => $box->enabled)
            ->filter(fn (Mailbox $box) => $box->warmup_opted_in || ! $this->isSystemAddress($box->from_address))
            ->values();
    }

    /**
     * Warmup on: day 1, cap drops to the first ramp step, and today's date is
     * stamped as already-advanced so the scheduler never double-advances the
     * first day. The pre-warmup limit is kept for the sent-vs-cap history.
     */
    public function start(Mailbox $mailbox): void
    {
        $mailbox->forceFill([
            'status' => 'warming',
            'warmup_day' => 1,
            'warmup_started_at' => now(),
            'warmup_last_advanced_on' => $this->today(),
            'warmup_previous_limit' => $mailbox->daily_limit,
            'daily_limit' => $this->capForDay(1, $this->ceiling($mailbox)),
        ])->save();
    }

    /** Warmup off: the box goes active at its full ceiling. */
    public function stop(Mailbox $mailbox): void
    {
        $mailbox->forceFill([
            'status' => 'active',
            'warmup_day' => 0,
            'warmup_started_at' => null,
            'warmup_last_advanced_on' => null,
            'daily_limit' => $this->ceiling($mailbox),
        ])->save();
    }

    /**
     * Advance one plan day and write the new daily_limit. Idempotent per
     * Africa/Algiers date — a second run on the same day changes nothing.
     * Only warming, enabled boxes move; anything else returns false.
     */
    public function advance(Mailbox $mailbox, ?Carbon $today = null): bool
    {
        if (! $mailbox->enabled || $mailbox->status !== 'warming') {
            return false;
        }

        $today ??= $this->today();

        if ($mailbox->warmup_last_advanced_on !== null
            && Carbon::parse($mailbox->warmup_last_advanced_on)->gte($today)) {
            return false;
        }

        $day = max(1, (int) $mailbox->warmup_day) + 1;

        $mailbox->forceFill([
            'warmup_day' => $day,
            'warmup_last_advanced_on' => $today,
            'daily_limit' => $this->capForDay($day, $this->ceiling($mailbox)),
        ])->save();

        return true;
    }

    /**
     * The peer-ping pool: the workspace's own enabled, non-system mailboxes
     * that opted into peer pings. Pings only ever flow inside this pool —
     * no seed inboxes, no strangers.
     *
     * @return Collection<int, Mailbox>
     */
    public function peerPool(Workspace $workspace): Collection
    {
        return Mailbox::query()
            ->forWorkspace($workspace)
            ->where('enabled', true)
            ->where('warmup_peers', true)
            ->get()
            ->reject(fn (Mailbox $box) => $this->isSystemAddress($box->from_address))
            ->values();
    }

    /**
     * Today's ping plan without sending anything: [sender, recipient] pairs,
     * each warming sender pinging a few peers, well under its remaining cap.
     * Pure — safe to call (and assert on) in tests.
     *
     * @return array<int, array{0: Mailbox, 1: Mailbox}>
     */
    public function peerPingPlan(Workspace $workspace): array
    {
        $pool = $this->peerPool($workspace);

        if ($pool->count() < 2) {
            return [];
        }

        $plan = [];

        foreach ($pool->where('status', 'warming') as $sender) {
            $remaining = max(0, $sender->daily_limit - $sender->sentToday());
            $pings = min(
                self::MAX_PEER_PINGS_PER_SENDER,
                max(1, intdiv(max(1, $sender->daily_limit), 5)),
                $remaining,
            );

            $recipients = $pool->where('id', '!=', $sender->id)->values();

            for ($i = 0; $i < $pings && $i < $recipients->count(); $i++) {
                $plan[] = [$sender, $recipients->get($i)];
            }
        }

        return $plan;
    }

    /**
     * Send today's peer pings. Hard-guarded: never sends under Pest, never
     * during quiet hours (the ping is skipped, not failed), and every real
     * send is an OutboundMessage in the outbox like any other dispatch.
     */
    public function sendPeerPings(Workspace $workspace): int
    {
        if (app()->environment('testing')) {
            return 0;
        }

        if ($this->quietHours->blocks($workspace)) {
            return 0;
        }

        $sent = 0;

        foreach ($this->peerPingPlan($workspace) as [$sender, $recipient]) {
            $contact = Contact::query()->firstOrCreate(
                ['workspace_id' => $workspace->id, 'email' => strtolower($recipient->from_address)],
                ['first_name' => $recipient->from_name, 'source' => 'warmup_peer'],
            );

            $message = $this->dispatcher->dispatch($workspace, $contact, [
                'channel' => 'email',
                'mailbox_id' => $sender->id,
                'to_address' => $recipient->from_address,
                'subject' => 'Warmup ping — '.$this->today()->toDateString(),
                'body' => "Internal EvoSales warmup ping between this workspace's own mailboxes "
                    ."({$sender->from_address} → {$recipient->from_address}). No action needed.",
            ]);

            if ($message->status === 'sent') {
                $sent++;
            }
        }

        return $sent;
    }

    /**
     * now() is CarbonImmutable under travelTo — normalize to mutable Carbon
     * in the warmup timezone either way (same pattern as QuietHours).
     */
    public function today(): Carbon
    {
        return Carbon::instance(\DateTime::createFromInterface(now(self::TIMEZONE)))->startOfDay();
    }
}
