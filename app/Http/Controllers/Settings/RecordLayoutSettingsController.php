<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\RecordLayout;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecordLayoutSettingsController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->role->canManageSettings(), 403);

        $workspaceId = $request->user()->workspace_id;
        $layouts = [];

        foreach (['contact', 'company', 'deal'] as $entity) {
            $layout = RecordLayout::query()
                ->where('workspace_id', $workspaceId)
                ->whereNull('user_id')
                ->where('entity', $entity)
                ->where('is_workspace_default', true)
                ->first();

            $layouts[$entity] = $layout?->layout;
        }

        return Inertia::render('settings/record-layouts', [
            'layouts' => $layouts,
        ]);
    }
}
