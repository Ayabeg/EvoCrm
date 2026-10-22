<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evolution_events', function (Blueprint $table): void {
            $table->string('provider_event_id')->nullable()->after('event');
            $table->unique(['workspace_id', 'instance', 'provider_event_id'], 'evolution_events_provider_identity_unique');
        });

        Schema::table('messages', function (Blueprint $table): void {
            $table->unique(['workspace_id', 'provider', 'provider_message_id'], 'messages_provider_identity_unique');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->dropUnique('messages_provider_identity_unique');
        });

        Schema::table('evolution_events', function (Blueprint $table): void {
            $table->dropUnique('evolution_events_provider_identity_unique');
            $table->dropColumn('provider_event_id');
        });
    }
};
