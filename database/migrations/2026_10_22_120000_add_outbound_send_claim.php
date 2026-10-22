<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->timestamp('sending_at')->nullable()->after('status');
            $table->index(['status', 'sending_at'], 'outbound_messages_send_claim_index');
        });
    }

    public function down(): void
    {
        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->dropIndex('outbound_messages_send_claim_index');
            $table->dropColumn('sending_at');
        });
    }
};
