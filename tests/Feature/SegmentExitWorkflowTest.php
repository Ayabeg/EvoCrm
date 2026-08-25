<?php

use App\Models\Activity;
use App\Models\Contact;
use App\Models\SavedFilter;
use App\Models\User;
use App\Models\Workflow;
use App\Services\Crm\SegmentMatcher;
use Illuminate\Support\Facades\DB;

it('records segment exit and fires the matching workflow once', function () {
    $user = User::factory()->create();
    $segment = SavedFilter::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $user->id,
        'name' => 'Alger only',
        'entity' => 'contact',
        'filters' => ['wilaya' => 'Alger'],
    ]);

    Workflow::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Left Alger',
        'active' => true,
        'trigger' => Workflow::TRIGGER_SEGMENT_EXITED,
        'trigger_saved_filter_id' => $segment->id,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Contact left Alger'],
    ]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'wilaya' => 'Alger',
    ]);

    app(SegmentMatcher::class)->syncContact($contact);
    expect(DB::table('contact_segment_memberships')->where('contact_id', $contact->id)->count())->toBe(1);

    $contact->forceFill(['wilaya' => 'Oran'])->save();
    app(SegmentMatcher::class)->syncContact($contact);
    app(SegmentMatcher::class)->syncContact($contact);

    expect(DB::table('contact_segment_memberships')->where('contact_id', $contact->id)->count())->toBe(0)
        ->and(Activity::query()->where('contact_id', $contact->id)->where('subject', 'Contact left Alger')->count())->toBe(1);
});

it('re-enters a segment as a new valid transition', function () {
    $user = User::factory()->create();
    $segment = SavedFilter::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $user->id,
        'name' => 'Alger only',
        'entity' => 'contact',
        'filters' => ['wilaya' => 'Alger'],
    ]);
    Workflow::query()->create([
        'workspace_id' => $user->workspace_id,
        'name' => 'Welcome back',
        'active' => true,
        'trigger' => Workflow::TRIGGER_SEGMENT_ENTERED,
        'trigger_saved_filter_id' => $segment->id,
        'action' => Workflow::ACTION_CREATE_TASK,
        'action_config' => ['subject' => 'Back in Alger'],
    ]);

    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'wilaya' => 'Alger',
    ]);
    app(SegmentMatcher::class)->syncContact($contact);

    $contact->forceFill(['wilaya' => 'Oran'])->save();
    app(SegmentMatcher::class)->syncContact($contact);

    $contact->forceFill(['wilaya' => 'Alger'])->save();
    app(SegmentMatcher::class)->syncContact($contact);

    expect(Activity::query()->where('contact_id', $contact->id)->where('subject', 'Back in Alger')->count())->toBe(2)
        ->and(DB::table('contact_segment_memberships')->where('contact_id', $contact->id)->count())->toBe(1);
});
