<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use App\Support\ReportWidgets;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Saved Reports dashboard — a named set of EvoViz widgets on top of
 * the default rooms. Additive: rooms stay at /reports; these rows are
 * extra boards a user can open, filter, and add charts to.
 *
 * @property int $id
 * @property int $workspace_id
 * @property int $owner_id
 * @property string $name
 * @property list<array{key: string}>|null $widgets
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User|null $owner
 */
#[Fillable(['workspace_id', 'owner_id', 'name', 'visibility', 'widgets'])]
class Dashboard extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'widgets' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return list<string>
     */
    public function widgetKeys(): array
    {
        $widgets = $this->widgets ?? [];

        return collect($widgets)
            ->map(function (mixed $widget): ?string {
                if (is_string($widget) && ReportWidgets::get($widget) !== null) {
                    return $widget;
                }

                if (is_array($widget) && isset($widget['key']) && is_string($widget['key']) && ReportWidgets::get($widget['key']) !== null) {
                    return $widget['key'];
                }

                return null;
            })
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  list<string>  $keys
     */
    public function setWidgetKeys(array $keys): void
    {
        $this->widgets = collect($keys)
            ->filter(fn (string $key) => ReportWidgets::get($key) !== null)
            ->unique()
            ->values()
            ->map(fn (string $key) => ['key' => $key])
            ->all();
    }
}
