<?php

use App\Models\Mailbox;
use App\Models\User;
use Illuminate\Support\Facades\Http;

function fakeMailStackAll(array $rows): void
{
    Http::fake([
        '*/api/mailbox/all' => Http::response(['data' => $rows], 200),
    ]);
}

function mailStackRow(array $overrides = []): array
{
    return [
        'username' => 'Amine@evotechly.com',
        'password' => 'stack-secret',
        'full_name' => 'Amine Beghanem',
        'domain' => 'evotechly.com',
        'local_part' => 'amine',
        'active' => 1,
        ...$overrides,
    ];
}

it('syncs mailboxes from the mail stack with smtp and imap defaults', function () {
    config(['evosales.mail_stack.api_token' => 'test-token']);

    fakeMailStackAll([
        mailStackRow(),
        mailStackRow([
            'username' => 'sales@evotechly.com',
            'full_name' => 'Sales Team',
            'local_part' => 'sales',
            'active' => 0,
        ]),
    ]);

    $user = User::factory()->create();

    $this->artisan('outbound:sync-mailboxes')->assertSuccessful();

    $mailboxes = Mailbox::query()->where('workspace_id', $user->workspace_id)->get();
    expect($mailboxes)->toHaveCount(2);

    $amine = $mailboxes->firstWhere('from_address', 'amine@evotechly.com');
    expect($amine)->not->toBeNull();
    expect($amine->source)->toBe(Mailbox::SOURCE_MAIL_STACK);
    expect($amine->isMailStack())->toBeTrue();
    expect($amine->name)->toBe('Amine Beghanem');
    expect($amine->from_name)->toBe('Amine Beghanem');
    expect($amine->host)->toBe('outbound.evotechly.com');
    expect($amine->port)->toBe(587);
    expect($amine->encryption)->toBe('tls');
    expect($amine->username)->toBe('amine@evotechly.com');
    expect($amine->password)->toBe('stack-secret');
    expect($amine->imap_host)->toBe('outbound.evotechly.com');
    expect($amine->imap_port)->toBe(993);
    expect($amine->imap_encryption)->toBe('ssl');
    expect($amine->imap_username)->toBe('amine@evotechly.com');
    expect($amine->imap_password)->toBe('stack-secret');
    expect($amine->enabled)->toBeTrue();
    expect($amine->is_default)->toBeTrue();

    $sales = $mailboxes->firstWhere('from_address', 'sales@evotechly.com');
    expect($sales->enabled)->toBeFalse();
    expect($sales->effectiveStatus())->toBe('disabled');
    expect($sales->is_default)->toBeFalse();

    Http::assertSent(fn ($request) => str_contains($request->url(), '/api/mailbox/all')
        && $request->hasHeader('Authorization', 'Bearer test-token'));
});

it('updates existing mailboxes on a second sync instead of duplicating them', function () {
    config(['evosales.mail_stack.api_token' => 'test-token']);

    $user = User::factory()->create();

    // Second sync answers renamed, deactivated, and without a password.
    Http::fake([
        '*/api/mailbox/all' => Http::sequence()
            ->push(['data' => [mailStackRow()]], 200)
            ->push(['data' => [mailStackRow(['full_name' => 'Amine B.', 'active' => 0, 'password' => null])]], 200),
    ]);

    $this->artisan('outbound:sync-mailboxes')->assertSuccessful();

    $mailbox = Mailbox::query()->where('workspace_id', $user->workspace_id)->sole();
    $mailbox->forceFill(['status' => 'active', 'daily_limit' => 120])->save();

    $this->artisan('outbound:sync-mailboxes')->assertSuccessful();

    $mailboxes = Mailbox::query()->where('workspace_id', $user->workspace_id)->get();
    expect($mailboxes)->toHaveCount(1);

    $mailbox = $mailboxes->sole();
    expect($mailbox->name)->toBe('Amine B.');
    expect($mailbox->enabled)->toBeFalse();
    expect($mailbox->status)->toBe('disabled');
    expect($mailbox->password)->toBe('stack-secret');
    expect($mailbox->daily_limit)->toBe(120);
});

it('adopts a manual mailbox with the same address instead of duplicating it', function () {
    config(['evosales.mail_stack.api_token' => 'test-token']);

    $user = User::factory()->create();
    Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'from_address' => 'amine@evotechly.com',
        'username' => 'amine@evotechly.com',
    ]);

    fakeMailStackAll([mailStackRow()]);
    $this->artisan('outbound:sync-mailboxes')->assertSuccessful();

    $mailbox = Mailbox::query()->where('workspace_id', $user->workspace_id)->sole();
    expect($mailbox->source)->toBe(Mailbox::SOURCE_MAIL_STACK);
    expect($mailbox->host)->toBe('outbound.evotechly.com');
});

it('falls back to the paginated mailbox list when mailbox/all is unavailable', function () {
    config(['evosales.mail_stack.api_token' => 'test-token']);

    $firstPage = [];
    for ($i = 1; $i <= 100; $i++) {
        $firstPage[] = mailStackRow(['username' => "seller{$i}@evotechly.com"]);
    }

    Http::fake([
        '*/api/mailbox/all' => Http::response(['message' => 'not found'], 404),
        '*/api/mailbox/list*' => Http::sequence()
            ->push(['data' => ['list' => $firstPage, 'total' => 101]], 200)
            ->push(['data' => ['list' => [mailStackRow()], 'total' => 101]], 200),
    ]);

    $user = User::factory()->create();

    $this->artisan('outbound:sync-mailboxes')->assertSuccessful();

    expect(Mailbox::query()->where('workspace_id', $user->workspace_id)->count())->toBe(101);
    Http::assertSentCount(3);
});

it('no-ops cleanly when the mail stack token is empty', function () {
    config(['evosales.mail_stack.api_token' => null]);

    Http::preventStrayRequests();

    $user = User::factory()->create();

    $this->artisan('outbound:sync-mailboxes')->assertSuccessful();
    expect(Mailbox::query()->where('workspace_id', $user->workspace_id)->count())->toBe(0);

    $this->actingAs($user)->get('/outbound/mailboxes')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('outbound/mailboxes/index')
            ->where('mail_stack.configured', false)
            ->has('mail_stack.roundcube_url')
        );

    $this->actingAs($user)->post('/outbound/mailboxes/sync')->assertRedirect();
    expect(Mailbox::query()->where('workspace_id', $user->workspace_id)->count())->toBe(0);

    Http::assertNothingSent();
});

it('syncs immediately from the mailboxes page when the token is set', function () {
    config(['evosales.mail_stack.api_token' => 'test-token']);

    fakeMailStackAll([mailStackRow()]);

    $user = User::factory()->create();

    $this->actingAs($user)->get('/outbound/mailboxes')->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('outbound/mailboxes/index')
            ->where('mail_stack.configured', true)
            ->where('mail_stack.roundcube_url', 'https://outbound.evotechly.com/roundcube/')
        );

    $this->actingAs($user)->post('/outbound/mailboxes/sync')->assertRedirect();

    expect(Mailbox::query()->where('workspace_id', $user->workspace_id)->count())->toBe(1);
});

it('refuses to delete a mail-stack mailbox but deletes a manual one', function () {
    $user = User::factory()->create();

    $synced = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'source' => Mailbox::SOURCE_MAIL_STACK,
    ]);
    $manual = Mailbox::factory()->create([
        'workspace_id' => $user->workspace_id,
        'source' => Mailbox::SOURCE_MANUAL,
        'is_default' => false,
    ]);

    $this->actingAs($user)->delete("/outbound/mailboxes/{$synced->id}")->assertRedirect();
    expect(Mailbox::query()->find($synced->id))->not->toBeNull();

    $this->actingAs($user)->delete("/outbound/mailboxes/{$manual->id}")->assertRedirect();
    expect(Mailbox::query()->find($manual->id))->toBeNull();
});
