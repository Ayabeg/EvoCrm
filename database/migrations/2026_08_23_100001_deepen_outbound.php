<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->string('imap_host')->nullable()->after('password');
            $table->unsignedInteger('imap_port')->nullable()->after('imap_host');
            $table->string('imap_encryption')->nullable()->after('imap_port');
            $table->string('imap_username')->nullable()->after('imap_encryption');
            $table->text('imap_password')->nullable()->after('imap_username');
            $table->string('status')->default('disabled')->after('enabled');
            $table->unsignedInteger('daily_limit')->default(50)->after('status');
            $table->timestamp('last_tested_at')->nullable()->after('daily_limit');
        });

        Schema::create('outbound_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('subject')->nullable();
            $table->text('body');
            $table->timestamps();
        });

        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->string('direction')->default('out')->after('channel');
            $table->string('message_id')->nullable()->after('to_address');
            $table->foreignId('in_reply_to')->nullable()->after('message_id')->constrained('outbound_messages')->nullOnDelete();
            $table->timestamp('replied_at')->nullable()->after('sent_at');
            $table->timestamp('opened_at')->nullable()->after('replied_at');
            $table->unsignedInteger('open_count')->default(0)->after('opened_at');
            $table->string('track_token')->nullable()->unique()->after('open_count');

            $table->index(['workspace_id', 'direction', 'status']);
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->unique(['sequence_id', 'contact_id']);
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropUnique(['sequence_id', 'contact_id']);
        });

        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->dropIndex(['workspace_id', 'direction', 'status']);
            $table->dropConstrainedForeignId('in_reply_to');
            $table->dropColumn(['direction', 'message_id', 'replied_at', 'opened_at', 'open_count', 'track_token']);
        });

        Schema::dropIfExists('outbound_templates');

        Schema::table('mailboxes', function (Blueprint $table) {
            $table->dropColumn([
                'imap_host',
                'imap_port',
                'imap_encryption',
                'imap_username',
                'imap_password',
                'status',
                'daily_limit',
                'last_tested_at',
            ]);
        });
    }
};
