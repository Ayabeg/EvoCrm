<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrichment_runs', function (Blueprint $table) {
            $table->string('verification_status', 32)->default('unknown')->after('status');
            $table->string('evidence_url', 2048)->nullable()->after('verification_status');
            $table->timestamp('retrieved_at')->nullable()->after('evidence_url');
            $table->timestamp('verified_at')->nullable()->after('retrieved_at');

            $table->index(['workspace_id', 'target_type', 'target_id', 'field', 'verification_status'], 'enrichment_runs_provenance_index');
        });
    }

    public function down(): void
    {
        Schema::table('enrichment_runs', function (Blueprint $table) {
            $table->dropIndex('enrichment_runs_provenance_index');
            $table->dropColumn(['verification_status', 'evidence_url', 'retrieved_at', 'verified_at']);
        });
    }
};
