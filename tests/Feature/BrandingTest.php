<?php

it('ships the Evotechly mark with artwork fill #EC6025', function () {
    $mark = public_path('brand/evotechly/mark.svg');

    expect(file_exists($mark))->toBeTrue();
    expect(file_get_contents($mark))->toContain('#EC6025');
    expect(file_get_contents($mark))->not->toContain('fill="currentColor"');
});

it('uses the Evotechly mark as the favicon', function () {
    $favicon = public_path('favicon.svg');

    expect(file_exists($favicon))->toBeTrue();
    expect(file_get_contents($favicon))->toContain('#EC6025');
});

it('renders login with the Evotechly lockup', function () {
    $this->get(route('login'))->assertOk()->assertSee('EvoSales', false);
});

it('names the product EvoSales · Evotechly for auth mail', function () {
    expect(config('app.name'))->toBe('EvoSales · Evotechly');
    expect(config('mail.from.name'))->toBe('EvoSales · Evotechly');
});
