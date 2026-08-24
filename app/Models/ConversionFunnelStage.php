<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'conversion_funnel_id',
    'key',
    'label',
    'position',
    'matcher_type',
    'matcher_config',
])]
class ConversionFunnelStage extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'matcher_config' => 'array',
        ];
    }

    public function funnel(): BelongsTo
    {
        return $this->belongsTo(ConversionFunnel::class, 'conversion_funnel_id');
    }
}
