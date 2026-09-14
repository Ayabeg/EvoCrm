<?php

it('ships the EvoCrm mark with artwork fill #E8530E', function () {
    $mark = public_path('brand/evocrm/logo.svg');

    expect(file_exists($mark))->toBeTrue();
    expect(file_get_contents($mark))->toContain('#E8530E');
    expect(file_get_contents($mark))->not->toContain('fill="currentColor"');
    expect(file_get_contents($mark))->not->toContain('xmp');
    expect(file_get_contents($mark))->not->toContain('#EC6025');
    expect(file_get_contents($mark))->not->toContain('#d9500f');
});

it('uses the EvoCrm mark as the favicon', function () {
    $favicon = public_path('favicon.svg');

    expect(file_exists($favicon))->toBeTrue();
    expect(file_get_contents($favicon))->toContain('#E8530E');
    expect(file_get_contents($favicon))->not->toContain('#EC6025');
    expect(file_get_contents($favicon))->not->toContain('#d9500f');
});

it('renders login with the EvoCrm lockup', function () {
    $this->get(route('login'))
        ->assertOk()
        ->assertSee('/brand/evocrm/logo.svg', false)
        ->assertSee('#F7F7F5', false);

    expect(file_get_contents(resource_path('js/pages/auth/auth-screen.tsx')))
        ->toContain('EvoCrm')
        ->and(file_get_contents(resource_path('js/components/app-logo.tsx')))
        ->toContain('EvoCrm')
        ->and(file_get_contents(resource_path('js/components/app-logo-icon.tsx')))
        ->toContain('/brand/evocrm/logo.svg');
});

it('names the product EvoCrm · Evotechly for auth mail', function () {
    expect(config('app.name'))->toBe('EvoCrm · Evotechly');
    expect(config('mail.from.name'))->toBe('EvoCrm · Evotechly');
});
