<?php

use App\Enums\WorkspaceRole;
use App\Models\KnowledgeArticle;
use App\Models\User;

function knowledgeArticlePayload(string $title, string $status = 'published'): array
{
    return [
        'title' => $title,
        'category' => 'Getting started',
        'excerpt' => 'A short approved answer.',
        'body' => 'Follow these steps in EvoCRM.',
        'tags' => 'setup, support',
        'status' => $status,
    ];
}

it('lets support managers publish and search workspace knowledge', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);

    $this->actingAs($owner)
        ->post('/crm/knowledge', knowledgeArticlePayload('Connect WhatsApp'))
        ->assertRedirect('/crm/knowledge?article=1');
    $published = KnowledgeArticle::query()->firstOrFail();

    $this->actingAs($owner)
        ->post('/crm/knowledge', knowledgeArticlePayload('Internal escalation', 'draft'))
        ->assertRedirect('/crm/knowledge?article=2');

    expect($published->fresh()->slug)->toBe('connect-whatsapp')
        ->and(KnowledgeArticle::query()->count())->toBe(2);

    $this->actingAs($owner)
        ->get('/crm/knowledge?q=WhatsApp')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/knowledge/index')
            ->where('canManage', true)
            ->where('query', 'WhatsApp')
            ->where('selectedArticleId', null)
            ->has('articles', 1)
            ->where('articles.0.title', 'Connect WhatsApp')
        );

    $this->actingAs($owner)
        ->put("/crm/knowledge/{$published->id}", knowledgeArticlePayload('Connect WhatsApp Cloud'))
        ->assertRedirect('/crm/knowledge?article=1');

    expect($published->fresh()->title)->toBe('Connect WhatsApp Cloud')
        ->and($published->fresh()->slug)->toBe('connect-whatsapp-cloud');
});

it('shows published knowledge to agents and protects authoring', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    KnowledgeArticle::query()->create([
        'workspace_id' => $owner->workspace_id,
        'title' => 'Published answer',
        'slug' => 'published-answer',
        'category' => 'Support',
        'body' => 'Visible to agents.',
        'status' => KnowledgeArticle::STATUS_PUBLISHED,
    ]);
    KnowledgeArticle::query()->create([
        'workspace_id' => $owner->workspace_id,
        'title' => 'Private draft',
        'slug' => 'private-draft',
        'category' => 'Support',
        'body' => 'Not ready.',
        'status' => KnowledgeArticle::STATUS_DRAFT,
    ]);
    $member = User::factory()->create([
        'workspace_id' => $owner->workspace_id,
        'role' => WorkspaceRole::Member,
        'permissions' => [],
    ]);

    $this->actingAs($member)
        ->get('/crm/knowledge')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('canManage', false)
            ->has('articles', 1)
            ->where('articles.0.title', 'Published answer')
        );

    $this->actingAs($member)
        ->post('/crm/knowledge', knowledgeArticlePayload('Blocked'))
        ->assertForbidden();
});

it('does not allow cross-workspace knowledge article changes', function () {
    $owner = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $other = User::factory()->create(['role' => WorkspaceRole::Owner]);
    $article = KnowledgeArticle::query()->create([
        'workspace_id' => $other->workspace_id,
        'title' => 'Other workspace',
        'slug' => 'other-workspace',
        'category' => 'Support',
        'body' => 'Private.',
        'status' => KnowledgeArticle::STATUS_DRAFT,
    ]);

    $this->actingAs($owner)
        ->put("/crm/knowledge/{$article->id}", knowledgeArticlePayload('No access'))
        ->assertNotFound();
});
