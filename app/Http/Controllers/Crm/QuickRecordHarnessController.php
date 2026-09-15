<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Quote;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Local / testing-only host for the P09 drawer. Not registered in production.
 */
class QuickRecordHarnessController extends Controller
{
    public function show(Request $request): Response
    {
        abort_unless(app()->environment(['local', 'testing']), 404);

        $workspace = $request->user()->workspace;

        return Inertia::render('crm/quick-record-drawer/harness', [
            'samples' => [
                'contact' => Contact::query()->forWorkspace($workspace)->latest('id')->value('id'),
                'company' => Company::query()->forWorkspace($workspace)->latest('id')->value('id'),
                'lead' => Lead::query()->forWorkspace($workspace)->latest('id')->value('id'),
                'deal' => Deal::query()->forWorkspace($workspace)->latest('id')->value('id'),
                'quote' => Quote::query()->forWorkspace($workspace)->latest('id')->value('id'),
            ],
        ]);
    }
}
