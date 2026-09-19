<?php

namespace App\Services\Ai;

use App\Models\AiInsight;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\User;
use App\Support\SimpleMode;

/**
 * One Ask Evo orchestration path. READ + EXPLAIN. Not a write agent.
 */
class AskEvoCopilot
{
    public function __construct(
        private AskEvoContextResolver $resolver,
        private AskEvoPrompt $prompt,
        private LlmClient $llm,
        private AskEvoLogger $logger,
        private AskEvoRateLimiter $limiter,
        private CommandSearchAdapter $search,
    ) {}

    /**
     * @param  array<string, mixed>  $input
     */
    public function ask(User $user, string $question, array $input): AskEvoResult
    {
        $started = microtime(true);
        $question = trim($question);
        $request = AskEvoContextRequest::fromInput($input);

        if (! SimpleMode::features($user->workspace)['ask_evo']) {
            return $this->fail($this->resolver->resolve($user, $request), 'unauthorized', 'Ask Evo is not available in Simple mode.');
        }

        if ($question === '') {
            $context = $this->resolver->resolve($user, $request);

            return $this->fail($context, 'empty', 'Ask a question about this context.');
        }

        if ($this->limiter->tooManyAttempts($user)) {
            $context = $this->resolver->resolve($user, $request);
            $this->logger->record('rate_limited', $this->meta($user, $context, $question, 'rate_limit', $started));

            return $this->fail($context, 'rate_limit', 'Ask Evo is rate limited. Try again in a minute.');
        }

        $this->limiter->hit($user);

        $context = $this->resolver->resolve($user, $request);

        if ($request->scopeKey && $request->scopeKey !== $context->scopeKey) {
            $this->logger->record('stale', $this->meta($user, $context, $question, 'stale', $started));

            return $this->fail($context, 'stale', 'Context changed. Ask again on the current record.');
        }

        if (! $context->available()) {
            $this->logger->record('unauthorized', $this->meta($user, $context, $question, $context->unavailableCode ?? 'unauthorized', $started));

            return $this->fail($context, $context->unavailableCode ?? 'unauthorized', $context->groundingNote);
        }

        if ($context->kind === AskEvoContextKind::Workspace && $this->looksLikeSearch($question)) {
            $context = $this->resolver->withSearchHits(
                $context,
                $this->search->hits($user, $question),
            );
        }

        $facts = $context->factMap();
        $stub = $this->prompt->stub($question, $facts, $context->label.($context->note ? ' — '.$context->note : '.'));
        $live = $this->llm->completeDetailed($this->prompt->system(), $this->prompt->user($context, $question, $facts));

        $error = $live['error'];
        $answer = $live['text'] ?? $stub;
        $source = $live['source'] ?? 'fields';

        if ($error === 'timeout') {
            $this->logger->record('timeout', $this->meta($user, $context, $question, 'timeout', $started));

            return $this->fail($context, 'timeout', 'Ask Evo timed out. Try again.');
        }

        if ($error === 'rate_limit') {
            $this->logger->record('provider_rate_limit', $this->meta($user, $context, $question, 'rate_limit', $started));

            return $this->fail($context, 'rate_limit', 'The model is rate limited. Try again shortly.');
        }

        if ($error === 'unavailable' && $live['text'] === null && ! $this->llm->available()) {
            $answer = $stub;
            $source = 'fields';
        } elseif ($error === 'unavailable' && $this->llm->available() && $live['text'] === null) {
            $this->logger->record('unavailable', $this->meta($user, $context, $question, 'unavailable', $started));

            return $this->fail($context, 'unavailable', 'Ask Evo is unavailable right now.');
        }

        $this->persist($user, $context, $question, $answer, $source);
        $this->logger->record('completed', $this->meta($user, $context, $question, 'ok', $started, $source));

        return new AskEvoResult(true, $answer, $source, $context, null, '');
    }

    /**
     * @return array{answer: string, source: string, summary: string}
     */
    public function askRecord(Contact|Deal|Company $record, string $question, ?User $user): array
    {
        $kind = match (true) {
            $record instanceof Deal => 'deal',
            $record instanceof Company => 'company',
            default => 'contact',
        };

        if (! $user instanceof User) {
            $user = User::query()->where('workspace_id', $record->workspace_id)->orderBy('id')->first();
        }

        if (! $user instanceof User) {
            return [
                'answer' => 'This context is not available.',
                'source' => 'fields',
                'summary' => 'Unavailable',
            ];
        }

        return $this->ask($user, $question, [
            'page' => $kind,
            'entity_type' => $kind,
            'entity_id' => $record->id,
        ])->toLegacyAsk();
    }

    public function context(User $user, AskEvoContextRequest $request): AskEvoContext
    {
        return $this->resolver->resolve($user, $request);
    }

    private function persist(User $user, AskEvoContext $context, string $question, string $answer, string $source): void
    {
        $workspaceId = (int) $user->workspace_id;
        $subjectId = $context->entityId ?? $workspaceId;

        AiInsight::query()->create([
            'workspace_id' => $workspaceId,
            'subject_type' => $context->kind->value,
            'subject_id' => $subjectId,
            'question' => $question,
            'answer' => $answer,
            'source' => $source,
        ]);
    }

    private function fail(AskEvoContext $context, string $code, string $message): AskEvoResult
    {
        return new AskEvoResult(false, null, 'fields', $context, $code, $message);
    }

    private function looksLikeSearch(string $question): bool
    {
        $hay = mb_strtolower($question);

        return str_contains($hay, 'search')
            || str_contains($hay, 'find')
            || str_contains($hay, 'look up')
            || str_contains($hay, 'who is');
    }

    /**
     * @return array<string, int|string|bool|null>
     */
    private function meta(
        User $user,
        AskEvoContext $context,
        string $question,
        string $outcome,
        float $started,
        ?string $source = null,
    ): array {
        return [
            'workspace_id' => (int) $user->workspace_id,
            'user_id' => (int) $user->id,
            'context_kind' => $context->kind->value,
            'entity_type' => $context->entityType,
            'entity_id' => $context->entityId,
            'scope_key' => $context->scopeKey,
            'question_chars' => mb_strlen($question),
            'fact_count' => count($context->facts),
            'outcome' => $outcome,
            'source' => $source,
            'latency_ms' => (int) round((microtime(true) - $started) * 1000),
        ];
    }
}
