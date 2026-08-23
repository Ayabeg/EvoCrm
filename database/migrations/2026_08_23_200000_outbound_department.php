<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('outbound_domains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('domain');
            $table->string('status')->default('unverified');
            $table->text('spf_record')->nullable();
            $table->string('dkim_selector')->nullable();
            $table->text('dkim_record')->nullable();
            $table->text('dmarc_record')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'domain']);
        });

        Schema::create('outbound_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('status')->default('draft');
            $table->foreignId('saved_filter_id')->nullable()->constrained('saved_filters')->nullOnDelete();
            $table->foreignId('template_id')->nullable()->constrained('outbound_templates')->nullOnDelete();
            $table->foreignId('mailbox_id')->nullable()->constrained('mailboxes')->nullOnDelete();
            $table->string('subject')->nullable();
            $table->text('body');
            $table->text('body_html')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->unsignedInteger('audience_count')->default(0);
            $table->unsignedInteger('suppressed_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['workspace_id', 'status', 'scheduled_at']);
        });

        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->foreignId('campaign_id')->nullable()->after('sequence_id')->constrained('outbound_campaigns')->nullOnDelete();
            $table->text('body_html')->nullable()->after('body');
            $table->timestamp('clicked_at')->nullable()->after('open_count');
            $table->unsignedInteger('click_count')->default(0)->after('clicked_at');
            $table->timestamp('deferred_until')->nullable()->after('failure_reason');
            $table->string('defer_reason')->nullable()->after('deferred_until');

            $table->index(['workspace_id', 'campaign_id', 'status']);
        });

        Schema::table('sequence_steps', function (Blueprint $table) {
            $table->foreignId('mailbox_id')->nullable()->after('channel')->constrained('mailboxes')->nullOnDelete();
            $table->foreignId('template_id')->nullable()->after('body')->constrained('outbound_templates')->nullOnDelete();
        });

        Schema::table('outbound_templates', function (Blueprint $table) {
            $table->text('body_html')->nullable()->after('body');
        });
    }

    public function down(): void
    {
        Schema::table('outbound_templates', function (Blueprint $table) {
            $table->dropColumn('body_html');
        });

        Schema::table('sequence_steps', function (Blueprint $table) {
            $table->dropConstrainedForeignId('mailbox_id');
            $table->dropConstrainedForeignId('template_id');
        });

        Schema::table('outbound_messages', function (Blueprint $table) {
            $table->dropIndex(['workspace_id', 'campaign_id', 'status']);
            $table->dropConstrainedForeignId('campaign_id');
            $table->dropColumn(['body_html', 'clicked_at', 'click_count', 'deferred_until', 'defer_reason']);
        });

        Schema::dropIfExists('outbound_campaigns');
        Schema::dropIfExists('outbound_domains');
    }
};
