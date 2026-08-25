<?php

namespace App\Services\Operations;

use App\Models\ScheduledCommandRun;
use Illuminate\Console\Events\ScheduledTaskFailed;
use Illuminate\Console\Events\ScheduledTaskFinished;
use Illuminate\Console\Events\ScheduledTaskStarting;
use Illuminate\Console\Scheduling\Event;
use WeakMap;

class ScheduledTaskMonitor
{
    /** @var WeakMap<Event, ScheduledCommandRun> */
    private WeakMap $runs;

    public function __construct(private ScheduledCommandHealth $health)
    {
        $this->runs = new WeakMap;
    }

    public function starting(ScheduledTaskStarting $event): void
    {
        $command = $this->trackedCommand($event->task);

        if ($command !== null) {
            $this->runs[$event->task] = $this->health->start($command);
        }
    }

    public function finished(ScheduledTaskFinished $event): void
    {
        $run = $this->runs[$event->task] ?? null;

        if ($run) {
            $this->health->succeed($run, $event->runtime);
            unset($this->runs[$event->task]);
        }
    }

    public function failed(ScheduledTaskFailed $event): void
    {
        $run = $this->runs[$event->task] ?? null;

        if ($run) {
            $this->health->fail($run, $event->exception);
            unset($this->runs[$event->task]);
        }
    }

    private function trackedCommand(Event $task): ?string
    {
        $description = (string) ($task->description ?? '');
        $definitions = config('operations.scheduled_commands', []);

        return array_key_exists($description, $definitions) ? $description : null;
    }
}
