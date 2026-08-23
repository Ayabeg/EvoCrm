<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\OutboundTemplateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['workspace_id', 'name', 'subject', 'body', 'body_html'])]
class OutboundTemplate extends Model
{
    /** @use HasFactory<OutboundTemplateFactory> */
    use BelongsToWorkspace, HasFactory;
}
