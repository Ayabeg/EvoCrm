<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\OutboundDomainFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A sending domain the operator owns (e.g. evotechly.com). EvoSales stores
 * the SPF/DKIM/DMARC records the operator must publish at their DNS provider
 * and tracks a manual verified/unverified state — no DNS API is called.
 */
#[Fillable([
    'workspace_id',
    'domain',
    'status',
    'spf_record',
    'dkim_selector',
    'dkim_record',
    'dmarc_record',
    'notes',
    'verified_at',
])]
class OutboundDomain extends Model
{
    /** @use HasFactory<OutboundDomainFactory> */
    use BelongsToWorkspace, HasFactory;

    public const STATUS_UNVERIFIED = 'unverified';

    public const STATUS_VERIFIED = 'verified';

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    public function verified(): bool
    {
        return $this->status === self::STATUS_VERIFIED;
    }

    /**
     * The DNS checklist shown to the operator. `ready` means a record value
     * is stored — publishing it at the DNS provider is always manual.
     *
     * @return array<int, array{key: string, label: string, type: string, host: string, value: string|null, ready: bool}>
     */
    public function checklist(): array
    {
        return [
            [
                'key' => 'spf',
                'label' => 'SPF',
                'type' => 'TXT',
                'host' => $this->domain,
                'value' => $this->spf_record,
                'ready' => filled($this->spf_record),
            ],
            [
                'key' => 'dkim',
                'label' => 'DKIM',
                'type' => 'TXT',
                'host' => ($this->dkim_selector ?: 'default').'._domainkey.'.$this->domain,
                'value' => $this->dkim_record,
                'ready' => filled($this->dkim_record),
            ],
            [
                'key' => 'dmarc',
                'label' => 'DMARC',
                'type' => 'TXT',
                'host' => '_dmarc.'.$this->domain,
                'value' => $this->dmarc_record,
                'ready' => filled($this->dmarc_record),
            ],
        ];
    }

    public static function defaultDmarc(string $domain): string
    {
        return 'v=DMARC1; p=quarantine; rua=mailto:postmaster@'.$domain;
    }
}
