<?php

namespace App\Services\Crm;

use App\Models\Activity;
use App\Models\Contact;
use App\Models\CustomAttributeValue;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Lead;
use App\Models\Message;
use App\Models\OutboundMessage;
use App\Models\Thread;
use App\Models\User;
use App\Models\WorkflowExecution;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class ContactMerger
{
    public function __construct(private ActivityRecorder $activities) {}

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

            $absorbed->delete();
        });

        return $survivor->fresh() ?? $survivor;
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

        if (class_exists(WorkflowExecution::class)) {
            WorkflowExecution::query()->where('contact_id', $absorbed->id)->update(['contact_id' => $survivor->id]);
        }

        $this->reassignEnrollments($survivor, $absorbed);
        $this->reassignThreads($survivor, $absorbed);
        $this->reassignAttributes($survivor, $absorbed);
        $this->reassignSegmentMemberships($survivor, $absorbed);
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

        $survivorFilters = DB::table('contact_segment_memberships')
            ->where('contact_id', $survivor->id)
            ->pluck('saved_filter_id')
            ->all();

        DB::table('contact_segment_memberships')
            ->where('contact_id', $absorbed->id)
            ->whereIn('saved_filter_id', $survivorFilters)
            ->delete();

        DB::table('contact_segment_memberships')
            ->where('contact_id', $absorbed->id)
            ->update(['contact_id' => $survivor->id]);
    }
}
