<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->unsignedBigInteger('monthly_quota_cents')->nullable()->after('lead_score_settings');
        });

        Schema::create('sales_quotas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('amount_cents');
            $table->timestamps();

            $table->unique(['workspace_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_quotas');

        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn('monthly_quota_cents');
        });
    }
};
