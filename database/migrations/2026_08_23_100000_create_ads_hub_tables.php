<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ad_campaign_id')->constrained()->cascadeOnDelete();
            $table->string('external_id')->nullable();
            $table->string('name');
            $table->string('status')->default('active');
            $table->unsignedBigInteger('daily_budget_cents')->default(0);
            $table->timestamps();
        });

        Schema::create('ads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ad_set_id')->constrained()->cascadeOnDelete();
            $table->string('external_id')->nullable();
            $table->string('name');
            $table->string('status')->default('active');
            $table->string('kind')->default('image');
            $table->timestamps();
        });

        Schema::create('ad_campaign_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ad_campaign_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedBigInteger('impressions')->default(0);
            $table->unsignedBigInteger('clicks')->default(0);
            $table->unsignedBigInteger('spend_cents')->default(0);
            $table->timestamps();

            $table->unique(['ad_campaign_id', 'date']);
        });

        Schema::table('ad_campaigns', function (Blueprint $table) {
            $table->unsignedBigInteger('daily_budget_cents')->default(0)->after('status');
        });

        // CRM-side funnel attribution: which campaign sourced this thread/lead.
        Schema::table('threads', function (Blueprint $table) {
            $table->foreignId('ad_campaign_id')->nullable()->after('channel_id')->constrained()->nullOnDelete();
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('ad_campaign_id')->nullable()->after('company_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ad_campaign_id');
        });

        Schema::table('threads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('ad_campaign_id');
        });

        Schema::table('ad_campaigns', function (Blueprint $table) {
            $table->dropColumn('daily_budget_cents');
        });

        Schema::dropIfExists('ad_campaign_stats');
        Schema::dropIfExists('ads');
        Schema::dropIfExists('ad_sets');
    }
};
