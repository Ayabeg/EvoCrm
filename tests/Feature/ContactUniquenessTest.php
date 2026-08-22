<?php

use App\Models\Contact;
use App\Models\Workspace;
use App\Services\Crm\ContactIdentity;
use Illuminate\Validation\ValidationException;

it('enforces one contact per phone inside a workspace', function () {
    $workspace = Workspace::factory()->create();
    $identity = app(ContactIdentity::class);

    $identity->createUnique($workspace, [
        'first_name' => 'Amine',
        'phone' => '0550123456',
        'email' => 'amine@example.dz',
    ]);

    expect(fn () => $identity->createUnique($workspace, [
        'first_name' => 'Duplicate',
        'phone' => '0550123456',
        'email' => 'other@example.dz',
    ]))->toThrow(ValidationException::class);

    expect(Contact::query()->forWorkspace($workspace)->count())->toBe(1);
});

it('allows the same phone in a different workspace', function () {
    $first = Workspace::factory()->create();
    $second = Workspace::factory()->create();
    $identity = app(ContactIdentity::class);

    $identity->createUnique($first, ['first_name' => 'Amine', 'phone' => '0550999888', 'email' => 'a@one.dz']);
    $identity->createUnique($second, ['first_name' => 'Amine', 'phone' => '0550999888', 'email' => 'a@two.dz']);

    expect(Contact::query()->count())->toBe(2);
});
