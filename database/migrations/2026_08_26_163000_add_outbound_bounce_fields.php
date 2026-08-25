<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->string('bounce_type', 20)->nullable()->after('failure_reason');
            $table->timestamp('bounced_at')->nullable()->after('bounce_type');
            $table->string('provider_event_id')->nullable()->after('bounced_at');
            $table->unique(['workspace_id', 'provider_event_id'], 'outbound_messages_provider_event_unique');
        });
    }

    public function down(): void
    {
        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->dropUnique('outbound_messages_provider_event_unique');
            $table->dropColumn(['bounce_type', 'bounced_at', 'provider_event_id']);
        });
    }
};
