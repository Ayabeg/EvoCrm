<?php

use App\Models\Contact;
use App\Models\User;

it('lets an ApiV1 token list contacts in its own workspace', function () {
    $user = User::factory()->create();
    $mine = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'first_name' => 'Own',
        'email' => 'own@workspace.test',
    ]);
    $foreign = Contact::factory()->create([
        'first_name' => 'Foreign',
        'email' => 'foreign@other.test',
    ]);

    $this->withToken(apiToken($user))
        ->getJson('/api/v1/contacts')
        ->assertOk()
        ->assertJsonPath('data.0.id', $mine->id)
        ->assertJsonMissing(['email' => 'foreign@other.test']);

    expect($foreign->workspace_id)->not->toBe($user->workspace_id);
});

it('cannot read another workspace contact via ApiV1', function () {
    $user = User::factory()->create();
    $foreign = Contact::factory()->create([
        'first_name' => 'Other',
        'email' => 'other@workspace.test',
    ]);

    $this->withToken(apiToken($user))
        ->getJson('/api/v1/contacts/'.$foreign->id)
        ->assertNotFound();
});

it('requires a Sanctum token to list contacts', function () {
    $this->getJson('/api/v1/contacts')->assertUnauthorized();
});
