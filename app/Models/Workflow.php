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
 * @property string|null $condition_field
 * @property string|null $condition_operator
 * @property string|null $condition_value
 * @property string|null $else_action
 * @property array<string, mixed>|null $else_action_config
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
    'trigger_saved_filter_id',
    'action',
    'action_config',
    'condition_field',
    'condition_operator',
    'condition_value',
    'else_action',
    'else_action_config',
    'active',
    'template_key',
    'delay_minutes',
])]
class Workflow extends Model
{
    /** @use HasFactory<WorkflowFactory> */
    use BelongsToWorkspace, HasFactory;

    public const TRIGGER_CONTACT_CREATED = 'contact.created';

    public const TRIGGER_DEAL_STAGE_CHANGED = 'deal.stage_changed';

    public const TRIGGER_DEAL_CREATED = 'deal.created';

    public const TRIGGER_ENROLLMENT_FINISHED = 'enrollment.finished';

    public const TRIGGER_SEGMENT_ENTERED = 'segment.entered';

    public const TRIGGER_SEGMENT_EXITED = 'segment.exited';

    public const TRIGGER_ENROLLMENT_REPLIED = 'enrollment.replied';

    public const TRIGGER_LEAD_SCORED = 'lead.scored';

    public const TRIGGER_LEAD_QUALIFIED = 'lead.qualified';

    public const TRIGGER_MEETING_BOOKED = 'meeting.booked';

    public const ACTION_CREATE_TASK = 'create_task';

    public const ACTION_ENROLL_SEQUENCE = 'enroll_sequence';

    public const ACTION_SEND_WEBHOOK = 'send_webhook';

    public const ACTION_SET_PROPERTY = 'set_property';

    public const ACTION_ASSIGN_OWNER = 'assign_owner';

    public const ACTION_CREATE_DEAL = 'create_deal';

    public const ACTION_SEND_EMAIL = 'send_email';

    public const ACTION_NOTIFY_USER = 'notify_user';

    public const CONDITION_DEAL_AMOUNT = 'deal.amount';

    public const CONDITION_DEAL_STAGE = 'deal.stage';

    public const OP_EQ = 'eq';

    public const OP_NEQ = 'neq';

    public const OP_GT = 'gt';

    public const OP_GTE = 'gte';

    public const OP_LT = 'lt';

    public const OP_LTE = 'lte';

    public const OP_CONTAINS = 'contains';

    public const OP_IS_SET = 'is_set';

    public const OP_IS_EMPTY = 'is_empty';

    /**
     * @return list<string>
     */
    public static function triggers(): array
    {
        return [
            self::TRIGGER_CONTACT_CREATED,
            self::TRIGGER_DEAL_STAGE_CHANGED,
            self::TRIGGER_DEAL_CREATED,
            self::TRIGGER_ENROLLMENT_FINISHED,
            self::TRIGGER_SEGMENT_ENTERED,
            self::TRIGGER_SEGMENT_EXITED,
            self::TRIGGER_ENROLLMENT_REPLIED,
            self::TRIGGER_LEAD_SCORED,
            self::TRIGGER_LEAD_QUALIFIED,
            self::TRIGGER_MEETING_BOOKED,
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
            self::ACTION_SEND_WEBHOOK,
            self::ACTION_SET_PROPERTY,
            self::ACTION_ASSIGN_OWNER,
            self::ACTION_CREATE_DEAL,
            self::ACTION_SEND_EMAIL,
            self::ACTION_NOTIFY_USER,
        ];
    }

    /**
     * @return list<string>
     */
    public static function operators(): array
    {
        return [
            self::OP_EQ,
            self::OP_NEQ,
            self::OP_GT,
            self::OP_GTE,
            self::OP_LT,
            self::OP_LTE,
            self::OP_CONTAINS,
            self::OP_IS_SET,
            self::OP_IS_EMPTY,
        ];
    }

    /**
     * Built-in condition fields. Contact custom attributes use contact.attr.{key}.
     *
     * @return list<string>
     */
    public static function builtInConditionFields(): array
    {
        return [
            self::CONDITION_DEAL_AMOUNT,
            self::CONDITION_DEAL_STAGE,
            'contact.wilaya',
            'contact.city',
            'contact.source',
            'contact.email',
            'contact.phone',
        ];
    }

    protected function casts(): array
    {
        return [
            'action_config' => 'array',
            'else_action_config' => 'array',
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

    /**
     * @return array<string, mixed>
     */
    public function elseConfig(): array
    {
        $config = $this->getAttribute('else_action_config');

        return is_array($config) ? $config : [];
    }

    public function hasCondition(): bool
    {
        return filled($this->condition_field);
    }

    /**
     * Compare a resolved left-hand value against this workflow's condition.
     */
    public function compare(mixed $left): bool
    {
        $operator = $this->condition_operator ?: self::OP_EQ;
        $right = $this->condition_value;

        if ($operator === self::OP_IS_SET) {
            return $this->isPresent($left);
        }

        if ($operator === self::OP_IS_EMPTY) {
            return ! $this->isPresent($left);
        }

        $leftString = is_scalar($left) || $left === null ? (string) $left : '';
        $rightString = (string) ($right ?? '');

        if (in_array($operator, [self::OP_GT, self::OP_GTE, self::OP_LT, self::OP_LTE], true)) {
            if (! is_numeric($leftString) || ! is_numeric($rightString)) {
                return false;
            }

            $leftNumber = (float) $leftString;
            $rightNumber = (float) $rightString;

            return match ($operator) {
                self::OP_GT => $leftNumber > $rightNumber,
                self::OP_GTE => $leftNumber >= $rightNumber,
                self::OP_LT => $leftNumber < $rightNumber,
                self::OP_LTE => $leftNumber <= $rightNumber,
            };
        }

        return match ($operator) {
            self::OP_EQ => strcasecmp($leftString, $rightString) === 0,
            self::OP_NEQ => strcasecmp($leftString, $rightString) !== 0,
            self::OP_CONTAINS => $rightString !== '' && mb_stripos($leftString, $rightString) !== false,
            default => false,
        };
    }

    private function isPresent(mixed $value): bool
    {
        if ($value === null) {
            return false;
        }

        if (is_string($value)) {
            return trim($value) !== '';
        }

        return true;
    }
}
