<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Services\Crm\BulkActionRunner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BulkActionController extends Controller
{
    public function contacts(Request $request, BulkActionRunner $runner): RedirectResponse
    {
        return $this->run($request, $runner, 'contact');
    }

    public function deals(Request $request, BulkActionRunner $runner): RedirectResponse
    {
        return $this->run($request, $runner, 'deal');
    }

    private function run(Request $request, BulkActionRunner $runner, string $entity): RedirectResponse
    {
        $data = $request->validate([
            'action' => ['required', 'string'],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
            'owner_id' => ['nullable', 'integer'],
            'sequence_id' => ['nullable', 'integer'],
            'stage_id' => ['nullable', 'integer'],
        ]);

        $run = $runner->queue(
            $request->user()->workspace,
            $request->user(),
            $entity,
            $data['action'],
            $data['ids'],
            [
                'owner_id' => $data['owner_id'] ?? null,
                'sequence_id' => $data['sequence_id'] ?? null,
                'stage_id' => $data['stage_id'] ?? null,
            ],
        );

        $run->refresh();

        return back()->with('status', sprintf(
            'Bulk %s finished: %d succeeded, %d failed.',
            str_replace('_', ' ', $run->action),
            $run->succeeded,
            $run->failed,
        ));
    }
}
