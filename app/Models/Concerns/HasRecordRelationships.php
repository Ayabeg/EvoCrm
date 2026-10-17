<?php

namespace App\Models\Concerns;

use App\Models\RecordRelationship;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasRecordRelationships
{
    public function outgoingRelationships(): MorphMany
    {
        return $this->morphMany(RecordRelationship::class, 'fromRecord', 'from_type', 'from_id');
    }

    public function incomingRelationships(): MorphMany
    {
        return $this->morphMany(RecordRelationship::class, 'toRecord', 'to_type', 'to_id');
    }
}
