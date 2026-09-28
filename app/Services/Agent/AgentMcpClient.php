<?php

namespace App\Services\Agent;

use Illuminate\Support\Facades\Http;
use Throwable;

class AgentMcpClient
{
    /**
     * @param  array{url: string, token: string|null}  $credentials
     * @return list<array{name: string, description: string}>
     */
    public function listTools(array $credentials): array
    {
        $payload = $this->rpc($credentials, 'tools/list', new \stdClass);

        $tools = $payload['result']['tools'] ?? [];

        return array_values(array_map(fn (array $tool) => [
            'name' => (string) ($tool['name'] ?? ''),
            'description' => (string) ($tool['description'] ?? ''),
        ], array_filter($tools, fn ($tool) => is_array($tool) && filled($tool['name'] ?? null))));
    }

    /**
     * @param  array{url: string, token: string|null}  $credentials
     * @param  array<string, mixed>  $arguments
     * @return array<string, mixed>
     */
    public function callTool(array $credentials, string $name, array $arguments): array
    {
        $payload = $this->rpc($credentials, 'tools/call', [
            'name' => $name,
            'arguments' => $arguments,
        ]);

        return is_array($payload['result'] ?? null) ? $payload['result'] : ['result' => $payload['result'] ?? null];
    }

    /**
     * @param  array{url: string, token: string|null}  $credentials
     * @param  array<string, mixed>|\stdClass  $params
     * @return array<string, mixed>
     */
    private function rpc(array $credentials, string $method, array|\stdClass $params): array
    {
        try {
            $client = Http::acceptJson()
                ->asJson()
                ->timeout(8);

            if (filled($credentials['token'] ?? null)) {
                $client = $client->withToken($credentials['token']);
            }

            $response = $client->post($credentials['url'], [
                'jsonrpc' => '2.0',
                'id' => 1,
                'method' => $method,
                'params' => $params,
            ]);
        } catch (Throwable) {
            abort(response()->json([
                'ok' => false,
                'error' => 'mcp_unreachable',
                'message' => 'The MCP server did not respond.',
            ], 502));
        }

        if (! $response->successful()) {
            abort(response()->json([
                'ok' => false,
                'error' => 'mcp_unreachable',
                'message' => 'The MCP server did not respond.',
            ], 502));
        }

        $body = $response->json();
        if (! is_array($body) || isset($body['error'])) {
            abort(response()->json([
                'ok' => false,
                'error' => 'mcp_error',
                'message' => 'The MCP server rejected the call.',
            ], 502));
        }

        return $body;
    }
}
