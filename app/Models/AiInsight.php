<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'workspace_id',
    'subject_type',
    'subject_id',
    'question',
    'answer',
    'source',
])]
class AiInsight extends Model
{
    use BelongsToWorkspace;

    protected $table = 'record_insights';
}
