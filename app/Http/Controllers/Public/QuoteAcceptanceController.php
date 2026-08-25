<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Quote;
use App\Services\Crm\ActivityRecorder;
use App\Services\Crm\WorkflowRunner;
use App\Services\Operations\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuoteAcceptanceController extends Controller
{
    public function show(string $token): Response
    {
        $quote = $this->resolve($token);

        return Inertia::render('public/quote', [
            'quote' => [
                'id' => $quote->id,
                'status' => $quote->status,
                'currency' => $quote->currency,
                'total_cents' => $quote->total_cents,
                'notes' => $quote->notes,
                'expires_at' => $quote->expires_at?->toDateString(),
                'accepted_at' => $quote->accepted_at?->toIso8601String(),
                'html' => $quote->snapshot_html,
                'items' => $quote->snapshot['items'] ?? $quote->items->map(fn ($item) => [
                    'name' => $item->name,
                    'quantity' => $item->quantity,
                    'unit_cents' => $item->unit_cents,
                    'total_cents' => $item->total_cents,
                ])->all(),
            ],
        ]);
    }

    public function accept(Request $request, string $token, ActivityRecorder $activities, WorkflowRunner $workflows, AuditLogger $audit): RedirectResponse
    {
        $quote = $this->resolve($token);

        if ($quote->accepted_at) {
            return back();
        }

        $quote->forceFill([
            'status' => 'accepted',
            'accepted_at' => now(),
            'accepted_ip' => $request->ip(),
        ])->save();

        $activities->record($quote->workspace, [
            'type' => 'quote_accepted',
            'subject' => 'Quote accepted',
            'body' => 'Quote #'.$quote->id.' was accepted from the public link.',
            'contact_id' => $quote->deal?->contact_id,
            'deal_id' => $quote->deal_id,
            'meta' => ['quote_id' => $quote->id],
        ]);

        if ($quote->workspace) {
            $audit->record(
                $quote->workspace,
                'quote.accepted',
                'Quote #'.$quote->id.' was accepted from the public link.',
                null,
                $quote,
                ['ip' => $request->ip()],
                $request->ip(),
            );
        }

        if ($quote->deal) {
            $workflows->handleDealCreated($quote->deal);
        }

        return back();
    }

    private function resolve(string $token): Quote
    {
        $quote = Quote::query()
            ->with(['items', 'deal.contact', 'workspace'])
            ->where('public_token', $token)
            ->firstOrFail();

        abort_unless($quote->tokenIsUsable() || $quote->accepted_at !== null, 404);

        return $quote;
    }
}
