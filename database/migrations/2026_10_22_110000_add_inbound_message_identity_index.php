<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->unique(
                ['workspace_id', 'mailbox_id', 'direction', 'message_id'],
                'outbound_messages_inbound_identity_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->dropUnique('outbound_messages_inbound_identity_unique');
        });
    }
};
