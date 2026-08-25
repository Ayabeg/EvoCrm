<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditTrailController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $events = AuditEvent::query()
            ->forWorkspace($workspace)
            ->with('actor:id,name,email')
            ->latest('id')
            ->limit(200)
            ->get()
            ->map(fn (AuditEvent $event) => [
                'id' => $event->id,
                'action' => $event->action,
                'summary' => $event->summary,
                'actor' => $event->actor?->name ?? $event->actor?->email,
                'ip' => $event->ip,
                'created_at' => $event->created_at?->toIso8601String(),
            ]);

        return Inertia::render('settings/audit', [
            'events' => $events,
        ]);
    }
}
