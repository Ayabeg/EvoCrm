<?php

use App\Models\Integration;
use App\Models\ScheduledCommandRun;
use App\Models\User;
use App\Models\Workspace;
use App\Services\Operations\ScheduledCommandHealth;
use Illuminate\Console\Events\ScheduledTaskFinished;
use Illuminate\Console\Events\ScheduledTaskStarting;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Event;

it('records running success and duration without sensitive failure details', function () {
    $health = app(ScheduledCommandHealth::class);

    $run = $health->start('outbound:run');

    expect($run->status)->toBe(ScheduledCommandRun::STATUS_RUNNING)
        ->and($run->started_at)->not->toBeNull();

    $health->succeed($run, 1.234);

    expect($run->fresh()->status)->toBe(ScheduledCommandRun::STATUS_SUCCESS)
        ->and($run->fresh()->duration_ms)->toBe(1234)
        ->and($run->fresh()->finished_at)->not->toBeNull();

    $failed = $health->start('outbound:run');
    $health->fail($failed, new RuntimeException('access_token=secret-value'));

    expect($failed->fresh()->status)->toBe(ScheduledCommandRun::STATUS_FAILED)
        ->and($failed->fresh()->error_type)->toBe(RuntimeException::class)
        ->and($failed->fresh()->error_summary)->not->toContain('secret-value');
});

it('summarizes success failure running and stale states per command', function () {
    $health = app(ScheduledCommandHealth::class);

    $successful = $health->start('outbound:run');
    $health->succeed($successful, 0.5);

    $failed = $health->start('workflow:run');
    $health->fail($failed, new RuntimeException('failed'));

    $health->start('outbound:poll-replies');

    $stale = $health->start('outbound:sync-mailboxes');
    $stale->forceFill(['started_at' => now()->subHour()])->save();

    $summary = collect($health->summary())->keyBy('command');

    expect($summary['outbound:run']['state'])->toBe('success')
        ->and($summary['outbound:run']['last_success_at'])->not->toBeNull()
        ->and($summary['workflow:run']['state'])->toBe('failed')
        ->and($summary['workflow:run']['last_failure_at'])->not->toBeNull()
        ->and($summary['outbound:poll-replies']['state'])->toBe('running')
        ->and($summary['outbound:sync-mailboxes']['state'])->toBe('stale');
});

it('records named Laravel scheduler events through the production listener', function () {
    $task = collect(app(Schedule::class)->events())
        ->first(fn ($event) => $event->description === 'outbound:run');

    expect($task)->not->toBeNull();

    Event::dispatch(new ScheduledTaskStarting($task));
    Event::dispatch(new ScheduledTaskFinished($task, 0.25));

    $run = ScheduledCommandRun::query()->where('command', 'outbound:run')->firstOrFail();

    expect($run->status)->toBe(ScheduledCommandRun::STATUS_SUCCESS)
        ->and($run->duration_ms)->toBe(250);
});

it('keeps workspace-specific health isolated while retaining global runs', function () {
    $health = app(ScheduledCommandHealth::class);
    $first = Workspace::factory()->create();
    $second = Workspace::factory()->create();

    $health->start('outbound:sync-mailboxes', $first);
    $health->start('outbound:sync-mailboxes', $second);
    $health->start('outbound:sync-mailboxes');

    expect(ScheduledCommandRun::query()->forWorkspace($first)->count())->toBe(2)
        ->and(ScheduledCommandRun::query()->forWorkspace($second)->count())->toBe(2);
});

it('shows operational health only to workspace administrators', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $member = User::factory()->create(['role' => 'member']);

    $admin->workspace->integrations()->create([
        'provider' => Integration::PROVIDER_META,
        'status' => 'connected',
        'access_token' => 'secret-value',
        'scopes' => ['ads_management'],
        'connected_at' => now(),
    ]);

    $response = $this->actingAs($admin)
        ->get('/settings/system-health')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/system-health')
            ->has('commands', 14)
            ->has('integrations', 5));

    expect($response->getContent())->not->toContain('secret-value');

    $this->actingAs($member)
        ->get('/settings/system-health')
        ->assertForbidden();
});
