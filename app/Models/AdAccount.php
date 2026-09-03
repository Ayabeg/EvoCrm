<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['workspace_id', 'external_id', 'name', 'status', 'currency', 'timezone'])]
class AdAccount extends Model
{
    use BelongsToWorkspace;

    public function campaigns(): HasMany
    {
        return $this->hasMany(AdCampaign::class);
    }

    public function adLeads(): HasMany
    {
        return $this->hasMany(AdLead::class);
    }
}
