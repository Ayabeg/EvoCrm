<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Services\Ai\RecordInsight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AskEvoController extends Controller
{
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
