<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\ImportBatch;
use App\Services\Crm\DealCsvImporter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DealImportController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('crm/deals/import', [
            'batch' => null,
        ]);
    }

    public function store(Request $request, DealCsvImporter $importer): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,text/plain', 'max:10240'],
        ]);

        $batch = $importer->createBatch(
            $request->user()->workspace,
            $request->user(),
            $data['file'],
        );

        return redirect()->route('crm.deals.import.show', $batch);
    }

    public function show(Request $request, ImportBatch $batch, DealCsvImporter $importer): Response
    {
        $this->guard($request, $batch);

        return Inertia::render('crm/deals/import', [
            'batch' => $importer->present($batch),
        ]);
    }

    public function update(Request $request, ImportBatch $batch, DealCsvImporter $importer): RedirectResponse
    {
        $this->guard($request, $batch);

        abort_if(in_array($batch->status, [ImportBatch::STATUS_PROCESSING, ImportBatch::STATUS_COMPLETED], true), 409);

        $data = $request->validate([
            'mapping' => ['required', 'array'],
            'mapping.*' => ['nullable', 'string', 'max:80'],
        ]);

        $importer->applyMapping($batch, $data['mapping']);

        return redirect()->route('crm.deals.import.show', $batch);
    }

    public function commit(Request $request, ImportBatch $batch, DealCsvImporter $importer): RedirectResponse
    {
        $this->guard($request, $batch);

        $importer->commit($batch);

        return redirect()->route('crm.deals.import.show', $batch);
    }

    private function guard(Request $request, ImportBatch $batch): void
    {
        abort_unless((int) $batch->workspace_id === (int) $request->user()->workspace_id, 404);
        abort_unless($batch->type === ImportBatch::TYPE_DEALS, 404);
    }
}
