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

    /**
     * Latest public-facts research brief for Home, next to Places.
     *
     * @return array{id: int, subject_type: string, subject_id: int, answer: string|null, source: string, created_at: string|null, href: string|null}|null
     */
    public static function presentLatestBrief(Workspace $workspace): ?array
    {
        $row = static::query()
            ->forWorkspace($workspace)
            ->where('question', 'Research brief')
            ->latest('id')
            ->first();

        if (! $row instanceof self) {
            return null;
        }

        $href = match ($row->subject_type) {
            'company' => '/crm/companies/'.$row->subject_id,
            'deal' => '/crm/deals/'.$row->subject_id,
            default => null,
        };

        return [
            'id' => $row->id,
            'subject_type' => $row->subject_type,
            'subject_id' => $row->subject_id,
            'answer' => $row->answer,
            'source' => $row->source,
            'created_at' => $row->created_at?->timezone('Africa/Algiers')->toIso8601String(),
            'href' => $href,
        ];
    }
}
