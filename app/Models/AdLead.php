<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'ad_account_id',
    'ad_campaign_id',
    'contact_id',
    'lead_id',
    'external_id',
    'form_id',
    'fields',
])]
class AdLead extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'fields' => 'array',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
