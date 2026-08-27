<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('graph_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('triggered_by', 32);
            $table->string('status', 16)->default('pending');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('ok_count')->default(0);
            $table->unsignedInteger('skipped_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->json('nodes')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'started_at']);
        });

        Schema::create('deal_health_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('deal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('graph_run_id')->nullable()->constrained('graph_runs')->nullOnDelete();
            $table->unsignedTinyInteger('score');
            $table->string('band', 16);
            $table->string('label', 32);
            $table->text('reason');
            $table->json('factors')->nullable();
            $table->timestamps();

            $table->index(['deal_id', 'id']);
            $table->index(['workspace_id', 'deal_id']);
        });

        Schema::create('deal_suggestions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('deal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('graph_run_id')->nullable()->constrained('graph_runs')->nullOnDelete();
            $table->foreignId('activity_id')->nullable()->constrained()->nullOnDelete();
            $table->string('kind', 24);
            $table->string('action', 32);
            $table->string('confidence', 16)->default('mid');
            $table->string('status', 16)->default('pending');
            $table->string('title');
            $table->text('body')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('applied_at')->nullable();
            $table->timestamp('dismissed_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'kind', 'status']);
            $table->index(['deal_id', 'kind', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deal_suggestions');
        Schema::dropIfExists('deal_health_snapshots');
        Schema::dropIfExists('graph_runs');
    }
};
