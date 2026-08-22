<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SavedFilterController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'entity' => ['required', 'in:contact,deal,company'],
            'stage' => ['nullable', 'string', 'max:40'],
            'owner' => ['nullable', 'string', 'max:40'],
            'city' => ['nullable', 'string', 'max:80'],
            'wilaya' => ['nullable', 'string', 'max:80'],
            'last_activity' => ['nullable', 'in:7d,30d,none'],
            'unanswered' => ['sometimes', 'boolean'],
            'unassigned' => ['sometimes', 'boolean'],
        ]);

        $workspace = $request->user()->workspace;

        $workspace->savedFilters()->create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'entity' => $data['entity'],
            'filters' => [
                'stage' => $data['stage'] ?? null,
                'owner' => $data['owner'] ?? null,
                'city' => $data['city'] ?? null,
                'wilaya' => $data['wilaya'] ?? null,
                'last_activity' => $data['last_activity'] ?? null,
                'unanswered' => $request->boolean('unanswered'),
                'unassigned' => $request->boolean('unassigned'),
            ],
        ]);

        return back();
    }
}
