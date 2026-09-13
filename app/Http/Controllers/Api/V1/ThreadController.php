<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\AuthorizesApiWorkspace;
use App\Http\Controllers\Api\V1\Support\ApiPayload;
use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Thread;
use App\Services\Desk\DeskComposer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ThreadController extends Controller
{
    use AuthorizesApiWorkspace;

    public function index(Request $request): JsonResponse
    {
        $workspace = $this->workspace($request);
        $perPage = min(100, max(1, $request->integer('per_page', 25)));

        $threads = Thread::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'channel'])
            ->orderByDesc('last_message_at')
            ->paginate($perPage);

        return response()->json([
            'data' => collect($threads->items())->map(
                fn (Thread $thread) => ApiPayload::thread($thread)
            )->values()->all(),
            'meta' => ApiPayload::pagination($threads),
        ]);
    }

    public function reply(Request $request, Thread $thread, DeskComposer $composer): JsonResponse
    {
        $this->ensureInWorkspace($thread, $this->workspace($request));

        $data = $request->validate([
            'body' => ['required', 'string', 'max:4000'],
            'as_note' => ['sometimes', 'boolean'],
            'resolve' => ['sometimes', 'boolean'],
        ]);

        if ($request->boolean('as_note')) {
            $message = Message::query()->create([
                'workspace_id' => $thread->workspace_id,
                'thread_id' => $thread->id,
                'contact_id' => $thread->contact_id,
                'user_id' => $request->user()->id,
                'direction' => 'internal',
                'type' => 'note',
                'body' => $data['body'],
                'status' => 'logged',
                'provider' => 'desk',
            ]);
        } else {
            $message = $composer->reply($thread, $request->user(), $data['body']);
        }

        if ($request->boolean('resolve')) {
            $thread->forceFill(['status' => 'resolved'])->save();
        }

        return response()->json([
            'data' => ApiPayload::message($message),
        ], 201);
    }
}
