<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'workspace_id',
    'entity',
    'name',
    'body',
    'position',
])]
class Playbook extends Model
{
    use BelongsToWorkspace;
}
