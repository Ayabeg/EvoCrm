<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Deal;
use App\Models\DealSuggestion;
use App\Services\LeadOs\AfterTouchDraft;
use App\Services\LeadOs\GraphRunner;
use App\Services\LeadOs\LostReview;
use App\Services\LeadOs\NextMoveAdvisor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LeadOsController extends Controller
{
    public function runGraph(Request $request, GraphRunner $runner): RedirectResponse
    {
        $runner->start($request->user()->workspace, 'manual');

        return back();
    }

    public function applySuggestion(Request $request, Deal $deal, DealSuggestion $suggestion, NextMoveAdvisor $moves, AfterTouchDraft $drafts, LostReview $lost): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless((int) $suggestion->deal_id === (int) $deal->id, 404);
        abort_unless((int) $suggestion->workspace_id === (int) $request->user()->workspace_id, 404);

        $reason = $request->string('reason')->toString() ?: null;

        match ($suggestion->kind) {
            DealSuggestion::KIND_AFTER_TOUCH => $drafts->apply($suggestion),
            DealSuggestion::KIND_LOST_REASON => $lost->confirm($suggestion, $reason),
            default => $moves->apply($suggestion, $request->user()->workspace),
        };

        return back();
    }

    public function dismissSuggestion(Request $request, Deal $deal, DealSuggestion $suggestion): RedirectResponse
    {
        abort_unless((int) $deal->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless((int) $suggestion->deal_id === (int) $deal->id, 404);
        abort_unless((int) $suggestion->workspace_id === (int) $request->user()->workspace_id, 404);

        $suggestion->dismiss();

        return back();
    }

    public function confirmLost(Request $request, DealSuggestion $suggestion, LostReview $lost): RedirectResponse
    {
        abort_unless((int) $suggestion->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless($suggestion->kind === DealSuggestion::KIND_LOST_REASON, 404);

        $lost->confirm($suggestion, $request->string('reason')->toString() ?: null);

        return back();
    }
}
