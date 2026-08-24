<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('record_layouts', function (Blueprint $table) {
            $table->boolean('is_workspace_default')->default(false)->after('layout');
        });

        Schema::table('dashboards', function (Blueprint $table) {
            $table->string('visibility', 20)->default('private')->after('name');
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->foreignId('team_id')->nullable()->after('owner_id')->constrained('users')->nullOnDelete();
        });

        Schema::table('sequence_steps', function (Blueprint $table) {
            $table->string('subject_b', 180)->nullable()->after('subject');
            $table->unsignedInteger('ab_sent_a')->default(0)->after('variant_key');
            $table->unsignedInteger('ab_sent_b')->default(0)->after('ab_sent_a');
            $table->unsignedInteger('ab_open_a')->default(0)->after('ab_sent_b');
            $table->unsignedInteger('ab_open_b')->default(0)->after('ab_open_a');
        });

        Schema::create('contact_segment_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->foreignId('saved_filter_id')->constrained()->cascadeOnDelete();
            $table->timestamp('entered_at');
            $table->timestamps();

            $table->unique(['contact_id', 'saved_filter_id']);
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->foreignId('trigger_saved_filter_id')->nullable()->after('trigger_stage_id')->constrained('saved_filters')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            $table->dropConstrainedForeignId('trigger_saved_filter_id');
        });

        Schema::dropIfExists('contact_segment_memberships');

        Schema::table('sequence_steps', function (Blueprint $table) {
            $table->dropColumn(['subject_b', 'ab_sent_a', 'ab_sent_b', 'ab_open_a', 'ab_open_b']);
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('team_id');
        });

        Schema::table('dashboards', function (Blueprint $table) {
            $table->dropColumn('visibility');
        });

        Schema::table('record_layouts', function (Blueprint $table) {
            $table->dropColumn('is_workspace_default');
        });
    }
};
