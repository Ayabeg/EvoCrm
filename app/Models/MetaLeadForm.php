<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'ad_account_id',
    'external_id',
    'page_id',
    'name',
    'status',
    'locale',
    'questions',
    'last_synced_at',
])]
class MetaLeadForm extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'questions' => 'array',
            'last_synced_at' => 'datetime',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(AdAccount::class, 'ad_account_id');
    }
}
