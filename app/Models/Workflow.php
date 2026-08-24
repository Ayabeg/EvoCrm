<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\WorkflowFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'name',
    'trigger',
    'trigger_stage_id',
    'action',
    'action_config',
    'active',
    'template_key',
])]
class Workflow extends Model
{
    /** @use HasFactory<WorkflowFactory> */
    use BelongsToWorkspace, HasFactory;

    public const TRIGGER_CONTACT_CREATED = 'contact.created';

    public const TRIGGER_DEAL_STAGE_CHANGED = 'deal.stage_changed';

    public const ACTION_CREATE_TASK = 'create_task';

    public const ACTION_ENROLL_SEQUENCE = 'enroll_sequence';

    /**
     * @return list<string>
     */
    public static function triggers(): array
    {
        return [
            self::TRIGGER_CONTACT_CREATED,
            self::TRIGGER_DEAL_STAGE_CHANGED,
        ];
    }

    /**
     * @return list<string>
     */
    public static function actions(): array
    {
        return [
            self::ACTION_CREATE_TASK,
            self::ACTION_ENROLL_SEQUENCE,
        ];
    }

    protected function casts(): array
    {
        return [
            'action_config' => 'array',
            'active' => 'boolean',
        ];
    }

    public function triggerStage(): BelongsTo
    {
        return $this->belongsTo(Stage::class, 'trigger_stage_id');
    }

    /**
     * @return array<string, mixed>
     */
    public function config(): array
    {
        return is_array($this->action_config) ? $this->action_config : [];
    }
}
