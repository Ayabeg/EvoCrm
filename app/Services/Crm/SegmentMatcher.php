<?php

namespace App\Services\Crm;

use App\Models\Contact;
use App\Models\SavedFilter;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class SegmentMatcher
{
    public function __construct(private CrmFilter $filter, private WorkflowRunner $workflows) {}

    public function syncContact(Contact $contact): void
    {
        $workspace = $contact->workspace ?? Workspace::query()->find($contact->workspace_id);

        if (! $workspace instanceof Workspace) {
            return;
        }

        $segments = SavedFilter::query()
            ->forWorkspace($workspace)
            ->where('entity', 'contact')
            ->get();

        foreach ($segments as $segment) {
            $filters = $this->filter->fromSaved($segment);
            $matches = $this->filter
                ->apply('contact', Contact::query()->where('id', $contact->id), $filters)
                ->exists();

            $membership = DB::table('contact_segment_memberships')
                ->where('contact_id', $contact->id)
                ->where('saved_filter_id', $segment->id)
                ->first();

            if ($matches && ! $membership) {
                DB::table('contact_segment_memberships')->insert([
                    'workspace_id' => $workspace->id,
                    'contact_id' => $contact->id,
                    'saved_filter_id' => $segment->id,
                    'entered_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->workflows->handleSegmentEntered($contact, $segment);
            }

            if (! $matches && $membership) {
                DB::table('contact_segment_memberships')
                    ->where('contact_id', $contact->id)
                    ->where('saved_filter_id', $segment->id)
                    ->delete();

                $this->workflows->handleSegmentExited($contact, $segment);
            }
        }
    }
}
