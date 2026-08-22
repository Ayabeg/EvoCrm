<?php

namespace App\Models;

use App\Enums\ChannelType;
use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['workspace_id', 'type', 'name', 'status', 'config'])]
class Channel extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'type' => ChannelType::class,
            'config' => 'array',
        ];
    }

    public function threads(): HasMany
    {
        return $this->hasMany(Thread::class);
    }
}
