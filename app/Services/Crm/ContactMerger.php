<?php

namespace App\Services\Crm;

use App\Models\Activity;
use App\Models\Contact;
use App\Models\ContactConsent;
use App\Models\ContactMerge;
use App\Models\CustomAttributeValue;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Lead;
use App\Models\Message;
use App\Models\OutboundMessage;
use App\Models\Thread;
use App\Models\Ticket;
use App\Models\User;
use App\Models\WorkflowExecution;
use App\Models\Workspace;
use App\Services\Operations\AuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ContactMerger
{
    public function __construct(private ActivityRecorder $activities, private AuditLogger $audit) {}

    /**
     * @return list<array{key: string, reasons: list<string>, contacts: list<array<string, mixed>>}>
     */
    public function groups(Workspace $workspace): array
    {
        $contacts = Contact::query()
            ->forWorkspace($workspace)
            ->with('company')
            ->orderBy('first_name')
            ->get();

        $parent = [];
        $find = function (int $id) use (&$parent, &$find): int {
            $parent[$id] ??= $id;
            if ($parent[$id] !== $id) {
                $parent[$id] = $find($parent[$id]);
            }

            return $parent[$id];
        };
        $union = function (int $a, int $b) use (&$parent, $find): void {
            $parent[$find($a)] = $find($b);
        };

        $reasons = [];
        foreach (['email' => 'email', 'phone_e164' => 'phone', 'external_id' => 'external ID'] as $field => $label) {
            $buckets = [];
            foreach ($contacts as $contact) {
                $value = $contact->{$field};
                if (! filled($value)) {
                    continue;
                }
                $buckets[(string) $value][] = $contact->id;
            }

            foreach ($buckets as $ids) {
                if (count($ids) < 2) {
                    continue;
                }

                foreach ($ids as $id) {
                    $union($ids[0], $id);
                    $reasons[$id][$label] = $label;
                }
            }
        }

        $grouped = [];
        foreach ($contacts as $contact) {
            if (! isset($parent[$contact->id])) {
                continue;
            }

            $root = $find($contact->id);
            $grouped[$root][] = $contact;
        }

        $out = [];
        foreach ($grouped as $root => $members) {
            if (count($members) < 2) {
                continue;
            }

            $memberReasons = [];
            foreach ($members as $member) {
                foreach ($reasons[$member->id] ?? [] as $reason) {
                    $memberReasons[$reason] = $reason;
                }
            }

            $out[] = [
                'key' => 'group-'.$root,
                'reasons' => array_values($memberReasons),
                'contacts' => collect($members)->map(fn (Contact $contact) => [
                    'id' => $contact->id,
                    'first_name' => $contact->first_name,
                    'last_name' => $contact->last_name,
                    'display_name' => $contact->displayName(),
                    'email' => $contact->email,
                    'phone_e164' => $contact->phone_e164,
                    'external_id' => $contact->external_id,
                    'city' => $contact->city,
                    'company' => $contact->company?->name,
                ])->values()->all(),
            ];
        }

        return $out;
    }

    /**
     * Return lightweight duplicate-risk counts for the Contacts quality bar
     * without loading the full duplicate review payload.
     *
     * @return array{groups: int, contacts: int}
     */
    public function duplicateSummary(Workspace $workspace): array
    {
        $contacts = Contact::query()
            ->forWorkspace($workspace)
            ->where(function ($query): void {
                $query->whereNotNull('email')->where('email', '!=', '')
                    ->orWhere(fn ($nested) => $nested->whereNotNull('phone_e164')->where('phone_e164', '!=', ''))
                    ->orWhere(fn ($nested) => $nested->whereNotNull('external_id')->where('external_id', '!=', ''));
            })
            ->get(['id', 'email', 'phone_e164', 'external_id']);

        $parent = [];
        $find = function (int $id) use (&$parent, &$find): int {
            $parent[$id] ??= $id;
            if ($parent[$id] !== $id) {
                $parent[$id] = $find($parent[$id]);
            }

            return $parent[$id];
        };
        $union = function (int $left, int $right) use (&$parent, $find): void {
            $parent[$find($left)] = $find($right);
        };

        foreach (['email', 'phone_e164', 'external_id'] as $field) {
            $buckets = [];
            foreach ($contacts as $contact) {
                $value = $contact->{$field};
                if (filled($value)) {
                    $buckets[(string) $value][] = $contact->id;
                }
            }

            foreach ($buckets as $ids) {
                if (count($ids) < 2) {
                    continue;
                }

                foreach (array_slice($ids, 1) as $id) {
                    $union($ids[0], $id);
                }
            }
        }

        $membersByRoot = [];
        foreach ($contacts as $contact) {
            if (isset($parent[$contact->id])) {
                $membersByRoot[$find($contact->id)][] = $contact->id;
            }
        }

        return [
            'groups' => count($membersByRoot),
            'contacts' => collect($membersByRoot)->flatten()->unique()->count(),
        ];
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public function merge(Workspace $workspace, User $actor, Contact $survivor, Contact $absorbed, array $values): Contact
    {
        if ((int) $survivor->workspace_id !== (int) $workspace->id
            || (int) $absorbed->workspace_id !== (int) $workspace->id) {
            abort(404);
        }

        if ($survivor->is($absorbed)) {
            throw ValidationException::withMessages([
                'absorbed_id' => 'Choose a different contact to merge.',
            ]);
        }

        $absorbedName = $absorbed->displayName();

        DB::transaction(function () use ($workspace, $actor, $survivor, $absorbed, $values, $absorbedName): void {
            $snapshot = $this->snapshot($survivor, $absorbed);
            $this->reassign($survivor, $absorbed);

            $absorbed->forceFill([
                'email' => null,
                'phone' => null,
                'phone_e164' => null,
                'whatsapp_jid' => null,
                'external_id' => null,
            ])->save();

            $survivor->fill($this->survivorAttributes($survivor, $values))->save();

            $this->activities->record($workspace, [
                'type' => 'merge',
                'subject' => 'Merged contact',
                'body' => "Merged {$absorbedName} into {$survivor->displayName()}.",
                'contact_id' => $survivor->id,
                'company_id' => $survivor->company_id,
                'meta' => [
                    'absorbed_name' => $absorbedName,
                    'values' => $values,
                ],
            ], $actor);

            $this->audit->record(
                $workspace,
                'contact.merged',
                "Merged {$absorbedName} into {$survivor->displayName()}.",
                $actor,
                $survivor,
                ['absorbed_name' => $absorbedName],
            );

            ContactMerge::query()->create([
                'workspace_id' => $workspace->id,
                'survivor_contact_id' => $survivor->id,
                'absorbed_contact_id' => $absorbed->id,
                'merged_by' => $actor->id,
                'snapshot' => $snapshot,
                'merged_at' => now(),
            ]);

            $absorbed->delete();
        });

        return $survivor->fresh() ?? $survivor;
    }

    public function undo(Workspace $workspace, User $actor, ContactMerge $merge): Contact
    {
        if ((int) $merge->workspace_id !== (int) $workspace->id) {
            abort(404);
        }

        if ($merge->undone_at !== null) {
            throw ValidationException::withMessages([
                'merge' => 'This contact merge has already been undone.',
            ]);
        }

        $snapshot = $merge->snapshot;
        $survivorId = (int) $merge->survivor_contact_id;

        DB::transaction(function () use ($workspace, $actor, $merge, $snapshot, $survivorId): void {
            $this->clearSnapshotRows($snapshot, $merge->survivor_contact_id, $merge->absorbed_contact_id);

            foreach ($snapshot['contacts'] ?? [] as $attributes) {
                $contact = Contact::withTrashed()->forWorkspace($workspace)->findOrFail($attributes['id']);
                $contact->forceFill($attributes)->saveQuietly();
                if ($contact->trashed()) {
                    $contact->restoreQuietly();
                }
            }

            $this->restoreSnapshotRows($snapshot);

            $merge->forceFill([
                'undone_at' => now(),
                'undone_by' => $actor->id,
            ])->save();

            $survivor = Contact::query()->forWorkspace($workspace)->findOrFail($survivorId);
            $this->activities->record($workspace, [
                'type' => 'merge_undone',
                'subject' => 'Undid contact merge',
                'body' => 'Restored both contacts and their pre-merge records.',
                'contact_id' => $survivor->id,
                'company_id' => $survivor->company_id,
                'meta' => ['contact_merge_id' => $merge->id],
            ], $actor);

            $this->audit->record(
                $workspace,
                'contact.merge_undone',
                'Undid a contact merge and restored its snapshot.',
                $actor,
                $survivor,
                ['contact_merge_id' => $merge->id],
            );
        });

        return Contact::query()->forWorkspace($workspace)->findOrFail($survivorId);
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function survivorAttributes(Contact $survivor, array $values): array
    {
        $allowed = [
            'first_name',
            'last_name',
            'email',
            'phone',
            'city',
            'wilaya',
            'source',
            'lead_status',
            'external_id',
            'company_id',
            'owner_id',
        ];

        $payload = [];
        foreach ($allowed as $field) {
            if (! array_key_exists($field, $values) || $values[$field] === '' || $values[$field] === null) {
                continue;
            }

            $payload[$field] = $values[$field];
        }

        if (array_key_exists('phone', $payload)) {
            $payload['phone_e164'] = null;
        }

        if ($payload === []) {
            return [
                'first_name' => $survivor->first_name,
            ];
        }

        return $payload;
    }

    private function reassign(Contact $survivor, Contact $absorbed): void
    {
        Deal::query()->where('contact_id', $absorbed->id)->update(['contact_id' => $survivor->id]);
        Lead::query()->where('contact_id', $absorbed->id)->update(['contact_id' => $survivor->id]);
        Activity::query()->where('contact_id', $absorbed->id)->update(['contact_id' => $survivor->id]);
        Message::query()->where('contact_id', $absorbed->id)->update(['contact_id' => $survivor->id]);
        OutboundMessage::query()->where('contact_id', $absorbed->id)->update(['contact_id' => $survivor->id]);
        Ticket::query()->where('contact_id', $absorbed->id)->update(['contact_id' => $survivor->id]);

        $this->reassignConsents($survivor, $absorbed);

        if (class_exists(WorkflowExecution::class)) {
            WorkflowExecution::query()->where('contact_id', $absorbed->id)->update(['contact_id' => $survivor->id]);
        }

        $this->reassignEnrollments($survivor, $absorbed);
        $this->reassignThreads($survivor, $absorbed);
        $this->reassignAttributes($survivor, $absorbed);
        $this->reassignSegmentMemberships($survivor, $absorbed);
        $this->reassignRelationships($survivor, $absorbed);
    }

    private function reassignConsents(Contact $survivor, Contact $absorbed): void
    {
        $keys = ContactConsent::query()
            ->where('contact_id', $survivor->id)
            ->get(['channel', 'purpose'])
            ->map(fn (ContactConsent $consent): string => $consent->channel.'|'.$consent->purpose)
            ->all();

        foreach (ContactConsent::query()->where('contact_id', $absorbed->id)->get() as $consent) {
            if (in_array($consent->channel.'|'.$consent->purpose, $keys, true)) {
                $consent->delete();

                continue;
            }

            $consent->forceFill(['contact_id' => $survivor->id])->save();
        }
    }

    private function reassignRelationships(Contact $survivor, Contact $absorbed): void
    {
        if (! Schema::hasTable('record_relationships')) {
            return;
        }

        $rows = DB::table('record_relationships')
            ->where(function ($query) use ($absorbed): void {
                $query->where(function ($nested) use ($absorbed): void {
                    $nested->where('from_type', Contact::class)->where('from_id', $absorbed->id);
                })->orWhere(function ($nested) use ($absorbed): void {
                    $nested->where('to_type', Contact::class)->where('to_id', $absorbed->id);
                });
            })->get();

        foreach ($rows as $row) {
            $data = (array) $row;
            $data['from_id'] = $data['from_type'] === Contact::class && (int) $data['from_id'] === (int) $absorbed->id
                ? $survivor->id : $data['from_id'];
            $data['to_id'] = $data['to_type'] === Contact::class && (int) $data['to_id'] === (int) $absorbed->id
                ? $survivor->id : $data['to_id'];

            $duplicate = DB::table('record_relationships')
                ->where('workspace_id', $data['workspace_id'])
                ->where('from_type', $data['from_type'])
                ->where('from_id', $data['from_id'])
                ->where('to_type', $data['to_type'])
                ->where('to_id', $data['to_id'])
                ->where('relationship_type', $data['relationship_type'])
                ->where('id', '!=', $data['id'])
                ->exists();

            if ($duplicate) {
                DB::table('record_relationships')->where('id', $data['id'])->delete();

                continue;
            }

            DB::table('record_relationships')->where('id', $data['id'])->update([
                'from_id' => $data['from_id'],
                'to_id' => $data['to_id'],
                'updated_at' => now(),
            ]);
        }
    }

    private function reassignEnrollments(Contact $survivor, Contact $absorbed): void
    {
        $survivorSequences = Enrollment::query()
            ->where('contact_id', $survivor->id)
            ->pluck('sequence_id')
            ->all();

        Enrollment::query()
            ->where('contact_id', $absorbed->id)
            ->whereIn('sequence_id', $survivorSequences)
            ->delete();

        Enrollment::query()
            ->where('contact_id', $absorbed->id)
            ->update(['contact_id' => $survivor->id]);
    }

    private function reassignThreads(Contact $survivor, Contact $absorbed): void
    {
        $survivorThreads = Thread::query()
            ->where('contact_id', $survivor->id)
            ->get()
            ->keyBy('channel_id');

        foreach (Thread::query()->where('contact_id', $absorbed->id)->get() as $thread) {
            $existing = $survivorThreads[$thread->channel_id] ?? null;
            if ($existing) {
                Message::query()->where('thread_id', $thread->id)->update([
                    'thread_id' => $existing->id,
                    'contact_id' => $survivor->id,
                ]);
                $thread->delete();

                continue;
            }

            $thread->forceFill(['contact_id' => $survivor->id])->save();
        }
    }

    private function reassignAttributes(Contact $survivor, Contact $absorbed): void
    {
        $survivorKeys = CustomAttributeValue::query()
            ->where('entity_type', 'contact')
            ->where('entity_id', $survivor->id)
            ->pluck('definition_id')
            ->all();

        CustomAttributeValue::query()
            ->where('entity_type', 'contact')
            ->where('entity_id', $absorbed->id)
            ->whereIn('definition_id', $survivorKeys)
            ->delete();

        CustomAttributeValue::query()
            ->where('entity_type', 'contact')
            ->where('entity_id', $absorbed->id)
            ->update(['entity_id' => $survivor->id]);
    }

    private function reassignSegmentMemberships(Contact $survivor, Contact $absorbed): void
    {
        if (! Schema::hasTable('contact_segment_memberships')) {
            return;
        }

        $survivorCurrent = DB::table('contact_segment_memberships')
            ->where('contact_id', $survivor->id)
            ->whereNull('exited_at')
            ->pluck('saved_filter_id')
            ->all();

        if ($survivorCurrent !== []) {
            DB::table('contact_segment_memberships')
                ->where('contact_id', $absorbed->id)
                ->whereNull('exited_at')
                ->whereIn('saved_filter_id', $survivorCurrent)
                ->update([
                    'exited_at' => now(),
                    'updated_at' => now(),
                ]);
        }

        DB::table('contact_segment_memberships')
            ->where('contact_id', $absorbed->id)
            ->update(['contact_id' => $survivor->id]);
    }

    /**
     * Keep a raw database snapshot so undo can restore deleted duplicate rows,
     * not only move the two contact records back.
     *
     * @return array<string, mixed>
     */
    private function snapshot(Contact $survivor, Contact $absorbed): array
    {
        $contactIds = [$survivor->id, $absorbed->id];
        $tables = [
            'deals',
            'leads',
            'activities',
            'outbound_messages',
            'workflow_executions',
            'enrollments',
            'tickets',
            'contact_consents',
            'threads',
            'messages',
        ];

        $rows = [];
        foreach ($tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $query = DB::table($table)->whereIn('contact_id', $contactIds);
            if ($table === 'messages') {
                $threadIds = DB::table('threads')->whereIn('contact_id', $contactIds)->pluck('id')->all();
                $query = DB::table($table)->where(function ($nested) use ($contactIds, $threadIds): void {
                    $nested->whereIn('contact_id', $contactIds);
                    if ($threadIds !== []) {
                        $nested->orWhereIn('thread_id', $threadIds);
                    }
                });
            }

            $rows[$table] = $query->get()->map(fn ($row): array => (array) $row)->values()->all();
        }

        if (Schema::hasTable('custom_attribute_values')) {
            $rows['custom_attribute_values'] = DB::table('custom_attribute_values')
                ->where('entity_type', 'contact')
                ->whereIn('entity_id', $contactIds)
                ->get()
                ->map(fn ($row): array => (array) $row)
                ->values()
                ->all();
        }

        if (Schema::hasTable('contact_segment_memberships')) {
            $rows['contact_segment_memberships'] = DB::table('contact_segment_memberships')
                ->whereIn('contact_id', $contactIds)
                ->get()
                ->map(fn ($row): array => (array) $row)
                ->values()
                ->all();
        }

        if (Schema::hasTable('record_relationships')) {
            $rows['record_relationships'] = DB::table('record_relationships')
                ->where(function ($query) use ($contactIds): void {
                    $query->where(function ($nested) use ($contactIds): void {
                        $nested->where('from_type', Contact::class)->whereIn('from_id', $contactIds);
                    })->orWhere(function ($nested) use ($contactIds): void {
                        $nested->where('to_type', Contact::class)->whereIn('to_id', $contactIds);
                    });
                })
                ->get()
                ->map(fn ($row): array => (array) $row)
                ->values()
                ->all();
        }

        return [
            'contacts' => [$survivor->getRawOriginal(), $absorbed->getRawOriginal()],
            'rows' => $rows,
        ];
    }

    /** @param array<string, mixed> $snapshot */
    private function clearSnapshotRows(array $snapshot, int $survivorId, int $absorbedId): void
    {
        $contactIds = [$survivorId, $absorbedId];
        $rows = $snapshot['rows'] ?? [];

        if (Schema::hasTable('messages')) {
            $threadIds = collect($rows['messages'] ?? [])->pluck('thread_id')->filter()->values()->all();
            DB::table('messages')->where(function ($query) use ($contactIds, $threadIds): void {
                $query->whereIn('contact_id', $contactIds);
                if ($threadIds !== []) {
                    $query->orWhereIn('thread_id', $threadIds);
                }
            })->delete();
        }

        foreach (['threads', 'deals', 'leads', 'activities', 'outbound_messages', 'workflow_executions', 'enrollments', 'tickets', 'contact_consents'] as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->whereIn('contact_id', $contactIds)->delete();
            }
        }

        if (Schema::hasTable('custom_attribute_values')) {
            DB::table('custom_attribute_values')
                ->where('entity_type', 'contact')
                ->whereIn('entity_id', $contactIds)
                ->delete();
        }

        if (Schema::hasTable('contact_segment_memberships')) {
            DB::table('contact_segment_memberships')->whereIn('contact_id', $contactIds)->delete();
        }

        if (Schema::hasTable('record_relationships')) {
            DB::table('record_relationships')->where(function ($query) use ($contactIds): void {
                $query->where(function ($nested) use ($contactIds): void {
                    $nested->where('from_type', Contact::class)->whereIn('from_id', $contactIds);
                })->orWhere(function ($nested) use ($contactIds): void {
                    $nested->where('to_type', Contact::class)->whereIn('to_id', $contactIds);
                });
            })->delete();
        }
    }

    /** @param array<string, mixed> $snapshot */
    private function restoreSnapshotRows(array $snapshot): void
    {
        $rows = $snapshot['rows'] ?? [];
        $orderedTables = [
            'threads',
            'messages',
            'deals',
            'leads',
            'activities',
            'outbound_messages',
            'workflow_executions',
            'enrollments',
            'tickets',
            'contact_consents',
            'custom_attribute_values',
            'contact_segment_memberships',
            'record_relationships',
        ];

        foreach ($orderedTables as $table) {
            if (! Schema::hasTable($table) || ($rows[$table] ?? []) === []) {
                continue;
            }

            DB::table($table)->insert($rows[$table]);
        }
    }
}
