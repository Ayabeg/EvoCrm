<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outbound_provider_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outbound_message_id')->nullable()->constrained('outbound_messages')->nullOnDelete();
            $table->string('provider', 80);
            $table->string('provider_event_id', 160);
            $table->string('event_type', 40);
            $table->json('payload')->nullable();
            $table->timestamp('received_at');
            $table->timestamps();

            $table->unique(
                ['workspace_id', 'provider', 'provider_event_id'],
                'outbound_provider_events_identity_unique',
            );
            $table->index(['workspace_id', 'event_type']);
        });

        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->timestamp('delivered_at')->nullable()->after('sent_at');
            $table->timestamp('complained_at')->nullable()->after('bounced_at');
        });
    }

    public function down(): void
    {
        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->dropColumn(['delivered_at', 'complained_at']);
        });

        Schema::dropIfExists('outbound_provider_events');
    }
};
