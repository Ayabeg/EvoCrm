<?php

namespace App\Services\Crm;

use App\Models\Contact;
use App\Models\SavedFilter;
use App\Models\Workspace;
use App\Services\Analytics\ProductAnalytics;
use Illuminate\Support\Facades\DB;

class SegmentMatcher
{
    public function __construct(
        private CrmFilter $filter,
        private WorkflowRunner $workflows,
        private ProductAnalytics $analytics,
    ) {}

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
                ->whereNull('exited_at')
                ->first();

            if ($matches && ! $membership) {
                DB::table('contact_segment_memberships')->insert([
                    'workspace_id' => $workspace->id,
                    'contact_id' => $contact->id,
                    'saved_filter_id' => $segment->id,
                    'entered_at' => now(),
                    'exited_at' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->analytics->capture(ProductAnalytics::SEGMENT_ENTERED, [
                    'contact_id' => $contact->id,
                    'segment_id' => $segment->id,
                    'segment_name' => $segment->name,
                ], null, $workspace);
                $this->workflows->handleSegmentEntered($contact, $segment);
            }

            if (! $matches && $membership) {
                DB::table('contact_segment_memberships')
                    ->where('id', $membership->id)
                    ->update([
                        'exited_at' => now(),
                        'updated_at' => now(),
                    ]);

                $this->analytics->capture(ProductAnalytics::SEGMENT_EXITED, [
                    'contact_id' => $contact->id,
                    'segment_id' => $segment->id,
                    'segment_name' => $segment->name,
                ], null, $workspace);
                $this->workflows->handleSegmentExited($contact, $segment);
            }
        }
    }
}
