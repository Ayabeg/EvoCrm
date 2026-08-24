<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'workspace_id',
    'name',
    'slug',
    'is_default',
    'config',
])]
class ConversionFunnel extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'config' => 'array',
        ];
    }

    public function stages(): HasMany
    {
        return $this->hasMany(ConversionFunnelStage::class)->orderBy('position');
    }

    public function events(): HasMany
    {
        return $this->hasMany(FunnelEvent::class);
    }
}
