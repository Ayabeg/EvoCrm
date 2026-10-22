<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
