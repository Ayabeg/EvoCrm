<?php

namespace App\Services\Ai;

/**
 * Frontend may send page + entity type + entity id only.
 * Extra keys (facts, summaries, records, prompts) are ignored.
 */
final class AskEvoContextRequest
{
    public const PAGES = [
        'workspace',
        'dashboard',
        'activation',
        'contact',
        'company',
        'deal',
        'quote',
        'inbox',
        'activity',
        'automation',
        'qrd',
    ];

    public function __construct(
        public readonly string $page,
        public readonly ?string $entityType,
        public readonly ?int $entityId,
        public readonly ?string $scopeKey = null,
    ) {}

    /**
     * @param  array<string, mixed>  $input
     */
    public static function fromInput(array $input): self
    {
        $page = self::normalizePage($input['page'] ?? 'workspace');
        $entityType = self::normalizeEntityType($input['entity_type'] ?? $input['entityType'] ?? null);
        $entityId = self::normalizeEntityId($input['entity_id'] ?? $input['entityId'] ?? null);
        $scopeKey = isset($input['scope_key']) && is_string($input['scope_key'])
            ? trim($input['scope_key'])
            : null;

        return new self(
            $page,
            $entityType,
            $entityId,
            $scopeKey !== '' ? $scopeKey : null,
        );
    }

    public static function forRecord(string $type, int $id): self
    {
        $kind = AskEvoContextKind::tryFrom($type) ?? AskEvoContextKind::Workspace;

        return new self($kind->value, $kind->value, $id);
    }

    public function resolvedKind(): AskEvoContextKind
    {
        if ($this->page === 'qrd') {
            $fromQrd = $this->entityType ? AskEvoContextKind::tryFrom($this->entityType) : null;

            return $fromQrd?->isSupportedRecord()
                ? $fromQrd
                : AskEvoContextKind::Workspace;
        }

        if ($this->page === 'inbox') {
            return $this->entityId && $this->entityId > 0
                ? AskEvoContextKind::InboxConversation
                : AskEvoContextKind::Workspace;
        }

        if (in_array($this->page, ['activity', 'automation'], true)) {
            if ($this->entityId && $this->entityId > 0) {
                return $this->page === 'activity'
                    ? AskEvoContextKind::Activity
                    : AskEvoContextKind::Automation;
            }

            return AskEvoContextKind::Workspace;
        }

        return AskEvoContextKind::tryFrom($this->page) ?? AskEvoContextKind::Workspace;
    }

    private static function normalizePage(mixed $page): string
    {
        $value = is_string($page) ? trim($page) : 'workspace';

        return in_array($value, self::PAGES, true) ? $value : 'workspace';
    }

    private static function normalizeEntityType(mixed $type): ?string
    {
        if (! is_string($type) || $type === '') {
            return null;
        }

        $value = strtolower(trim($type));

        if (! preg_match('/^[a-z][a-z0-9_]*$/', $value)) {
            return null;
        }

        return $value;
    }

    private static function normalizeEntityId(mixed $id): ?int
    {
        if (is_int($id)) {
            return $id > 0 ? $id : null;
        }

        if (is_string($id) && ctype_digit($id)) {
            $value = (int) $id;

            return $value > 0 ? $value : null;
        }

        return null;
    }
}
