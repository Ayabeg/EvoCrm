<?php

use App\Models\Dashboard;
use App\Models\SavedReport;
use App\Models\ScheduledReport;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

it('creates pauses and deletes a report schedule', function () {
    $user = User::factory()->create();
    $report = SavedReport::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $user->id,
        'name' => 'Pipeline weekly',
        'entity' => 'deal',
        'metric' => 'count',
    ]);

    $this->actingAs($user)
        ->post('/reports/schedules', [
            'name' => 'Monday pipeline',
            'saved_report_id' => $report->id,
            'cron' => '0 8 * * 1',
            'recipients' => ['ops@evotechly.com'],
            'active' => true,
        ])
        ->assertRedirect();

    $schedule = ScheduledReport::query()->where('name', 'Monday pipeline')->sole();

    $this->actingAs($user)
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('schedules', 1)->where('schedules.0.name', 'Monday pipeline'));

    $this->actingAs($user)
        ->put("/reports/schedules/{$schedule->id}", [
            'recipients' => ['ops@evotechly.com'],
            'active' => false,
        ])
        ->assertRedirect();

    expect($schedule->fresh()->active)->toBeFalse();

    $this->actingAs($user)
        ->delete("/reports/schedules/{$schedule->id}")
        ->assertRedirect();

    expect(ScheduledReport::query()->whereKey($schedule->id)->exists())->toBeFalse();
});

it('delivers a rendered report once per window and records failure', function () {
    Mail::fake();
    $user = User::factory()->create();
    $dashboard = Dashboard::query()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $user->id,
        'name' => 'Team board',
        'visibility' => 'workspace',
        'widgets' => [['key' => 'pipeline.evoviz.bar']],
    ]);
    $schedule = ScheduledReport::query()->create([
        'workspace_id' => $user->workspace_id,
        'dashboard_id' => $dashboard->id,
        'name' => 'Daily board',
        'cron' => '0 8 * * *',
        'recipients' => ['ops@evotechly.com'],
        'active' => true,
    ]);

    $this->artisan('reports:deliver')->assertSuccessful();
    Mail::assertSentCount(1);
    expect($schedule->fresh()->last_status)->toBe('sent')
        ->and($schedule->fresh()->last_window)->toBe(now('Africa/Algiers')->toDateString());

    $this->artisan('reports:deliver')->assertSuccessful();
    Mail::assertSentCount(1);

    $broken = ScheduledReport::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Broken',
        'cron' => '0 8 * * *',
        'recipients' => [],
        'active' => true,
    ]);

    $this->artisan('reports:deliver')->assertSuccessful();
    expect($broken->fresh()->last_status)->toBe('failed')
        ->and($broken->fresh()->last_error)->toContain('recipients');
});
