<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Ticket;
use App\Services\Ai\AskEvoContextRequest;
use App\Services\Ai\AskEvoCopilot;
use App\Services\Ai\RecordInsight;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AskEvoController extends Controller
{
    public function context(Request $request, AskEvoCopilot $copilot): JsonResponse
    {
        $user = $request->user();
        $context = $copilot->context($user, AskEvoContextRequest::fromInput($request->query()));

        if (! $context->available()) {
            return response()->json([
                'ok' => false,
                'context' => $context->present(),
                'error' => [
                    'code' => $context->unavailableCode,
                    'message' => $context->groundingNote,
                ],
            ], $context->unavailableCode === 'unauthorized' ? 404 : 422);
        }

        return response()->json([
            'ok' => true,
            'context' => $context->present(),
        ]);
    }

    public function ask(Request $request, AskEvoCopilot $copilot): JsonResponse|RedirectResponse
    {
        $data = $request->validate([
            'question' => ['required', 'string', 'max:280'],
            'page' => ['nullable', 'string', 'max:40'],
            'entity_type' => ['nullable', 'string', 'max:40'],
            'entity_id' => ['nullable', 'integer', 'min:1'],
            'scope_key' => ['nullable', 'string', 'max:80'],
        ]);

        $result = $copilot->ask($request->user(), $data['question'], $data);
        $payload = $result->toArray();

        if ($request->expectsJson() || $request->wantsJson() || $request->ajax()) {
            $status = $result->ok ? 200 : match ($result->errorCode) {
                'unauthorized' => 404,
                'rate_limit' => 429,
                'timeout' => 504,
                'stale' => 409,
                default => 422,
            };

            return response()->json($payload, $status);
        }

        if (! $result->ok) {
            return back()->withErrors(['question' => $result->message]);
        }

        return back();
    }

    public function contact(Request $request, Contact $contact, RecordInsight $insight): RedirectResponse
    {
        abort_unless((int) $contact->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'question' => ['required', 'string', 'max:280'],
        ]);

        $insight->ask($contact, $data['question']);

        return back();
    }

    public function deal(Request $request, Deal $deal, RecordInsight $insight): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'question' => ['required', 'string', 'max:280'],
        ]);

        $insight->ask($deal, $data['question']);

        return back();
    }

    public function company(Request $request, Company $company, RecordInsight $insight): RedirectResponse
    {
        abort_unless((int) $company->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'question' => ['required', 'string', 'max:280'],
        ]);

        $insight->ask($company, $data['question']);

        return back();
    }

    public function lead(Request $request, Lead $lead, RecordInsight $insight): RedirectResponse
    {
        abort_unless((int) $lead->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'question' => ['required', 'string', 'max:280'],
        ]);

        $insight->explainLeadScore($lead, $data['question']);

        return back();
    }

    public function ticket(Request $request, Ticket $ticket, RecordInsight $insight): RedirectResponse
    {
        abort_unless((int) $ticket->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'question' => ['required', 'string', 'max:280'],
        ]);

        $insight->askTicket($ticket, $data['question']);

        return back();
    }

    public function draftContact(Request $request, Contact $contact, RecordInsight $insight): RedirectResponse
    {
        abort_unless((int) $contact->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'intent' => ['nullable', 'string', 'max:80'],
        ]);

        session()->flash('emailDraft', $insight->draftEmail($contact, $data['intent'] ?? 'follow_up'));

        return back();
    }

    public function draftDeal(Request $request, Deal $deal, RecordInsight $insight): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'intent' => ['nullable', 'string', 'max:80'],
        ]);

        session()->flash('emailDraft', $insight->draftEmail($deal, $data['intent'] ?? 'follow_up'));

        return back();
    }
}
