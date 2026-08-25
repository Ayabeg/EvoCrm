<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Playbook;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PlaybookController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('settings/playbooks', [
            'playbooks' => Playbook::query()
                ->forWorkspace($workspace)
                ->orderBy('entity')
                ->orderBy('position')
                ->orderBy('name')
                ->get(['id', 'entity', 'name', 'body', 'position']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $workspace = $request->user()->workspace;

        Playbook::query()->create([
            'workspace_id' => $workspace->id,
            'entity' => $data['entity'],
            'name' => $data['name'],
            'body' => $data['body'],
            'position' => (int) (Playbook::query()->forWorkspace($workspace)->max('position') ?? 0) + 1,
        ]);

        return redirect()->route('settings.playbooks');
    }

    public function update(Request $request, Playbook $playbook): RedirectResponse
    {
        abort_unless((int) $playbook->workspace_id === (int) $request->user()->workspace_id, 404);

        $playbook->update($this->validated($request));

        return redirect()->route('settings.playbooks');
    }

    public function destroy(Request $request, Playbook $playbook): RedirectResponse
    {
        abort_unless((int) $playbook->workspace_id === (int) $request->user()->workspace_id, 404);
        $playbook->delete();

        return redirect()->route('settings.playbooks');
    }

    /**
     * @return array{entity: string, name: string, body: string}
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'entity' => ['required', Rule::in(['contact', 'deal'])],
            'name' => ['required', 'string', 'max:120'],
            'body' => ['required', 'string', 'max:4000'],
        ]);
    }
}
