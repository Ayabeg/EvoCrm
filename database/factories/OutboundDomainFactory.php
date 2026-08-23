<?php

namespace Database\Factories;

use App\Models\OutboundDomain;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OutboundDomain>
 */
class OutboundDomainFactory extends Factory
{
    public function definition(): array
    {
        $domain = fake()->unique()->domainName();

        return [
            'workspace_id' => Workspace::factory(),
            'domain' => $domain,
            'status' => OutboundDomain::STATUS_UNVERIFIED,
            'spf_record' => 'v=spf1 mx ~all',
            'dkim_selector' => 'default',
            'dkim_record' => null,
            'dmarc_record' => OutboundDomain::defaultDmarc($domain),
        ];
    }
}
