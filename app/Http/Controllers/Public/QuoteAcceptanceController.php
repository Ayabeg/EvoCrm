<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Quote;
use App\Services\Crm\QuoteAcceptor;
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
                'workspace' => $quote->workspace?->name ?? 'EvoCrm',
                'accept_url' => "/q/{$token}/accept",
                'deal' => $quote->deal ? [
                    'title' => $quote->deal->title,
                ] : null,
                'contact' => $quote->deal?->contact ? [
                    'first_name' => $quote->deal->contact->first_name,
                ] : null,
                'items' => $quote->snapshot['items'] ?? $quote->items->map(fn ($item) => [
                    'name' => $item->name,
                    'quantity' => $item->quantity,
                    'unit_cents' => $item->unit_cents,
                    'total_cents' => $item->total_cents,
                ])->all(),
            ],
        ]);
    }

    public function accept(Request $request, string $token, QuoteAcceptor $acceptor): RedirectResponse
    {
        $acceptor->accept($this->resolve($token), $request->ip());

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
