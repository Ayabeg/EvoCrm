<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_sync_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 40);
            $table->string('status', 20)->default('idle');
            $table->string('cursor')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->string('last_error')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'provider']);
        });

        Schema::table('activities', function (Blueprint $table) {
            $table->string('provider', 40)->nullable()->after('type');
            $table->string('provider_event_id')->nullable()->after('provider');
            $table->unique(['workspace_id', 'provider', 'provider_event_id'], 'activities_provider_event_unique');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropUnique('activities_provider_event_unique');
            $table->dropColumn(['provider', 'provider_event_id']);
        });

        Schema::dropIfExists('google_sync_states');
    }
};
