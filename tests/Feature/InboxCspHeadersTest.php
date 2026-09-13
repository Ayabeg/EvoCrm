<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

it('renders the inbox and sets CSP frame-ancestors for CRM hosts', function () {
    Http::fake(['*' => Http::response('', 200)]);

    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => 'https://desk.evotechly.com']);

    $response = $this->actingAs($user)->get('/inbox');

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('desk/inbox')
            ->where('embedUrl', 'https://desk.evotechly.com/')
        );

    $csp = (string) $response->headers->get('Content-Security-Policy');

    expect($csp)->toContain('frame-ancestors')
        ->and($csp)->toContain('https://evocrmapp.com')
        ->and($csp)->toContain('https://www.evocrmapp.com')
        ->and($csp)->toContain('https://crm.evotechly.com')
        ->and($csp)->toContain('frame-src')
        ->and($csp)->toContain('https://desk.evotechly.com');

    $xfo = strtolower((string) $response->headers->get('X-Frame-Options'));

    expect($xfo)->not->toContain('deny')
        ->and($xfo)->not->toContain('sameorigin');
});

it('keeps the inbox on the CRM host when the desk is framed', function () {
    Http::fake(['*' => Http::response('', 200)]);

    $user = User::factory()->create();
    $user->workspace->update(['inbox_url' => 'https://desk.evotechly.com']);

    $response = $this->actingAs($user)->get('/inbox');

    $response->assertOk();
    expect($response->headers->get('Location'))->toBeNull();
});
