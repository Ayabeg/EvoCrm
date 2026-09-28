<?php

use App\Enums\ChannelType;
use App\Models\Channel;
use App\Models\Contact;
use App\Models\Message;
use App\Models\Thread;
use App\Models\User;
use App\Services\Agent\AgentToolExecutor;
use Illuminate\Support\Facades\Http;

function agentToolHeaders(string $token = 'secret'): array
{
    return ['Authorization' => 'Bearer '.$token];
}

function enableAgentTools(): void
{
    config([
        'services.openmanus.enabled' => true,
        'services.openmanus.url' => 'http://openmanus.test',
        'services.openmanus.token' => 'secret',
    ]);
}

test('crm search performs a real workspace read when the plugin is enabled', function () {
    enableAgentTools();

    $user = User::factory()->create();
    enableWorkspaceAgent($user, ['plugins' => ['crm.read' => true]]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amira',
        'last_name' => 'Benali',
        'email' => 'amira@example.test',
    ]);

    $this->postJson('/api/agent/tools/crm.search', [
        'workspace_id' => $user->workspace_id,
        'arguments' => ['q' => 'Amira', 'type' => 'contact'],
    ], agentToolHeaders())
        ->assertOk()
        ->assertJsonPath('ok', true)
        ->assertJsonPath('tool', 'crm.search')
        ->assertJsonPath('invocation.name', 'crm.search')
        ->assertJsonPath('invocation.status', 'ok')
        ->assertJsonPath('invocation.args.q', 'Amira')
        ->assertJsonPath('result.data.0.id', $contact->id)
        ->assertJsonPath('result.data.0.email', 'amira@example.test')
        ->assertJsonMissing(['secret']);
});

test('disabled plugins cannot execute their tools', function () {
    enableAgentTools();

    $user = User::factory()->create();
    enableWorkspaceAgent($user, ['plugins' => []]);

    Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amira',
    ]);

    $this->postJson('/api/agent/tools/crm.search', [
        'workspace_id' => $user->workspace_id,
        'arguments' => ['q' => 'Amira', 'type' => 'contact'],
    ], agentToolHeaders())
        ->assertForbidden()
        ->assertJsonPath('error', 'tool_forbidden');
});

test('draft tools prepare text and refuse send', function () {
    enableAgentTools();

    $user = User::factory()->create();
    enableWorkspaceAgent($user, ['plugins' => ['crm.draft' => true]]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Karim',
    ]);

    $this->postJson('/api/agent/tools/crm.draft_email', [
        'workspace_id' => $user->workspace_id,
        'arguments' => [
            'contact_id' => $contact->id,
            'intent' => 'follow_up',
            'body' => 'Prepared only.',
        ],
    ], agentToolHeaders())
        ->assertOk()
        ->assertJsonPath('result.draft', true)
        ->assertJsonPath('result.sent', false)
        ->assertJsonPath('result.body', 'Prepared only.')
        ->assertJsonPath('invocation.name', 'crm.draft_email');

    expect(Message::query()->count())->toBe(0);

    $this->postJson('/api/agent/tools/crm.draft_email', [
        'workspace_id' => $user->workspace_id,
        'arguments' => ['send' => true, 'body' => 'Do not send'],
    ], agentToolHeaders())
        ->assertStatus(422)
        ->assertJsonPath('error', 'send_forbidden');

    $this->postJson('/api/agent/tools/crm.draft_reply', [
        'workspace_id' => $user->workspace_id,
        'arguments' => ['action' => 'send', 'body' => 'Do not send'],
    ], agentToolHeaders())
        ->assertStatus(422)
        ->assertJsonPath('error', 'send_forbidden');

    expect(Message::query()->count())->toBe(0);
});

test('unknown tools and send-named tools are rejected', function () {
    enableAgentTools();

    $user = User::factory()->create();
    enableWorkspaceAgent($user, ['plugins' => ['crm.read' => true]]);

    $this->postJson('/api/agent/tools/shell.exec', [
        'workspace_id' => $user->workspace_id,
        'arguments' => [],
    ], agentToolHeaders())
        ->assertNotFound()
        ->assertJsonPath('error', 'unknown_tool');
});

test('tool callback is fail closed without host flag workspace toggle or token', function () {
    $user = User::factory()->create();

    config(['services.openmanus.enabled' => false]);
    enableWorkspaceAgent($user, ['plugins' => ['crm.read' => true]]);

    $this->postJson('/api/agent/tools/crm.search', [
        'workspace_id' => $user->workspace_id,
        'arguments' => ['q' => 'Amira'],
    ], agentToolHeaders())
        ->assertNotFound();

    enableAgentTools();

    $this->postJson('/api/agent/tools/crm.search', [
        'workspace_id' => $user->workspace_id,
        'arguments' => ['q' => 'Amira'],
    ], agentToolHeaders('wrong-token'))
        ->assertUnauthorized();

    $other = User::factory()->create();
    $this->postJson('/api/agent/tools/crm.search', [
        'workspace_id' => $other->workspace_id,
        'arguments' => ['q' => 'Amira'],
    ], agentToolHeaders())
        ->assertNotFound();
});

test('desk inbox tools are read only', function () {
    enableAgentTools();

    $user = User::factory()->create();
    enableWorkspaceAgent($user, ['plugins' => ['desk.inbox' => true]]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Nour',
    ]);
    $channel = Channel::query()->firstOrCreate(
        ['workspace_id' => $user->workspace_id, 'type' => ChannelType::WhatsAppCloud],
        ['name' => 'WhatsApp Cloud', 'status' => 'connected'],
    );
    $thread = Thread::query()->create([
        'workspace_id' => $user->workspace_id,
        'contact_id' => $contact->id,
        'channel_id' => $channel->id,
        'status' => 'open',
        'subject' => 'Quote follow-up',
        'last_message_at' => now(),
    ]);
    Message::query()->create([
        'workspace_id' => $user->workspace_id,
        'thread_id' => $thread->id,
        'contact_id' => $contact->id,
        'direction' => 'inbound',
        'type' => 'text',
        'body' => 'Can you send the quote?',
        'status' => 'received',
        'provider' => 'desk',
    ]);

    $this->postJson('/api/agent/tools/desk.list_threads', [
        'workspace_id' => $user->workspace_id,
        'arguments' => ['limit' => 5],
    ], agentToolHeaders())
        ->assertOk()
        ->assertJsonPath('result.data.0.id', $thread->id)
        ->assertJsonPath('invocation.name', 'desk.list_threads');

    $this->postJson('/api/agent/tools/desk.get_thread', [
        'workspace_id' => $user->workspace_id,
        'arguments' => ['id' => $thread->id],
    ], agentToolHeaders())
        ->assertOk()
        ->assertJsonPath('result.data.id', $thread->id)
        ->assertJsonPath('result.data.messages.0.body', 'Can you send the quote?');
});

test('browser research is gated on the connected browser-use connector', function () {
    enableAgentTools();

    $user = User::factory()->create();
    enableWorkspaceAgent($user, ['plugins' => ['browser.research' => true]]);

    $this->postJson('/api/agent/tools/browser.research', [
        'workspace_id' => $user->workspace_id,
        'arguments' => ['query' => 'Acme Algeria'],
    ], agentToolHeaders())
        ->assertForbidden();

    connectAgentConnector($user, 'browser-use', [
        'url' => 'http://browser-use.test',
        'token' => 'bu-secret',
    ]);

    Http::fake([
        'http://browser-use.test' => function ($request) {
            expect($request->hasHeader('Authorization', 'Bearer bu-secret'))->toBeTrue()
                ->and(json_encode($request->data()))->not->toContain('bu-secret');

            if (($request['method'] ?? '') === 'tools/list') {
                return Http::response([
                    'jsonrpc' => '2.0',
                    'id' => 1,
                    'result' => [
                        'tools' => [
                            ['name' => 'browser_research', 'description' => 'Research a query'],
                        ],
                    ],
                ]);
            }

            return Http::response([
                'jsonrpc' => '2.0',
                'id' => 1,
                'result' => [
                    'content' => [['type' => 'text', 'text' => 'Public company notes']],
                ],
            ]);
        },
    ]);

    $this->postJson('/api/agent/tools/browser.research', [
        'workspace_id' => $user->workspace_id,
        'arguments' => ['query' => 'Acme Algeria', 'token' => 'should-not-echo'],
    ], agentToolHeaders())
        ->assertOk()
        ->assertJsonPath('invocation.name', 'browser.research')
        ->assertJsonPath('result.query', 'Acme Algeria')
        ->assertJsonMissing(['bu-secret'])
        ->assertJsonMissing(['should-not-echo']);
});

test('custom mcp tools are listed and called only while the connector is connected', function () {
    enableAgentTools();

    $user = User::factory()->create();
    enableWorkspaceAgent($user);

    $this->postJson('/api/agent/tools/mcp.list_tools', [
        'workspace_id' => $user->workspace_id,
        'arguments' => [],
    ], agentToolHeaders())
        ->assertForbidden();

    connectAgentConnector($user, 'mcp.custom', [
        'url' => 'http://mcp.internal/jsonrpc',
        'token' => 'mcp-secret',
    ]);

    Http::fake([
        'http://mcp.internal/jsonrpc' => function ($request) {
            expect($request->hasHeader('Authorization', 'Bearer mcp-secret'))->toBeTrue()
                ->and(json_encode($request->data()))->not->toContain('mcp-secret');

            if (($request['method'] ?? '') === 'tools/list') {
                return Http::response([
                    'jsonrpc' => '2.0',
                    'id' => 1,
                    'result' => [
                        'tools' => [
                            ['name' => 'lookup_domain', 'description' => 'Look up a domain'],
                        ],
                    ],
                ]);
            }

            expect($request['params']['name'] ?? null)->toBe('lookup_domain');

            return Http::response([
                'jsonrpc' => '2.0',
                'id' => 1,
                'result' => ['ok' => true, 'domain' => 'example.test'],
            ]);
        },
    ]);

    $this->postJson('/api/agent/tools/mcp.list_tools', [
        'workspace_id' => $user->workspace_id,
        'arguments' => [],
    ], agentToolHeaders())
        ->assertOk()
        ->assertJsonPath('result.data.0.name', 'lookup_domain')
        ->assertJsonMissing(['mcp-secret']);

    $this->postJson('/api/agent/tools/mcp.call', [
        'workspace_id' => $user->workspace_id,
        'arguments' => [
            'name' => 'lookup_domain',
            'arguments' => ['domain' => 'example.test'],
        ],
    ], agentToolHeaders())
        ->assertOk()
        ->assertJsonPath('invocation.name', 'mcp.call')
        ->assertJsonPath('result.data.domain', 'example.test')
        ->assertJsonMissing(['mcp-secret']);
});

test('a run with crm.read returns a real tool invocation trace', function () {
    enableAgentTools();

    $user = User::factory()->create();
    enableWorkspaceAgent($user, ['plugins' => ['crm.read' => true]]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Amira',
        'email' => 'amira@example.test',
    ]);

    Http::fake(function ($request) use ($user) {
        if ($request->url() === 'http://openmanus.test/v1/run') {
            expect($request['tools'])->toBeArray()
                ->and(collect($request['tools'])->pluck('id')->all())->toContain('crm.search')
                ->and($request['callback']['workspace_id'])->toBe($user->workspace_id)
                ->and(json_encode($request->data()))->not->toContain('secret');

            $executed = app(AgentToolExecutor::class)->execute(
                $user->workspace,
                'crm.search',
                ['q' => 'Amira', 'type' => 'contact'],
            );

            return Http::response([
                'status' => 'ok',
                'result' => $executed['result'],
                'tools_used' => [$executed['invocation']],
                'errors' => [],
            ]);
        }

        return Http::response(['ok' => true]);
    });

    $this->actingAs($user)
        ->postJson('/api/agent/run', [
            'prompt' => 'Find Amira',
            'plugin_ids' => ['crm.read'],
        ])
        ->assertOk()
        ->assertJsonPath('status', 'ok')
        ->assertJsonPath('tools_used.0.name', 'crm.search')
        ->assertJsonPath('tools_used.0.status', 'ok')
        ->assertJsonPath('tools_used.0.args.q', 'Amira')
        ->assertJsonPath('result.data.0.id', $contact->id)
        ->assertJsonMissing(['secret']);
});

test('settings and connector apis still omit secrets after live tools', function () {
    enableAgentTools();

    $user = User::factory()->create();
    enableWorkspaceAgent($user, ['token' => 'super-secret-runtime']);
    connectAgentConnector($user, 'browser-use', [
        'url' => 'http://browser-use.test',
        'token' => 'bu-secret',
    ]);

    $this->actingAs($user)
        ->get('/settings/agent')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/agent')
            ->missing('onboarding.token')
            ->missing('onboarding.access_token')
            ->has('plugins')
            ->has('connectors'));

    $this->actingAs($user)
        ->getJson('/api/agent/connectors')
        ->assertOk()
        ->assertJsonFragment(['id' => 'browser-use', 'connected' => true])
        ->assertJsonMissing(['super-secret-runtime'])
        ->assertJsonMissing(['bu-secret']);
});
