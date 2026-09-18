<?php

namespace App\Services\Ai;

final class AskEvoResult
{
    public function __construct(
        public readonly bool $ok,
        public readonly ?string $answer,
        public readonly string $source,
        public readonly AskEvoContext $context,
        public readonly ?string $errorCode,
        public readonly string $message,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'ok' => $this->ok,
            'answer' => $this->answer,
            'source' => $this->source,
            'context' => $this->context->present(),
            'error' => $this->errorCode === null ? null : [
                'code' => $this->errorCode,
                'message' => $this->message,
            ],
        ];
    }

    /**
     * Frozen RecordInsight::ask() shape.
     *
     * @return array{answer: string, source: string, summary: string}
     */
    public function toLegacyAsk(): array
    {
        return [
            'answer' => $this->answer ?? $this->message,
            'source' => $this->source,
            'summary' => $this->context->label,
        ];
    }
}
