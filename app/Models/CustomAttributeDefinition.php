<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['workspace_id', 'entity', 'key', 'label', 'type', 'options'])]
class CustomAttributeDefinition extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'options' => 'array',
        ];
    }

    public function values(): HasMany
    {
        return $this->hasMany(CustomAttributeValue::class, 'definition_id');
    }
}
