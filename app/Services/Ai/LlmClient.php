<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Optional live completion for Ask Evo. Empty OPENAI/ANTHROPIC keys
 * keep RecordInsight on the deterministic field stub.
 */
class LlmClient
{
    /**
     * @return 'openai'|'anthropic'|null
     */
    public function driver(): ?string
    {
        if (filled(config('services.openai.key'))) {
            return 'openai';
        }

        if (filled(config('services.anthropic.key'))) {
            return 'anthropic';
        }

        return null;
    }

    public function available(): bool
    {
        return $this->driver() !== null;
    }

    /**
     * @return array{text: string, source: 'openai'|'anthropic'}|null
     */
    public function complete(string $system, string $prompt): ?array
    {
        $driver = $this->driver();

        if ($driver === null) {
            return null;
        }

        try {
            return $driver === 'openai'
                ? $this->openAi($system, $prompt)
                : $this->anthropic($system, $prompt);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return array{text: string, source: 'openai'}|null
     */
    protected function openAi(string $system, string $prompt): ?array
    {
        $response = Http::timeout((int) config('services.openai.timeout', 8))
            ->withToken((string) config('services.openai.key'))
            ->acceptJson()
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => (string) config('services.openai.model', 'gpt-4o-mini'),
                'temperature' => 0.2,
                'max_tokens' => 220,
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

        if (! $response->successful()) {
            return null;
        }

        $text = trim((string) data_get($response->json(), 'choices.0.message.content', ''));

        return $text === '' ? null : ['text' => $text, 'source' => 'openai'];
    }

    /**
     * @return array{text: string, source: 'anthropic'}|null
     */
    protected function anthropic(string $system, string $prompt): ?array
    {
        $response = Http::timeout((int) config('services.anthropic.timeout', 8))
            ->withHeaders([
                'x-api-key' => (string) config('services.anthropic.key'),
                'anthropic-version' => '2023-06-01',
            ])
            ->acceptJson()
            ->post('https://api.anthropic.com/v1/messages', [
                'model' => (string) config('services.anthropic.model', 'claude-3-5-haiku-latest'),
                'max_tokens' => 220,
                'system' => $system,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

        if (! $response->successful()) {
            return null;
        }

        $text = trim((string) data_get($response->json(), 'content.0.text', ''));

        return $text === '' ? null : ['text' => $text, 'source' => 'anthropic'];
    }
}
