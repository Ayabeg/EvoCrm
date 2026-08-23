<?php

namespace App\Services\People;

/**
 * Outcome of an invite send. `no_mailbox` means the workspace has no
 * enabled mailbox at all — the invite stays pending and the UI says so.
 */
final class InviteSendResult
{
    private function __construct(
        public readonly string $status,
        public readonly ?string $error = null,
    ) {}

    public static function sent(): self
    {
        return new self('sent');
    }

    public static function noMailbox(): self
    {
        return new self('no_mailbox');
    }

    public static function failed(string $error): self
    {
        return new self('failed', $error);
    }

    public function ok(): bool
    {
        return $this->status === 'sent';
    }
}
