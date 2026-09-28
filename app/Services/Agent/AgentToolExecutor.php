<?php

namespace App\Services\Agent;

use App\Http\Controllers\Api\V1\Support\ApiPayload;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Quote;
use App\Models\Thread;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class AgentToolExecutor
{
    public function __construct(
        private AgentCatalog $catalog,
        private AgentWorkspaceSettings $settings,
        private AgentMcpClient $mcp,
    ) {}

    /**
     * @param  array<string, mixed>  $arguments
     * @return array{ok: bool, tool: string, status: string, result: mixed, invocation: array{name: string, args: array<string, mixed>, status: string}}
     */
    public function execute(Workspace $workspace, string $tool, array $arguments): array
    {
        if ($this->catalog->tool($tool) === null) {
            abort(response()->json([
                'ok' => false,
                'error' => 'unknown_tool',
                'message' => 'Unknown tool.',
            ], 404));
        }

        if (! $this->settings->toolAllowed($workspace, $tool)) {
            abort(response()->json([
                'ok' => false,
                'error' => 'tool_forbidden',
                'message' => 'This tool is not enabled for the workspace.',
            ], 403));
        }

        $this->rejectIfSend($tool, $arguments);

        $result = match ($tool) {
            'crm.search' => $this->search($workspace, $arguments),
            'crm.get' => $this->get($workspace, $arguments),
            'crm.draft_note' => $this->draftNote($workspace, $arguments),
            'crm.draft_email' => $this->draftEmail($workspace, $arguments),
            'crm.draft_reply' => $this->draftReply($workspace, $arguments),
            'desk.list_threads' => $this->listThreads($workspace, $arguments),
            'desk.get_thread' => $this->getThread($workspace, $arguments),
            'browser.research' => $this->browserResearch($workspace, $arguments),
            'mcp.list_tools' => $this->mcpList($workspace),
            'mcp.call' => $this->mcpCall($workspace, $arguments),
            default => abort(response()->json([
                'ok' => false,
                'error' => 'unknown_tool',
                'message' => 'Unknown tool.',
            ], 404)),
        };

        return [
            'ok' => true,
            'tool' => $tool,
            'status' => 'ok',
            'result' => $result,
            'invocation' => [
                'name' => $tool,
                'args' => $this->summarizeArgs($arguments),
                'status' => 'ok',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    private function search(Workspace $workspace, array $arguments): array
    {
        $type = $this->normalizeType($arguments['type'] ?? 'contact');
        $query = trim((string) ($arguments['q'] ?? $arguments['query'] ?? ''));
        $limit = min(25, max(1, (int) ($arguments['limit'] ?? 10)));

        $rows = match ($type) {
            'contact' => $this->searchContacts($workspace, $query, $limit),
            'company' => $this->searchCompanies($workspace, $query, $limit),
            'deal' => $this->searchDeals($workspace, $query, $limit),
            'lead' => $this->searchLeads($workspace, $query, $limit),
            'quote' => $this->searchQuotes($workspace, $query, $limit),
            'all' => [
                'contacts' => $this->searchContacts($workspace, $query, $limit),
                'companies' => $this->searchCompanies($workspace, $query, $limit),
                'deals' => $this->searchDeals($workspace, $query, $limit),
                'leads' => $this->searchLeads($workspace, $query, $limit),
                'quotes' => $this->searchQuotes($workspace, $query, $limit),
            ],
            default => abort(response()->json([
                'ok' => false,
                'error' => 'invalid_type',
                'message' => 'Supported types: contact, company, deal, lead, quote, all.',
            ], 422)),
        };

        return [
            'type' => $type,
            'q' => $query,
            'data' => $rows,
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    private function get(Workspace $workspace, array $arguments): array
    {
        $type = $this->normalizeType($arguments['type'] ?? 'contact');
        $id = (int) ($arguments['id'] ?? 0);

        abort_if($id < 1, response()->json([
            'ok' => false,
            'error' => 'invalid_id',
            'message' => 'A record id is required.',
        ], 422));

        $record = match ($type) {
            'contact' => Contact::query()->forWorkspace($workspace)->find($id),
            'company' => Company::query()->forWorkspace($workspace)->find($id),
            'deal' => Deal::query()->forWorkspace($workspace)->find($id),
            'lead' => Lead::query()->forWorkspace($workspace)->find($id),
            'quote' => Quote::query()->forWorkspace($workspace)->find($id),
            default => abort(response()->json([
                'ok' => false,
                'error' => 'invalid_type',
                'message' => 'Supported types: contact, company, deal, lead, quote.',
            ], 422)),
        };

        abort_unless($record, 404);

        return [
            'type' => $type,
            'data' => $this->payload($record),
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    private function draftNote(Workspace $workspace, array $arguments): array
    {
        $this->rejectIfSend('crm.draft_note', $arguments);

        return [
            'draft' => true,
            'sent' => false,
            'type' => 'note',
            'subject' => trim((string) ($arguments['subject'] ?? 'Note')),
            'body' => trim((string) ($arguments['body'] ?? $arguments['text'] ?? '')),
            'record_type' => $this->nullableString($arguments['record_type'] ?? null),
            'record_id' => isset($arguments['record_id']) ? (int) $arguments['record_id'] : null,
            'workspace_id' => $workspace->id,
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    private function draftEmail(Workspace $workspace, array $arguments): array
    {
        $this->rejectIfSend('crm.draft_email', $arguments);

        $contact = null;
        if (! empty($arguments['contact_id'])) {
            $contact = Contact::query()->forWorkspace($workspace)->find((int) $arguments['contact_id']);
        }

        $name = $contact?->displayName() ?? 'there';
        $intent = trim((string) ($arguments['intent'] ?? 'follow_up'));
        $subject = trim((string) ($arguments['subject'] ?? ($intent === 'follow_up' ? 'Suite à notre échange' : 'EvoCRM')));
        $body = trim((string) ($arguments['body'] ?? "Bonjour {$name}, je reviens vers vous concernant notre échange."));

        return [
            'draft' => true,
            'sent' => false,
            'type' => 'email',
            'intent' => $intent,
            'subject' => $subject,
            'body' => $body,
            'contact_id' => $contact?->id,
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    private function draftReply(Workspace $workspace, array $arguments): array
    {
        $this->rejectIfSend('crm.draft_reply', $arguments);

        $thread = null;
        if (! empty($arguments['thread_id'])) {
            $thread = Thread::query()->forWorkspace($workspace)->with('contact')->find((int) $arguments['thread_id']);
        }

        $name = $thread?->contact?->displayName() ?? 'there';
        $body = trim((string) ($arguments['body'] ?? "Bonjour {$name}, merci pour votre message. Je reviens vers vous rapidement."));

        return [
            'draft' => true,
            'sent' => false,
            'type' => 'reply',
            'thread_id' => $thread?->id,
            'body' => $body,
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    private function listThreads(Workspace $workspace, array $arguments): array
    {
        $limit = min(25, max(1, (int) ($arguments['limit'] ?? 10)));

        $threads = Thread::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'channel'])
            ->orderByDesc('last_message_at')
            ->limit($limit)
            ->get();

        return [
            'data' => $threads->map(fn (Thread $thread) => ApiPayload::thread($thread))->values()->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    private function getThread(Workspace $workspace, array $arguments): array
    {
        $id = (int) ($arguments['id'] ?? $arguments['thread_id'] ?? 0);
        abort_if($id < 1, response()->json([
            'ok' => false,
            'error' => 'invalid_id',
            'message' => 'A thread id is required.',
        ], 422));

        $thread = Thread::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'channel', 'messages'])
            ->find($id);

        abort_unless($thread, 404);

        return [
            'data' => [
                ...ApiPayload::thread($thread),
                'messages' => $thread->messages
                    ->map(fn ($message) => ApiPayload::message($message))
                    ->values()
                    ->all(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    private function browserResearch(Workspace $workspace, array $arguments): array
    {
        $credentials = $this->requireConnector($workspace, 'browser-use');
        $query = trim((string) ($arguments['query'] ?? $arguments['q'] ?? ''));

        abort_if($query === '', response()->json([
            'ok' => false,
            'error' => 'invalid_query',
            'message' => 'A research query is required.',
        ], 422));

        $listed = [];
        try {
            $listed = $this->mcp->listTools($credentials);
        } catch (\Throwable) {
            $listed = [];
        }

        $names = array_column($listed, 'name');
        $toolName = 'browser_research';
        foreach (['browser_research', 'research', 'browser_use'] as $candidate) {
            if (in_array($candidate, $names, true)) {
                $toolName = $candidate;
                break;
            }
        }
        if ($names !== [] && ! in_array($toolName, $names, true)) {
            $toolName = $names[0];
        }

        return [
            'query' => $query,
            'mcp_tool' => $toolName,
            'data' => $this->mcp->callTool($credentials, $toolName, ['query' => $query]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mcpList(Workspace $workspace): array
    {
        return [
            'data' => $this->mcp->listTools($this->requireConnector($workspace, 'mcp.custom')),
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    private function mcpCall(Workspace $workspace, array $arguments): array
    {
        $name = trim((string) ($arguments['name'] ?? $arguments['tool'] ?? ''));
        abort_if($name === '', response()->json([
            'ok' => false,
            'error' => 'invalid_tool',
            'message' => 'An MCP tool name is required.',
        ], 422));

        $toolArguments = $arguments['arguments'] ?? [];
        if (! is_array($toolArguments)) {
            $toolArguments = [];
        }

        return [
            'name' => $name,
            'data' => $this->mcp->callTool(
                $this->requireConnector($workspace, 'mcp.custom'),
                $name,
                $toolArguments,
            ),
        ];
    }

    /**
     * @return array{url: string, token: string|null}
     */
    private function requireConnector(Workspace $workspace, string $id): array
    {
        $connectors = collect($this->settings->connectors($workspace))->firstWhere('id', $id);
        abort_unless((bool) ($connectors['connected'] ?? false), response()->json([
            'ok' => false,
            'error' => 'connector_required',
            'message' => 'The required connector is not connected.',
        ], 403));

        $credentials = $this->settings->connectorCredentials($workspace, $id);
        abort_unless($credentials !== null, response()->json([
            'ok' => false,
            'error' => 'connector_required',
            'message' => 'The required connector is not connected.',
        ], 403));

        return $credentials;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchContacts(Workspace $workspace, string $query, int $limit): array
    {
        $rows = Contact::query()
            ->forWorkspace($workspace)
            ->with(['company:id,name', 'owner:id,name'])
            ->when($query !== '', function (Builder $builder) use ($query): void {
                $like = '%'.$query.'%';
                $builder->where(function (Builder $inner) use ($like): void {
                    $inner->where('first_name', 'like', $like)
                        ->orWhere('last_name', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhere('phone', 'like', $like)
                        ->orWhere('phone_e164', 'like', $like);
                });
            })
            ->orderBy('first_name')
            ->limit($limit)
            ->get();

        return $rows->map(fn (Contact $contact) => ApiPayload::contact($contact))->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchCompanies(Workspace $workspace, string $query, int $limit): array
    {
        $rows = Company::query()
            ->forWorkspace($workspace)
            ->when($query !== '', function (Builder $builder) use ($query): void {
                $like = '%'.$query.'%';
                $builder->where(function (Builder $inner) use ($like): void {
                    $inner->where('name', 'like', $like)
                        ->orWhere('domain', 'like', $like);
                });
            })
            ->orderBy('name')
            ->limit($limit)
            ->get();

        return $rows->map(fn (Company $company) => $this->companyPayload($company))->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchDeals(Workspace $workspace, string $query, int $limit): array
    {
        $rows = Deal::query()
            ->forWorkspace($workspace)
            ->with(['stage', 'contact', 'company', 'owner'])
            ->when($query !== '', fn (Builder $builder) => $builder->where('title', 'like', '%'.$query.'%'))
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        return $rows->map(fn (Deal $deal) => ApiPayload::deal($deal))->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchLeads(Workspace $workspace, string $query, int $limit): array
    {
        $rows = Lead::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'company'])
            ->when($query !== '', fn (Builder $builder) => $builder->where('title', 'like', '%'.$query.'%'))
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        return $rows->map(fn (Lead $lead) => ApiPayload::lead($lead))->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchQuotes(Workspace $workspace, string $query, int $limit): array
    {
        $rows = Quote::query()
            ->forWorkspace($workspace)
            ->with(['items', 'deal.contact'])
            ->when($query !== '', fn (Builder $builder) => $builder->where('notes', 'like', '%'.$query.'%'))
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        return $rows->map(fn (Quote $quote) => ApiPayload::quote($quote))->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Model $record): array
    {
        return match (true) {
            $record instanceof Contact => ApiPayload::contact($record),
            $record instanceof Company => $this->companyPayload($record),
            $record instanceof Deal => ApiPayload::deal($record),
            $record instanceof Lead => ApiPayload::lead($record),
            $record instanceof Quote => ApiPayload::quote($record),
            default => ['id' => $record->getKey()],
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function companyPayload(Company $company): array
    {
        return [
            'id' => $company->id,
            'name' => $company->name,
            'domain' => $company->domain,
            'industry' => $company->industry,
            'phone' => $company->phone,
            'city' => $company->city,
            'wilaya' => $company->wilaya,
        ];
    }

    /**
     * @param  array<string, mixed>  $arguments
     */
    private function rejectIfSend(string $tool, array $arguments): void
    {
        $name = strtolower($tool);
        if (str_contains($name, 'send') || str_contains($name, 'dispatch')) {
            $this->forbidSend();
        }

        $action = strtolower((string) ($arguments['action'] ?? $arguments['mode'] ?? ''));
        if (in_array($action, ['send', 'dispatch', 'deliver'], true)) {
            $this->forbidSend();
        }

        foreach (['send', 'send_now', 'deliver'] as $flag) {
            if (filter_var($arguments[$flag] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $this->forbidSend();
            }
        }
    }

    private function forbidSend(): never
    {
        abort(response()->json([
            'ok' => false,
            'error' => 'send_forbidden',
            'message' => 'Draft tools prepare text only. Sending is not allowed.',
        ], 422));
    }

    /**
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    private function summarizeArgs(array $arguments): array
    {
        $blocked = ['token', 'access_token', 'secret', 'password', 'authorization', 'api_key', 'apikey'];
        $out = [];

        foreach ($arguments as $key => $value) {
            if (in_array(strtolower((string) $key), $blocked, true)) {
                continue;
            }

            if (is_array($value)) {
                $value = $this->summarizeArgs($value);
            } elseif (is_string($value) && mb_strlen($value) > 120) {
                $value = mb_substr($value, 0, 120).'…';
            }

            $out[$key] = $value;
        }

        return $out;
    }

    private function normalizeType(mixed $type): string
    {
        $value = strtolower(trim((string) $type));

        return match ($value) {
            'contacts' => 'contact',
            'companies' => 'company',
            'deals' => 'deal',
            'leads' => 'lead',
            'quotes' => 'quote',
            default => $value !== '' ? $value : 'contact',
        };
    }

    private function nullableString(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return trim($value);
    }
}
