<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ad_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('external_id')->nullable();
            $table->string('name');
            $table->string('status')->default('not_connected');
            $table->string('currency', 3)->default('DZD');
            $table->timestamps();
        });

        Schema::create('ad_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ad_account_id')->constrained()->cascadeOnDelete();
            $table->string('external_id')->nullable();
            $table->string('name');
            $table->string('objective')->nullable();
            $table->string('status')->default('draft');
            $table->boolean('click_to_whatsapp')->default(false);
            $table->boolean('lead_form')->default(false);
            $table->timestamps();
        });

        Schema::create('ad_leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ad_account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('ad_campaign_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->string('external_id')->nullable()->unique();
            $table->string('form_id')->nullable();
            $table->json('fields')->nullable();
            $table->timestamps();
        });

        Schema::create('evolution_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('instance')->nullable();
            $table->string('event');
            $table->json('payload')->nullable();
            $table->timestamp('received_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evolution_events');
        Schema::dropIfExists('ad_leads');
        Schema::dropIfExists('ad_campaigns');
        Schema::dropIfExists('ad_accounts');
    }
};
