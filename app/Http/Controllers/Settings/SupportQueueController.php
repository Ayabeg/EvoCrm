<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SupportQueue;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SupportQueueController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->canPermission('settings.support'), 403);

        $workspace = $request->user()->workspace;

        return Inertia::render('settings/support-queues', [
            'queues' => SupportQueue::query()
                ->forWorkspace($workspace)
                ->withCount(['tickets as open_tickets_count' => fn ($query) => $query->where('status', '!=', 'closed')])
                ->orderBy('name')
                ->get()
                ->map(fn (SupportQueue $queue) => [
                    'id' => $queue->id,
                    'name' => $queue->name,
                    'slug' => $queue->slug,
                    'is_active' => $queue->is_active,
                    'round_robin' => $queue->round_robin,
                    'open_tickets_count' => $queue->open_tickets_count,
                ])
                ->values()
                ->all(),
            'canManage' => $request->user()->canPermission('settings.support'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeQueueManagement($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'round_robin' => ['sometimes', 'boolean'],
        ]);

        SupportQueue::query()->create([
            'workspace_id' => $request->user()->workspace_id,
            'name' => trim($data['name']),
            'slug' => $this->uniqueSlug($request->user()->workspace_id, $data['name']),
            'is_active' => true,
            'round_robin' => $request->boolean('round_robin'),
        ]);

        return back();
    }

    public function update(Request $request, SupportQueue $queue): RedirectResponse
    {
        $this->authorizeQueueManagement($request);
        abort_unless((int) $queue->workspace_id === (int) $request->user()->workspace_id, 404);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'is_active' => ['sometimes', 'boolean'],
            'round_robin' => ['sometimes', 'boolean'],
        ]);

        if ($request->boolean('round_robin_present')) {
            $data['round_robin'] = $request->boolean('round_robin');
        }

        if (array_key_exists('name', $data)) {
            $data['name'] = trim($data['name']);
            $data['slug'] = $this->uniqueSlug($queue->workspace_id, $data['name'], $queue->id);
        }

        $queue->forceFill($data)->save();

        return back();
    }

    public function destroy(Request $request, SupportQueue $queue): RedirectResponse
    {
        $this->authorizeQueueManagement($request);
        abort_unless((int) $queue->workspace_id === (int) $request->user()->workspace_id, 404);

        $queue->delete();

        return back();
    }

    private function authorizeQueueManagement(Request $request): void
    {
        abort_unless($request->user()->canPermission('settings.support'), 403);
    }

    private function uniqueSlug(int $workspaceId, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'queue';
        $slug = $base;
        $suffix = 2;

        while (SupportQueue::query()
            ->where('workspace_id', $workspaceId)
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
