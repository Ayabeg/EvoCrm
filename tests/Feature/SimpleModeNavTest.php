<?php

use App\Enums\WorkspaceRole;
use App\Models\User;
use App\Services\Identity\WorkspaceProvisioner;

function simpleModeOwner(): User
{
    $workspace = app(WorkspaceProvisioner::class)->provision('Soft Launch Clinic');

    return User::factory()->create([
        'workspace_id' => $workspace->id,
        'role' => WorkspaceRole::Owner,
    ]);
}

function inertiaNav(mixed $page): array
{
    return collect($page->toArray()['props']['nav'] ?? [])
        ->map(fn (array $item): array => [
            'id' => $item['id'] ?? null,
            'href' => $item['href'] ?? null,
            'label' => $item['label'] ?? null,
        ])
        ->all();
}

it('turns simple mode on for a newly provisioned workspace', function () {
    $workspace = app(WorkspaceProvisioner::class)->provision('Brand New Clinic');

    expect($workspace->simple_mode)->toBeTrue();
});

it('hides tickets, SMS, and a second kanban from Inertia nav on a new workspace', function () {
    $user = simpleModeOwner();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(function ($page) {
            $page->where('simpleMode', true)
                ->where('workspace.simple_mode', true)
                ->where('features.tickets', false)
                ->where('features.sms', false)
                ->where('features.ask_evo', false)
                ->has('nav', 5);

            $nav = inertiaNav($page);
            $hrefs = collect($nav)->pluck('href')->all();
            $ids = collect($nav)->pluck('id')->all();

            expect($ids)->toBe(['home', 'contacts', 'deals', 'inbox', 'quotes'])
                ->and($hrefs)->toBe([
                    '/dashboard',
                    '/crm/contacts',
                    '/crm/deals',
                    '/inbox',
                    '/crm/quotes',
                ])
                ->and($hrefs)->not->toContain('/crm/tickets')
                ->and($hrefs)->not->toContain('/settings/sms')
                ->and($hrefs)->not->toContain('/crm/leads')
                ->and($hrefs)->not->toContain('/ads')
                ->and($hrefs)->not->toContain('/outbound/warmup')
                ->and($hrefs)->not->toContain('/crm/report-builder')
                ->and($hrefs)->not->toContain('/crm/deals/board');
        });
});

it('lets the owner open quotes and the deals board while simple mode is on', function () {
    $user = simpleModeOwner();

    $this->actingAs($user)
        ->get('/crm/quotes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/quotes/index'));
});

it('lets the owner open the deals board while simple mode is on', function () {
    $user = simpleModeOwner();

    $this->actingAs($user)
        ->get('/crm/deals/board')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('crm/deals/board'));
});
