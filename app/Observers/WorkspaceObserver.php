<?php

namespace App\Observers;

use App\Models\Workspace;
use App\Services\Analytics\ProductAnalytics;

class WorkspaceObserver
{
    public function __construct(private ProductAnalytics $analytics) {}

    public function created(Workspace $workspace): void
    {
        $this->analytics->groupIdentify($workspace);
        $this->analytics->capture(
            ProductAnalytics::WORKSPACE_CREATED,
            [
                'workspace_id' => $workspace->id,
                'name' => $workspace->name,
            ],
            null,
            $workspace,
        );
    }
}
