<?php

it('defines independent web queue and scheduler production processes', function () {
    $compose = file_get_contents(base_path('docker-compose.yml'));

    expect($compose)
        ->toContain('  web:')
        ->toContain('php artisan serve --host=0.0.0.0')
        ->toContain('  queue:')
        ->toContain('php artisan queue:work')
        ->toContain('  scheduler:')
        ->toContain('php artisan schedule:work')
        ->and(substr_count($compose, 'restart: unless-stopped'))->toBeGreaterThanOrEqual(3);
});

it('documents durable shared state required by production processes', function () {
    $example = file_get_contents(base_path('.env.production.example'));

    expect($example)
        ->toContain('DB_CONNECTION=mysql')
        ->toContain('QUEUE_CONNECTION=database')
        ->toContain('CACHE_STORE=database')
        ->toContain('SESSION_DRIVER=database');
});
