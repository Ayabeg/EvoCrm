<?php

namespace App\Jobs;

use App\Models\ImportBatch;
use App\Services\Crm\ContactCsvImporter;
use App\Services\Crm\DealCsvImporter;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessImportBatch implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(public int $batchId) {}

    public function handle(ContactCsvImporter $contacts, DealCsvImporter $deals): void
    {
        $batch = ImportBatch::query()->find($this->batchId);

        if (! $batch) {
            return;
        }

        if ($batch->type === ImportBatch::TYPE_CONTACTS) {
            $contacts->process($batch);

            return;
        }

        if ($batch->type === ImportBatch::TYPE_DEALS) {
            $deals->process($batch);

            return;
        }

        $batch->forceFill([
            'status' => ImportBatch::STATUS_FAILED,
            'error_summary' => 'Unsupported import type.',
            'finished_at' => now(),
        ])->save();
    }
}
