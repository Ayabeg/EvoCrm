<?php

use App\Models\Contact;
use App\Models\Dashboard;
use App\Models\Deal;
use App\Models\User;
use App\Support\ReportWidgets;
use Illuminate\Testing\TestResponse;

function dashboardDeal(User $user, string $stageSlug, array $attributes = []): Deal
{
    $workspace = $user->workspace;
    $pipeline = $workspace->defaultPipeline();

    return Deal::query()->create(array_merge([
        'workspace_id' => $workspace->id,
        'contact_id' => Contact::factory()->create(['workspace_id' => $workspace->id])->id,
        'pipeline_id' => $pipeline->id,
        'stage_id' => $pipeline->stageBySlug($stageSlug)->id,
        'title' => 'Dashboard deal '.$stageSlug,
        'amount_cents' => 100_000,
        'currency' => 'DZD',
    ], $attributes));
}

/** @return array<string, mixed> */
function dashboardProps(TestResponse $response): array
{
    return $response->viewData('page')['props'];
}

it('creates a saved dashboard with name, owner, and widgets JSON', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/reports/dashboards', [
            'name' => 'My pipeline',
            'widgets' => [['key' => 'pipeline.evoviz.bar']],
        ])
        ->assertRedirect();

    $dashboard = Dashboard::query()->where('name', 'My pipeline')->first();

    expect($dashboard)->not->toBeNull()
        ->and($dashboard->owner_id)->toBe($user->id)
        ->and($dashboard->workspace_id)->toBe($user->workspace_id)
        ->and($dashboard->widgetKeys())->toBe(['pipeline.evoviz.bar']);

    $this->actingAs($user)
        ->get('/reports?dashboard='.$dashboard->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/reports')
            ->where('dashboard.id', $dashboard->id)
            ->where('dashboard.name', 'My pipeline')
            ->where('dashboard.owner.id', $user->id)
            ->where('dashboard.widgets.0.key', 'pipeline.evoviz.bar')
            ->where('dashboards.0.name', 'My pipeline')
        );
});

it('lets a user keep more than the default rooms as saved dashboards', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post('/reports/dashboards', ['name' => 'Q3 review']);
    $this->actingAs($user)->post('/reports/dashboards', ['name' => 'Outbound week']);

    $this->actingAs($user)
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/reports')
            ->has('dashboards', 2)
            ->where('dashboard', null)
            ->where('categories', [])
        );

    expect(Dashboard::query()->forWorkspace($user->workspace)->count())->toBe(2);
});

it('adds a widget from the existing EvoViz catalog and rejects unknown keys', function () {
    $user = User::factory()->create();
    $dashboard = Dashboard::query()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $user->id,
        'name' => 'Board',
        'widgets' => [],
    ]);

    $this->actingAs($user)
        ->from('/reports?dashboard='.$dashboard->id)
        ->post('/reports/dashboards/'.$dashboard->id.'/widgets', [
            'key' => 'leads.evoviz.area',
        ])
        ->assertRedirect();

    expect($dashboard->fresh()->widgetKeys())->toBe(['leads.evoviz.area']);

    $this->actingAs($user)
        ->post('/reports/dashboards/'.$dashboard->id.'/widgets', [
            'key' => 'invented.chart',
        ])
        ->assertSessionHasErrors('key');

    $catalog = collect(dashboardProps($this->actingAs($user)->get('/reports'))['widgetCatalog']);
    expect($catalog->pluck('id')->unique()->every(fn ($id) => str_starts_with((string) $id, 'evoviz.')))->toBeTrue()
        ->and($catalog->pluck('key'))->toContain('pipeline.evoviz.bar', 'leads.evoviz.area')
        ->and(ReportWidgets::keys())->toHaveCount($catalog->count());
});

it('applies owner and date filters to the open dashboard widgets', function () {
    $user = User::factory()->create();
    $other = User::factory()->create(['workspace_id' => $user->workspace_id]);

    dashboardDeal($user, 'won', [
        'owner_id' => $user->id,
        'closed_at' => now(),
        'amount_cents' => 100_000,
    ]);
    dashboardDeal($user, 'won', [
        'owner_id' => $other->id,
        'closed_at' => now(),
        'amount_cents' => 300_000,
    ]);
    dashboardDeal($user, 'won', [
        'owner_id' => $user->id,
        'closed_at' => now()->subDays(45),
        'amount_cents' => 900_000,
    ]);

    $dashboard = Dashboard::query()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $user->id,
        'name' => 'Wins',
        'widgets' => [['key' => 'pipeline.evoviz.donut'], ['key' => 'pipeline.evoviz.area']],
    ]);

    $all = $this->actingAs($user)->get('/reports?dashboard='.$dashboard->id);
    $all->assertOk();
    $allWidgets = collect(dashboardProps($all)['dashboard']['widgets']);
    $donut = $allWidgets->firstWhere('key', 'pipeline.evoviz.donut');
    expect($donut['chart']['series'][0]['data'])->toBe([2, 0])
        ->and($donut['chart']['id'])->toBe('evoviz.donut');

    $mine = $this->actingAs($user)->get('/reports?'.http_build_query([
        'dashboard' => $dashboard->id,
        'owner' => $user->id,
        'from' => now()->subDays(7)->toDateString(),
        'to' => now()->toDateString(),
    ]));
    $mine->assertInertia(fn ($page) => $page
        ->where('window.owner_id', $user->id)
        ->where('window.custom', true)
        ->where('dashboard.id', $dashboard->id)
    );
    $mineDonut = collect(dashboardProps($mine)['dashboard']['widgets'])->firstWhere('key', 'pipeline.evoviz.donut');
    expect($mineDonut['chart']['series'][0]['data'])->toBe([1, 0])
        ->and($mineDonut['chart']['total'])->toBe(1);
});

it('keeps the default rooms on /reports while a dashboard exists', function () {
    $user = User::factory()->create();
    dashboardDeal($user, 'new');
    Dashboard::query()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $user->id,
        'name' => 'Extra board',
        'widgets' => [],
    ]);

    $this->actingAs($user)
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/reports')
            ->where('dashboard', null)
            ->has('categories', 1)
            ->where('categories.0.key', 'pipeline')
            ->has('dashboards', 1)
        );
});

it('hides another workspace dashboard and scopes the list', function () {
    $user = User::factory()->create();
    $stranger = User::factory()->create();
    $theirs = Dashboard::query()->create([
        'workspace_id' => $stranger->workspace_id,
        'owner_id' => $stranger->id,
        'name' => 'Secret',
        'widgets' => [],
    ]);

    $this->actingAs($user)
        ->get('/reports?dashboard='.$theirs->id)
        ->assertNotFound();

    $this->actingAs($user)
        ->post('/reports/dashboards/'.$theirs->id.'/widgets', ['key' => 'pipeline.evoviz.bar'])
        ->assertNotFound();

    $this->actingAs($user)
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('dashboards', 0));
});

it('removes a widget and deletes a dashboard without touching rooms', function () {
    $user = User::factory()->create();
    dashboardDeal($user, 'new');
    $dashboard = Dashboard::query()->create([
        'workspace_id' => $user->workspace_id,
        'owner_id' => $user->id,
        'name' => 'Temp',
        'widgets' => [['key' => 'pipeline.evoviz.bar'], ['key' => 'activity.evoviz.bar']],
    ]);

    $this->actingAs($user)
        ->from('/reports?dashboard='.$dashboard->id)
        ->delete('/reports/dashboards/'.$dashboard->id.'/widgets', [
            'key' => 'activity.evoviz.bar',
        ])
        ->assertRedirect();

    expect($dashboard->fresh()->widgetKeys())->toBe(['pipeline.evoviz.bar']);

    $this->actingAs($user)
        ->delete('/reports/dashboards/'.$dashboard->id)
        ->assertRedirect('/reports');

    expect(Dashboard::query()->find($dashboard->id))->toBeNull();

    $this->actingAs($user)
        ->get('/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('categories', 1)
            ->where('categories.0.key', 'pipeline')
            ->has('dashboards', 0)
        );
});

it('places the dashboards migration after 2026_08_24_220000', function () {
    $files = collect(glob(database_path('migrations/*dashboards*.php')))
        ->map(fn (string $path) => basename($path));

    expect($files)->not->toBeEmpty();

    foreach ($files as $file) {
        expect($file)->toBeGreaterThan('2026_08_24_220000');
    }
});
