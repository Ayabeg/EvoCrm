<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property list<string>|null $options
 */
#[Fillable(['workspace_id', 'entity', 'key', 'label', 'type', 'options', 'group_name', 'required'])]
class CustomAttributeDefinition extends Model
{
    use BelongsToWorkspace;

    public const TYPES = ['text', 'number', 'date', 'select'];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'required' => 'boolean',
        ];
    }

    public function normalizedType(): string
    {
        return $this->type === 'list' ? 'select' : $this->type;
    }

    /**
     * @return list<string>
     */
    public function optionList(): array
    {
        return $this->options ?? [];
    }

    /**
     * @return HasMany<CustomAttributeValue, $this>
     */
    public function values(): HasMany
    {
        return $this->hasMany(CustomAttributeValue::class, 'definition_id');
    }
}
