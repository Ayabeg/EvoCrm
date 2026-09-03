<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ad_accounts', function (Blueprint $table) {
            $table->string('timezone')->nullable()->after('currency');
        });

        Schema::table('ad_campaigns', function (Blueprint $table) {
            $table->unsignedBigInteger('lifetime_budget_cents')->nullable()->after('daily_budget_cents');
            $table->timestamp('starts_at')->nullable()->after('lifetime_budget_cents');
            $table->timestamp('ends_at')->nullable()->after('starts_at');
        });

        Schema::table('ad_sets', function (Blueprint $table) {
            $table->string('optimization_goal')->nullable()->after('daily_budget_cents');
            $table->string('targeting_summary')->nullable()->after('optimization_goal');
            $table->unsignedBigInteger('lifetime_budget_cents')->nullable()->after('targeting_summary');
        });

        Schema::table('ads', function (Blueprint $table) {
            $table->foreignId('ad_campaign_id')->nullable()->after('ad_set_id')->constrained()->nullOnDelete();
            $table->string('creative_id')->nullable()->after('kind');
            $table->string('creative_name')->nullable()->after('creative_id');
        });

        Schema::table('ad_campaign_stats', function (Blueprint $table) {
            $table->unsignedBigInteger('reach')->default(0)->after('clicks');
        });

        Schema::table('ad_leads', function (Blueprint $table) {
            $table->foreignId('ad_set_id')->nullable()->after('ad_campaign_id')->constrained()->nullOnDelete();
            $table->foreignId('ad_id')->nullable()->after('ad_set_id')->constrained()->nullOnDelete();
            $table->string('page_id')->nullable()->after('form_id');
            $table->string('page_name')->nullable()->after('page_id');
            $table->json('attribution')->nullable()->after('fields');
        });

        Schema::table('ad_leads', function (Blueprint $table) {
            $table->dropUnique(['external_id']);
            $table->unique(['workspace_id', 'external_id']);
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('ad_set_id')->nullable()->after('ad_campaign_id')->constrained()->nullOnDelete();
            $table->foreignId('ad_id')->nullable()->after('ad_set_id')->constrained()->nullOnDelete();
        });

        Schema::create('meta_lead_forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ad_account_id')->nullable()->constrained()->nullOnDelete();
            $table->string('external_id');
            $table->string('page_id')->nullable();
            $table->string('name');
            $table->string('status')->default('active');
            $table->string('locale')->nullable();
            $table->json('questions')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'external_id']);
        });

        Schema::create('meta_field_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('meta_field');
            $table->string('crm_property');
            $table->boolean('is_custom')->default(false);
            $table->timestamps();

            $table->unique(['workspace_id', 'meta_field']);
        });

        Schema::create('meta_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('webhook_endpoint_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_event_id');
            $table->string('event_type');
            $table->json('payload');
            $table->string('status')->default('pending');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'provider_event_id']);
            $table->index(['workspace_id', 'status']);
        });

        Schema::create('meta_conversion_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('crm_event');
            $table->string('meta_event');
            $table->boolean('enabled')->default(false);
            $table->string('pixel_id')->nullable();
            $table->timestamp('last_success_at')->nullable();
            $table->timestamp('last_failure_at')->nullable();
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->timestamps();

            $table->unique(['workspace_id', 'crm_event']);
        });

        Schema::create('meta_conversion_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('meta_conversion_config_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event_id');
            $table->string('crm_event');
            $table->string('meta_event');
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('status')->default('pending');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->json('request_meta')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'event_id']);
            $table->index(['workspace_id', 'status']);
        });

        Schema::create('meta_sync_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('kind');
            $table->string('mode')->default('incremental');
            $table->string('status')->default('running');
            $table->string('cursor')->nullable();
            $table->unsignedInteger('processed')->default(0);
            $table->json('stats')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'kind', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meta_sync_runs');
        Schema::dropIfExists('meta_conversion_events');
        Schema::dropIfExists('meta_conversion_configs');
        Schema::dropIfExists('meta_webhook_events');
        Schema::dropIfExists('meta_field_mappings');
        Schema::dropIfExists('meta_lead_forms');

        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ad_id');
            $table->dropConstrainedForeignId('ad_set_id');
        });

        Schema::table('ad_leads', function (Blueprint $table) {
            $table->dropUnique(['workspace_id', 'external_id']);
            $table->unique('external_id');
            $table->dropConstrainedForeignId('ad_id');
            $table->dropConstrainedForeignId('ad_set_id');
            $table->dropColumn(['page_id', 'page_name', 'attribution']);
        });

        Schema::table('ad_campaign_stats', function (Blueprint $table) {
            $table->dropColumn('reach');
        });

        Schema::table('ads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ad_campaign_id');
            $table->dropColumn(['creative_id', 'creative_name']);
        });

        Schema::table('ad_sets', function (Blueprint $table) {
            $table->dropColumn(['optimization_goal', 'targeting_summary', 'lifetime_budget_cents']);
        });

        Schema::table('ad_campaigns', function (Blueprint $table) {
            $table->dropColumn(['lifetime_budget_cents', 'starts_at', 'ends_at']);
        });

        Schema::table('ad_accounts', function (Blueprint $table) {
            $table->dropColumn('timezone');
        });
    }
};
