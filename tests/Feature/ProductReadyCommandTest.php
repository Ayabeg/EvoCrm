<?php

use App\Console\Commands\ProductReadyCommand;

it('exits 0 when the G6 existence checks pass', function () {
    $this->artisan('evocrm:product-ready')
        ->expectsOutputToContain('QuoteAcceptor present')
        ->expectsOutputToContain('Simple mode (#181) present')
        ->expectsOutputToContain('Sanctum /api/v1 present')
        ->expectsOutputToContain('product-ready checks passed')
        ->assertSuccessful();
});

it('documents the critical Pest list in help and those files exist on disk', function () {
    $this->artisan('help', ['command_name' => 'evocrm:product-ready'])
        ->expectsOutputToContain('Does not run the Pest suite')
        ->assertSuccessful();

    expect(ProductReadyCommand::CRITICAL_PEST)->not->toBeEmpty();

    foreach (ProductReadyCommand::CRITICAL_PEST as $relative) {
        expect(is_file(base_path($relative)))->toBeTrue($relative);
    }
});
