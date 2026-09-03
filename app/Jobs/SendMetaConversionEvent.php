<?php

namespace App\Jobs;

use App\Models\MetaConversionEvent;
use App\Services\Meta\MetaConversionsService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendMetaConversionEvent implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public int $timeout = 45;

    public int $uniqueFor = 3600;

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [15, 60, 180, 600];
    }

    public function __construct(public int $eventId) {}

    public function uniqueId(): string
    {
        return 'meta-conversion-'.$this->eventId;
    }

    public function handle(MetaConversionsService $conversions): void
    {
        $event = MetaConversionEvent::query()->find($this->eventId);

        if (! $event || $event->status === MetaConversionEvent::STATUS_SENT) {
            return;
        }

        $result = $conversions->send($event);

        if ($result->status === MetaConversionEvent::STATUS_FAILED) {
            throw new \RuntimeException($result->error ?: 'Meta conversion failed.');
        }
    }
}
