<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrichment_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('target_type', 32);
            $table->unsignedBigInteger('target_id');
            $table->string('source', 32);
            $table->string('field', 64);
            $table->text('value')->nullable();
            $table->decimal('confidence', 4, 3)->default(0);
            $table->json('raw')->nullable();
            $table->string('status', 24);
            $table->text('error')->nullable();
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'target_type', 'target_id'], 'enrichment_runs_target_index');
            $table->index(['workspace_id', 'source', 'status'], 'enrichment_runs_source_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrichment_runs');
    }
};
