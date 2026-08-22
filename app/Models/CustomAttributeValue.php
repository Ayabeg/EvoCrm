<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['workspace_id', 'definition_id', 'entity_type', 'entity_id', 'value'])]
class CustomAttributeValue extends Model
{
    use BelongsToWorkspace;

    public function definition(): BelongsTo
    {
        return $this->belongsTo(CustomAttributeDefinition::class, 'definition_id');
    }
}
