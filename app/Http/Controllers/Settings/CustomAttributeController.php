<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\CustomAttributeDefinition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomAttributeController extends Controller
{
    public function edit(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('settings/attributes', [
            'definitions' => CustomAttributeDefinition::query()
                ->forWorkspace($workspace)
                ->orderBy('entity')
                ->orderBy('label')
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'entity' => ['required', 'in:contact,company,deal'],
            'key' => ['required', 'string', 'max:60', 'alpha_dash'],
            'label' => ['required', 'string', 'max:80'],
            'type' => ['required', 'in:text,number,list'],
            'options' => ['nullable', 'string'],
        ]);

        $options = null;
        if ($data['type'] === 'list') {
            $options = collect(explode(',', (string) ($data['options'] ?? '')))
                ->map(fn ($item) => trim($item))
                ->filter()
                ->values()
                ->all();
        }

        CustomAttributeDefinition::query()->updateOrCreate(
            [
                'workspace_id' => $request->user()->workspace_id,
                'entity' => $data['entity'],
                'key' => $data['key'],
            ],
            [
                'label' => $data['label'],
                'type' => $data['type'],
                'options' => $options,
            ]
        );

        return back();
    }
}
