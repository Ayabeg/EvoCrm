<?php

namespace App\Services\Crm;

use App\Models\Activity;
use App\Models\Order;
use App\Models\Quote;
use App\Services\Operations\AuditLogger;
use Illuminate\Support\Facades\DB;

class QuoteAcceptor
{
    public function __construct(
        private ActivityRecorder $activities,
        private AuditLogger $audit,
        private WorkflowRunner $workflows,
        private QuoteWhatsApp $whatsapp,
    ) {}

    public function accept(Quote $quote, ?string $ip): void
    {
        $activity = DB::transaction(function () use ($quote, $ip): ?Activity {
            $locked = Quote::query()
                ->with(['deal.contact', 'workspace'])
                ->whereKey($quote->id)
                ->lockForUpdate()
                ->firstOrFail();

            abort_unless($locked->tokenIsUsable(), 404);

            if ($locked->accepted_at) {
                return null;
            }

            $locked->forceFill([
                'status' => 'accepted',
                'accepted_at' => now(),
                'accepted_ip' => $ip,
            ])->save();

            Order::query()->firstOrCreate(
                ['quote_id' => $locked->id],
                [
                    'workspace_id' => $locked->workspace_id,
                    'deal_id' => $locked->deal_id,
                    'status' => Order::STATUS_PLACED,
                    'total_cents' => (int) $locked->total_cents,
                    'currency' => $locked->currency ?: 'DZD',
                ],
            );

            $activity = $this->activities->record($locked->workspace, [
                'type' => 'quote_accepted',
                'subject' => 'Quote accepted',
                'body' => 'Quote #'.$locked->id.' was accepted from the public link.',
                'contact_id' => $locked->deal?->contact_id,
                'deal_id' => $locked->deal_id,
                'meta' => ['quote_id' => $locked->id],
            ]);

            if ($locked->workspace) {
                $this->audit->record(
                    $locked->workspace,
                    'quote.accepted',
                    'Quote #'.$locked->id.' was accepted from the public link.',
                    null,
                    $locked,
                    ['ip' => $ip],
                    $ip,
                );
            }

            if ($locked->deal) {
                $this->workflows->handleDealCreated($locked->deal);
            }

            return $activity;
        });

        if ($activity instanceof Activity && $quote->workspace) {
            $this->whatsapp->confirm($quote, $activity);
        }
    }
}
