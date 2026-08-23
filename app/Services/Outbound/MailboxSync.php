<?php

namespace App\Services\Outbound;

use App\Models\Mailbox;
use App\Models\Workspace;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * Syncs mailboxes from the live mail stack (EvoOutreach) into the workspace.
 * The stack is reached over its HTTP API only — Authorization: Bearer token,
 * GET /api/mailbox/all, with a paginated GET /api/mailbox/list fallback.
 * Sends still go out over official SMTP per mailbox; replies are polled over
 * IMAP; webmail is Roundcube. The stack's own marketing dashboard is never
 * called, linked, or embedded.
 */
class MailboxSync
{
    public const ENDPOINT_ALL = '/api/mailbox/all';

    public const ENDPOINT_LIST = '/api/mailbox/list';

    public const PAGE_SIZE = 100;

    public const MAX_PAGES = 50;

    public function configured(): bool
    {
        return filled(config('evosales.mail_stack.api_token'));
    }

    /**
     * @return array{ok: bool, reason: string|null, created: int, updated: int, total: int}
     */
    public function sync(Workspace $workspace): array
    {
        $empty = ['created' => 0, 'updated' => 0, 'total' => 0];

        if (! $this->configured()) {
            return [
                'ok' => false,
                'reason' => 'Mail stack is not connected. Set EVOSALES_MAIL_API_TOKEN to sync mailboxes automatically.',
                ...$empty,
            ];
        }

        $fetched = $this->fetchMailboxes();

        if (! $fetched['ok']) {
            return ['ok' => false, 'reason' => $fetched['reason'], ...$empty];
        }

        $created = 0;
        $updated = 0;

        foreach ($fetched['mailboxes'] as $row) {
            $this->upsert($workspace, $row) === 'created' ? $created++ : $updated++;
        }

        return [
            'ok' => true,
            'reason' => null,
            'created' => $created,
            'updated' => $updated,
            'total' => count($fetched['mailboxes']),
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     */
    protected function upsert(Workspace $workspace, array $row): string
    {
        $email = strtolower(trim((string) $row['username']));

        $mailbox = Mailbox::query()
            ->forWorkspace($workspace)
            ->where(function ($query) use ($email) {
                $query->whereRaw('LOWER(from_address) = ?', [$email])
                    ->orWhereRaw('LOWER(username) = ?', [$email]);
            })
            ->first();

        $fullName = trim((string) ($row['full_name'] ?? ''));
        $active = array_key_exists('active', $row)
            ? filter_var($row['active'], FILTER_VALIDATE_BOOLEAN)
            : true;

        $smtp = config('evosales.mail_stack.smtp');
        $imap = config('evosales.mail_stack.imap');

        $attributes = [
            'source' => Mailbox::SOURCE_MAIL_STACK,
            'from_address' => $email,
            'username' => $email,
            'host' => $smtp['host'],
            'port' => (int) $smtp['port'],
            'encryption' => $smtp['encryption'],
            'imap_host' => $imap['host'],
            'imap_port' => (int) $imap['port'],
            'imap_encryption' => $imap['encryption'],
            'imap_username' => $email,
            'enabled' => $active,
        ];

        if ($fullName !== '') {
            $attributes['name'] = $fullName;
            $attributes['from_name'] = $fullName;
        }

        $apiPassword = (string) ($row['password'] ?? '');

        if ($mailbox) {
            $mailbox->fill($attributes);

            if ($apiPassword !== '') {
                $mailbox->password = $apiPassword;
                $mailbox->imap_password = $apiPassword;
            }

            $this->reconcileStatus($mailbox);
            $mailbox->save();

            return 'updated';
        }

        $mailbox = new Mailbox([
            ...$attributes,
            'workspace_id' => $workspace->id,
            'name' => $fullName !== '' ? $fullName : $email,
            'from_name' => $fullName !== '' ? $fullName : ($row['local_part'] ?? $email),
            'password' => $apiPassword,
            'imap_password' => $apiPassword,
            'is_default' => ! Mailbox::query()->forWorkspace($workspace)->where('is_default', true)->exists(),
            'status' => $active ? 'warming' : 'disabled',
            'daily_limit' => 50,
        ]);
        $mailbox->save();

        return 'created';
    }

    /**
     * The stack owns enabled; the operator owns the warmup mark. Never
     * downgrade an operator's "active" — only fix the disabled mismatch.
     */
    protected function reconcileStatus(Mailbox $mailbox): void
    {
        if (! $mailbox->enabled) {
            $mailbox->status = 'disabled';
        } elseif ($mailbox->status === 'disabled') {
            $mailbox->status = 'warming';
        }
    }

    /**
     * @return array{ok: bool, reason: string|null, mailboxes: array<int, array<string, mixed>>}
     */
    protected function fetchMailboxes(): array
    {
        try {
            $response = $this->client()->get($this->url(self::ENDPOINT_ALL));

            if ($response->successful()) {
                $list = $this->extractList($response->json());

                if ($list !== null) {
                    return ['ok' => true, 'reason' => null, 'mailboxes' => $list];
                }
            }

            return $this->fetchMailboxesPaginated();
        } catch (\Throwable $e) {
            return ['ok' => false, 'reason' => 'Mail stack API unreachable: '.$e->getMessage(), 'mailboxes' => []];
        }
    }

    /**
     * @return array{ok: bool, reason: string|null, mailboxes: array<int, array<string, mixed>>}
     */
    protected function fetchMailboxesPaginated(): array
    {
        $mailboxes = [];

        for ($page = 1; $page <= self::MAX_PAGES; $page++) {
            $response = $this->client()->get($this->url(self::ENDPOINT_LIST), [
                'page' => $page,
                'page_size' => self::PAGE_SIZE,
            ]);

            if (! $response->successful()) {
                return [
                    'ok' => false,
                    'reason' => "Mail stack API answered HTTP {$response->status()} on ".self::ENDPOINT_LIST.'.',
                    'mailboxes' => [],
                ];
            }

            $list = $this->extractList($response->json());

            if ($list === null) {
                return [
                    'ok' => false,
                    'reason' => 'Mail stack API returned an unreadable mailbox payload.',
                    'mailboxes' => [],
                ];
            }

            $mailboxes = [...$mailboxes, ...$list];

            if (count($list) < self::PAGE_SIZE) {
                break;
            }
        }

        return ['ok' => true, 'reason' => null, 'mailboxes' => $mailboxes];
    }

    /**
     * Tolerates the common envelopes: a bare list, {data: [...]},
     * {list: [...]}, or a paginated {data: {list: [...], total: N}}.
     *
     * @return array<int, array<string, mixed>>|null
     */
    protected function extractList(mixed $payload): ?array
    {
        if (! is_array($payload)) {
            return null;
        }

        $candidates = [
            $payload['data']['list'] ?? null,
            $payload['data'] ?? null,
            $payload['list'] ?? null,
            $payload,
        ];

        foreach ($candidates as $candidate) {
            if (is_array($candidate) && array_is_list($candidate)) {
                return array_values(array_filter(
                    $candidate,
                    fn ($row) => is_array($row) && filled($row['username'] ?? null),
                ));
            }
        }

        return null;
    }

    protected function client(): PendingRequest
    {
        return Http::timeout(15)
            ->acceptJson()
            ->withToken((string) config('evosales.mail_stack.api_token'));
    }

    protected function url(string $path): string
    {
        return rtrim((string) config('evosales.mail_stack.api_url'), '/').$path;
    }
}
