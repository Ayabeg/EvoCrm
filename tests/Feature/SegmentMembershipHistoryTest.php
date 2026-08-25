<?php

use App\Models\Contact;
use App\Models\SavedFilter;
use App\Models\User;
use App\Services\Crm\ContactMerger;
use App\Services\Crm\SegmentMatcher;
use Illuminate\Support\Facades\DB;

function historySegment(User $user, string $name = 'Alger only'): SavedFilter
{
    return SavedFilter::query()->create([
        'workspace_id' => $user->workspace_id,
        'user_id' => $user->id,
        'name' => $name,
        'entity' => 'contact',
        'filters' => ['wilaya' => 'Alger'],
    ]);
}

it('keeps exited membership rows instead of deleting them', function () {
    $user = User::factory()->create();
    $segment = historySegment($user);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'wilaya' => 'Alger',
        'first_name' => 'Amine',
        'last_name' => 'Benali',
    ]);

    app(SegmentMatcher::class)->syncContact($contact);
    $contact->forceFill(['wilaya' => 'Oran'])->save();
    app(SegmentMatcher::class)->syncContact($contact);
    app(SegmentMatcher::class)->syncContact($contact);

    $rows = DB::table('contact_segment_memberships')->where('contact_id', $contact->id)->get();

    expect($rows)->toHaveCount(1)
        ->and($rows->first()->exited_at)->not->toBeNull()
        ->and(DB::table('contact_segment_memberships')->where('contact_id', $contact->id)->whereNull('exited_at')->count())->toBe(0);
});

it('records a new current row when a contact re-enters a segment', function () {
    $user = User::factory()->create();
    $segment = historySegment($user);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'wilaya' => 'Alger',
    ]);

    app(SegmentMatcher::class)->syncContact($contact);
    $contact->forceFill(['wilaya' => 'Oran'])->save();
    app(SegmentMatcher::class)->syncContact($contact);
    $contact->forceFill(['wilaya' => 'Alger'])->save();
    app(SegmentMatcher::class)->syncContact($contact);

    $rows = DB::table('contact_segment_memberships')
        ->where('contact_id', $contact->id)
        ->where('saved_filter_id', $segment->id)
        ->orderBy('id')
        ->get();

    expect($rows)->toHaveCount(2)
        ->and($rows[0]->exited_at)->not->toBeNull()
        ->and($rows[1]->exited_at)->toBeNull();
});

it('shows membership history on the segment page', function () {
    $user = User::factory()->create();
    $segment = historySegment($user);
    $contact = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'wilaya' => 'Alger',
        'first_name' => 'Amine',
        'last_name' => 'Benali',
    ]);

    app(SegmentMatcher::class)->syncContact($contact);
    $contact->forceFill(['wilaya' => 'Oran'])->save();
    app(SegmentMatcher::class)->syncContact($contact);

    $this->actingAs($user)
        ->get("/crm/segments/{$segment->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('crm/segments/show')
            ->where('segment.id', $segment->id)
            ->where('segment.name', 'Alger only')
            ->has('history', 1)
            ->where('history.0.contact_name', 'Amine Benali')
            ->where('history.0.status', 'exited')
        );
});

it('does not leak another workspace segment history', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $segment = historySegment($other);

    $this->actingAs($user)
        ->get("/crm/segments/{$segment->id}")
        ->assertNotFound();
});

it('moves segment history onto the surviving contact during merge', function () {
    $user = User::factory()->create();
    $segment = historySegment($user);
    $survivor = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'wilaya' => 'Oran',
        'email' => 'keep@evosales.local',
    ]);
    $absorbed = Contact::factory()->create([
        'workspace_id' => $user->workspace_id,
        'wilaya' => 'Alger',
        'email' => 'drop@evosales.local',
    ]);

    app(SegmentMatcher::class)->syncContact($absorbed);
    $absorbed->forceFill(['wilaya' => 'Oran'])->save();
    app(SegmentMatcher::class)->syncContact($absorbed);

    app(ContactMerger::class)->merge($user->workspace, $user, $survivor, $absorbed, [
        'first_name' => $survivor->first_name,
        'last_name' => $survivor->last_name,
        'email' => $survivor->email,
    ]);

    expect(DB::table('contact_segment_memberships')->where('contact_id', $survivor->id)->count())->toBe(1)
        ->and(DB::table('contact_segment_memberships')->where('contact_id', $absorbed->id)->count())->toBe(0)
        ->and(DB::table('contact_segment_memberships')->where('contact_id', $survivor->id)->value('exited_at'))->not->toBeNull();
});
