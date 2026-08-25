<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bulk_action_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('entity', 20);
            $table->string('action', 40);
            $table->string('status', 20)->index();
            $table->unsignedInteger('total')->default(0);
            $table->unsignedInteger('processed')->default(0);
            $table->unsignedInteger('succeeded')->default(0);
            $table->unsignedInteger('failed')->default(0);
            $table->json('payload')->nullable();
            $table->string('error_summary', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('bulk_action_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bulk_action_run_id')->constrained('bulk_action_runs')->cascadeOnDelete();
            $table->unsignedBigInteger('record_id');
            $table->string('status', 20);
            $table->string('error_message', 500)->nullable();
            $table->timestamps();

            $table->index(['bulk_action_run_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulk_action_rows');
        Schema::dropIfExists('bulk_action_runs');
    }
};
