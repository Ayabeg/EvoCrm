<?php

use App\Services\Crm\WorkflowExecutionRedactor;

it('redacts secret keys and credential-bearing urls', function () {
    $redactor = new WorkflowExecutionRedactor;

    $parameters = $redactor->redactParameters([
        'subject' => 'Follow up',
        'url' => 'https://hooks.example.com/path?token=super-secret',
        'authorization' => 'Bearer abc',
        'api_key' => 'abc',
        'unknown_payload' => ['nested' => true],
    ]);

    expect($parameters)->toHaveKey('subject')
        ->and($parameters['subject'])->toBe('Follow up')
        ->and($parameters['url'])->toBe('https://hooks.example.com/path')
        ->and($parameters)->not->toHaveKey('authorization')
        ->and($parameters)->not->toHaveKey('api_key')
        ->and($parameters)->not->toHaveKey('unknown_payload');
});

it('redacts emails tokens and urls from error summaries', function () {
    $redactor = new WorkflowExecutionRedactor;

    $error = $redactor->redactError(
        'SMTP failed for amina@clinic.dz via https://smtp.example.com using token=abcd Authorization: Bearer xyz'
    );

    expect($error)->not->toContain('amina@clinic.dz')
        ->and($error)->not->toContain('https://smtp.example.com')
        ->and($error)->not->toContain('Bearer xyz')
        ->and($error)->not->toContain('token=abcd');
});

it('redacts row-level import diagnostics with the same error contract', function () {
    $redactor = new WorkflowExecutionRedactor;

    $rowError = mb_substr(
        $redactor->redactError(
            'Import row failed for amina@clinic.dz at https://provider.example.test using Authorization: Bearer secret-value',
        ),
        0,
        500,
    );

    expect($rowError)
        ->not->toContain('amina@clinic.dz')
        ->not->toContain('https://provider.example.test')
        ->not->toContain('Bearer secret-value');
});
