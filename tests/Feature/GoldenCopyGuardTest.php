<?php

use App\Support\StageCopy;
use Illuminate\Support\Facades\App;

it('uses a visible NBSP in formatDzd', function () {
    $src = file_get_contents(resource_path('js/lib/money.ts'));

    expect($src)->toContain('\\u00A0')
        ->and($src)->toContain('DA')
        ->and($src)->not->toContain('THIN_NBSP');
});

it('keeps Nouveau Qualification Proposition Négociation Gagné Perdu order', function () {
    App::setLocale('fr');

    expect(StageCopy::DISPLAY_ORDER)->toBe([
        'new',
        'qualified',
        'proposal',
        'demo',
        'won',
        'lost',
    ])
        ->and(StageCopy::label('new'))->toBe('Nouveau')
        ->and(StageCopy::label('qualified'))->toBe('Qualification')
        ->and(StageCopy::label('proposal'))->toBe('Proposition')
        ->and(StageCopy::label('demo'))->toBe('Négociation')
        ->and(StageCopy::label('won'))->toBe('Gagné')
        ->and(StageCopy::label('lost'))->toBe('Perdu');
});

it('loads every golden route in light 1440 and fails on denylisted copy', function () {
    $script = base_path('scripts/redesign-master-copy-guard.mjs');
    expect(is_file($script))->toBeTrue();

    $playwright = '/tmp/pw/node_modules/playwright-core/index.js';

    if (! is_file($playwright)) {
        test()->markTestSkipped('Playwright is not installed at /tmp/pw.');
    }

    $base = env('APP_URL', 'http://127.0.0.1:8000');
    $out = storage_path('logs/copy-guard.txt');
    $cmd = sprintf(
        'APP_URL=%s COPY_GUARD_OUT=%s node %s 2>&1',
        escapeshellarg($base),
        escapeshellarg($out),
        escapeshellarg($script),
    );

    $output = [];
    $code = 0;
    exec($cmd, $output, $code);
    $report = implode("\n", $output);

    expect($code)->toBe(0, $report)
        ->and($report)->toContain('PASS');
})->group('golden');
