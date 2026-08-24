<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\CustomAttributeDefinition;
use App\Services\Crm\CustomAttributes;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomAttributeController extends Controller
{
    public function edit(Request $request, CustomAttributes $attributes): Response
    {
        $workspace = $request->user()->workspace;
        $rates = $attributes->fillRates($workspace);

        $definitions = CustomAttributeDefinition::query()
            ->forWorkspace($workspace)
            ->orderBy('entity')
            ->orderByRaw("case when group_name is null or group_name = '' then 1 else 0 end")
            ->orderBy('group_name')
            ->orderBy('label')
            ->get()
            ->map(fn (CustomAttributeDefinition $definition) => $attributes->presentDefinition(
                $definition,
                $rates[$definition->id] ?? ['filled' => 0, 'total' => 0, 'percent' => 0],
            ))
            ->values();

        return Inertia::render('settings/attributes', [
            'definitions' => $definitions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->persist($request);

        return back();
    }

    public function update(Request $request, CustomAttributeDefinition $definition): RedirectResponse
    {
        abort_unless((int) $definition->workspace_id === (int) $request->user()->workspace_id, 404);

        $this->persist($request, $definition);

        return back();
    }

    public function destroy(Request $request, CustomAttributeDefinition $definition): RedirectResponse
    {
        abort_unless((int) $definition->workspace_id === (int) $request->user()->workspace_id, 404);

        $definition->delete();

        return back();
    }

    private function persist(Request $request, ?CustomAttributeDefinition $definition = null): CustomAttributeDefinition
    {
        $data = $request->validate([
            'entity' => [$definition ? 'sometimes' : 'required', 'in:contact,company,deal'],
            'key' => [$definition ? 'sometimes' : 'required', 'string', 'max:60', 'alpha_dash'],
            'label' => ['required', 'string', 'max:80'],
            'type' => ['required', Rule::in([...CustomAttributeDefinition::TYPES, 'select'])],
            'group' => ['nullable', 'string', 'max:80'],
            'required' => ['sometimes', 'boolean'],
            'options' => ['nullable', 'string'],
        ]);

        $type = ($data['type'] ?? $definition?->type) === 'select' ? 'list' : $data['type'];
        $options = null;
        if ($type === 'list') {
            $options = collect(explode(',', (string) ($data['options'] ?? '')))
                ->map(fn ($item) => trim($item))
                ->filter()
                ->values()
                ->all();
        }

        $values = [
            'label' => $data['label'],
            'type' => $type,
            'options' => $options,
            'group_name' => filled($data['group'] ?? null) ? $data['group'] : null,
            'required' => $request->boolean('required'),
        ];

        if ($definition) {
            $definition->fill($values)->save();

            return $definition;
        }

        return CustomAttributeDefinition::query()->updateOrCreate(
            [
                'workspace_id' => $request->user()->workspace_id,
                'entity' => $data['entity'],
                'key' => $data['key'],
            ],
            $values
        );
    }
}
