<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\WorkflowFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $workspace_id
 * @property string $name
 * @property string $trigger
 * @property int|null $trigger_stage_id
 * @property string $action
 * @property array<string, mixed>|null $action_config
 * @property bool $active
 * @property string|null $template_key
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Stage|null $triggerStage
 */
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

    /** @return BelongsTo<Stage, $this> */
    public function triggerStage(): BelongsTo
    {
        return $this->belongsTo(Stage::class, 'trigger_stage_id');
    }

    /**
     * @return array<string, mixed>
     */
    public function config(): array
    {
        $config = $this->getAttribute('action_config');

        return is_array($config) ? $config : [];
    }
}
