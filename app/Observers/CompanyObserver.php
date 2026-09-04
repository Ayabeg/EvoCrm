<?php

namespace App\Observers;

use App\Models\Company;
use App\Services\Analytics\ProductAnalytics;

class CompanyObserver
{
    public function __construct(private ProductAnalytics $analytics) {}

    public function created(Company $company): void
    {
        $company->loadMissing('workspace');
        $this->analytics->capture(ProductAnalytics::COMPANY_CREATED, [
            'company_id' => $company->id,
            'industry' => $company->industry,
            'city' => $company->city,
        ], null, $company->workspace);
    }
}
