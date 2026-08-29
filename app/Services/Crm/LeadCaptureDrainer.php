<?php

namespace App\Services\Crm;

use App\Models\LeadCapture;

class LeadCaptureDrainer
{
    public function __construct(private LeadCaptureDeduper $deduper) {}

    public function drain(int $limit = 100): int
    {
        $pending = LeadCapture::query()
            ->where('status', LeadCapture::STATUS_NEW)
            ->orderBy('id')
            ->limit(max(1, $limit))
            ->get();

        foreach ($pending as $capture) {
            $this->deduper->process($capture);
        }

        return $pending->count();
    }
}
