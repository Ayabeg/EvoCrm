<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outbound_messages', function (Blueprint $table): void {
            $table->string('reply_classification')->nullable()->after('status');
            $table->decimal('reply_classification_confidence', 3, 2)->nullable()->after('reply_classification');
            $table->timestamp('reply_classified_at')->nullable()->after('reply_classification_confidence');
            $table->timestamp('reply_reviewed_at')->nullable()->after('reply_classified_at');
            $table->index(['workspace_id', 'direction', 'reply_classification'], 'outbound_reply_classification_index');
        });
    }

    public function down(): void
    {
        Schema::table('outbound_messages', function (Blueprint $table): void {
            $table->dropIndex('outbound_reply_classification_index');
            $table->dropColumn([
                'reply_classification',
                'reply_classification_confidence',
                'reply_classified_at',
                'reply_reviewed_at',
            ]);
        });
    }
};
