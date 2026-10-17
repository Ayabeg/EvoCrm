<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\User;
use App\Models\Workflow;
use App\Models\WorkflowExecution;
use Illuminate\Support\Facades\Http;

it('evaluates a workflow dry run without executing its action', function () {
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'city' => 'Alger',
    ]);
    $workflow = Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Dry run task',
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Call {{contact}}', 'due_in_days' => 1],
        'condition_field' => 'contact.city',
        'condition_operator' => Workflow::OP_EQ,
        'condition_value' => 'Alger',
        'active' => false,
    ]);

    $this->actingAs($user)
        ->post("/crm/workflows/{$workflow->id}/test", ['contact_id' => $contact->id])
        ->assertRedirect()
        ->assertSessionHas('inertia.flash_data.toast.message', fn (string $message): bool => str_contains($message, 'then branch')
            && str_contains($message, 'No changes were made.'));

    expect(Activity::query()->where('workspace_id', $user->workspace_id)->count())->toBe(0)
        ->and(WorkflowExecution::query()->where('workflow_id', $workflow->id)->count())->toBe(0);
});

it('dry runs the else branch and never calls a webhook', function () {
    Http::fake();
    $user = User::factory()->create();
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'city' => 'Oran',
    ]);
    $workflow = Workflow::factory()->create([
        'workspace_id' => $user->workspace_id,
        'action' => Workflow::ACTION_SEND_WEBHOOK,
        'action_config' => ['url' => 'https://hooks.example.test/then'],
        'condition_field' => 'contact.city',
        'condition_operator' => Workflow::OP_EQ,
        'condition_value' => 'Alger',
        'else_action' => Workflow::ACTION_SEND_WEBHOOK,
        'else_action_config' => ['url' => 'https://hooks.example.test/else'],
        'active' => false,
    ]);

    $this->actingAs($user)
        ->post("/crm/workflows/{$workflow->id}/test", ['contact_id' => $contact->id])
        ->assertRedirect()
        ->assertSessionHas('inertia.flash_data.toast.message', fn (string $message): bool => str_contains($message, 'else branch')
            && str_contains($message, 'condition did not pass'));

    Http::assertNothingSent();
});
