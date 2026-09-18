<?php

namespace App\Services\Ai;

/**
 * Server-built bounded context. Never accept this shape from the frontend.
 */
final class AskEvoContext
{
    /**
     * @param  list<array{label: string, value: string}>  $facts
     * @param  list<array{id: string, label: string, question: string}>  $suggestions
     * @param  list<array{id: string, label: string, href: string}>  $actions
     */
    public function __construct(
        public readonly AskEvoContextKind $kind,
        public readonly string $label,
        public readonly string $scopeKey,
        public readonly ?string $entityType,
        public readonly ?int $entityId,
        public readonly array $facts,
        public readonly array $suggestions,
        public readonly array $actions,
        public readonly string $groundingNote,
        public readonly ?string $unavailableCode = null,
        public readonly ?string $note = null,
    ) {}

    public function available(): bool
    {
        return $this->unavailableCode === null;
    }

    /**
     * @return array<string, mixed>
     */
    public function present(): array
    {
        return [
            'kind' => $this->kind->value,
            'label' => $this->label,
            'scope_key' => $this->scopeKey,
            'entity_type' => $this->entityType,
            'entity_id' => $this->entityId,
            'suggestions' => $this->suggestions,
            'actions' => $this->actions,
            'grounding_note' => $this->groundingNote,
            'unavailable_code' => $this->unavailableCode,
            'note' => $this->note,
        ];
    }

    /**
     * @return array<string, string>
     */
    public function factMap(): array
    {
        $map = [];

        foreach ($this->facts as $fact) {
            $map[$fact['label']] = $fact['value'];
        }

        return $map;
    }
}
