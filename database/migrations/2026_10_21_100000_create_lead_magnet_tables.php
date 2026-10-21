<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_magnet_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('slug', 100);
            $table->string('name', 160);
            $table->string('kind', 60)->default('calculator');
            $table->string('version', 40)->default('lead-leakage-v1');
            $table->string('status', 24)->default('active');
            $table->text('description')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'slug']);
            $table->index(['workspace_id', 'status']);
        });

        Schema::create('lead_magnet_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_magnet_offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->string('idempotency_key', 80);
            $table->string('name', 160)->nullable();
            $table->string('email', 180)->nullable();
            $table->string('company', 180)->nullable();
            $table->json('assumptions');
            $table->json('result');
            $table->json('attribution')->nullable();
            $table->string('delivery_status', 32)->default('inline');
            $table->boolean('marketing_consent')->default(false);
            $table->timestamps();

            $table->unique(['workspace_id', 'lead_magnet_offer_id', 'idempotency_key'], 'lead_magnet_submission_idempotency');
            $table->index(['workspace_id', 'email']);
            $table->index(['workspace_id', 'created_at']);
        });

        $now = now();
        $workspaceIds = DB::table('workspaces')->pluck('id');

        if ($workspaceIds->isNotEmpty()) {
            DB::table('lead_magnet_offers')->insert($workspaceIds->map(fn (int $workspaceId): array => [
                'workspace_id' => $workspaceId,
                'slug' => 'lead-leakage-calculator',
                'name' => 'Lead Leakage Calculator',
                'kind' => 'calculator',
                'version' => 'lead-leakage-v1',
                'status' => 'active',
                'description' => 'Estimate the value of inquiries lost through missed responses and inconsistent follow-up.',
                'settings' => json_encode(['currency' => 'DZD'], JSON_THROW_ON_ERROR),
                'created_at' => $now,
                'updated_at' => $now,
            ])->all());
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_magnet_submissions');
        Schema::dropIfExists('lead_magnet_offers');
    }
};
