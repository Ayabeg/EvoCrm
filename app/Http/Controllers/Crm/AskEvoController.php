<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
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
}
