<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $identityColumns = [
            'workspace_id',
            'conversion_funnel_id',
            'event_type',
            'subject_type',
            'subject_id',
        ];

        $duplicate = DB::table('funnel_events')
            ->select($identityColumns)
            ->whereNotNull('conversion_funnel_id')
            ->whereNotNull('subject_type')
            ->whereNotNull('subject_id')
            ->groupBy($identityColumns)
            ->havingRaw('COUNT(*) > 1')
            ->first();

        if ($duplicate !== null) {
            throw new RuntimeException(
                'Cannot add funnel_events_subject_event_unique: duplicate subject-scoped funnel events exist. Reconcile the duplicate rows before rerunning migrations.',
            );
        }

        Schema::table('funnel_events', function (Blueprint $table): void {
            $table->unique(
                ['workspace_id', 'conversion_funnel_id', 'event_type', 'subject_type', 'subject_id'],
                'funnel_events_subject_event_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::table('funnel_events', function (Blueprint $table): void {
            $table->dropUnique('funnel_events_subject_event_unique');
        });
    }
};
