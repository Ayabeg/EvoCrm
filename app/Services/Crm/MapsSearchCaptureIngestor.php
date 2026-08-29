<?php

namespace App\Services\Crm;

use App\Models\LeadCapture;
use App\Models\User;
use App\Models\Workspace;
use App\Support\LeadCaptureNormalizer;

class MapsSearchCaptureIngestor
{
    public function __construct(private LeadCaptureDeduper $deduper) {}

    /**
     * Operator-initiated search: we store the query + the results they chose.
     * This does not scrape Google behind a login.
     *
     * @param  list<array<string, mixed>>  $results
     * @return list<LeadCapture>
     */
    public function ingest(Workspace $workspace, User $actor, string $query, string $wilaya, array $results): array
    {
        $captures = [];

        foreach ($results as $result) {
            if (! is_array($result)) {
                continue;
            }

            $normalized = LeadCaptureNormalizer::normalize([
                'name' => $result['name'] ?? null,
                'phone' => $result['phone'] ?? null,
                'email' => $result['email'] ?? null,
                'company' => $result['company'] ?? ($result['name'] ?? null),
                'wilaya' => $result['wilaya'] ?? $wilaya,
            ]);

            if (
                $normalized['name'] === null
                && $normalized['phone'] === null
                && $normalized['email'] === null
                && $normalized['company'] === null
            ) {
                continue;
            }

            $captures[] = $this->deduper->record(
                $workspace->id,
                LeadCapture::SOURCE_MAPS_SEARCH,
                $normalized,
                [
                    'query' => $query,
                    'wilaya' => $wilaya,
                    'result' => $result,
                ],
                $actor->id,
            );
        }

        return $captures;
    }
}
