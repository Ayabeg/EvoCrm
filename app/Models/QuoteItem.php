<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['quote_id', 'name', 'quantity', 'unit_cents', 'total_cents'])]
class QuoteItem extends Model
{
    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }
}
