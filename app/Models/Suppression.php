<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\SuppressionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['workspace_id', 'type', 'value', 'reason', 'source'])]
class Suppression extends Model
{
    /** @use HasFactory<SuppressionFactory> */
    use BelongsToWorkspace, HasFactory;
}
