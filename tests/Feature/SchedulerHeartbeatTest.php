<?php

use App\Services\Operations\SchedulerHeartbeat;
use Illuminate\Console\Events\ScheduledTaskFinished;
use Illuminate\Console\Events\ScheduledTaskStarting;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;

it('records a scheduler heartbeat and exposes it on /up/scheduler', function () {
    Cache::forget(SchedulerHeartbeat::CACHE_KEY);

    $this->getJson(route('up.scheduler'))
        ->assertStatus(503)
        ->assertJsonPath('scheduler.ok', false)
        ->assertJsonPath('scheduler.last_run_at', null);

    $this->artisan('schedule:heartbeat')
        ->assertSuccessful();

    $status = app(SchedulerHeartbeat::class)->status();

    expect($status['ok'])->toBeTrue()
        ->and($status['last_run_at'])->not->toBeNull()
        ->and($status['stale'])->toBeFalse();

    $this->getJson(route('up.scheduler'))
        ->assertOk()
        ->assertJsonPath('scheduler.ok', true)
        ->assertJsonPath('scheduler.last_run_at', $status['last_run_at']);
});

it('schedules the heartbeat every minute and records it through the monitor', function () {
    $task = collect(app(Schedule::class)->events())
        ->first(fn ($event) => $event->description === 'schedule:heartbeat');

    expect($task)->not->toBeNull();

    Event::dispatch(new ScheduledTaskStarting($task));
    Event::dispatch(new ScheduledTaskFinished($task, 0.01));

    $this->assertDatabaseHas('scheduled_command_runs', [
        'command' => 'schedule:heartbeat',
        'status' => 'success',
    ]);
});
