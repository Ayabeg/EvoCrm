<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_command_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('run_uuid')->unique();
            $table->string('command', 100)->index();
            $table->string('status', 20)->index();
            $table->string('instance_id', 180)->nullable();
            $table->timestamp('started_at')->index();
            $table->timestamp('finished_at')->nullable();
            $table->unsignedBigInteger('duration_ms')->nullable();
            $table->string('error_type')->nullable();
            $table->string('error_summary', 500)->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'command', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_command_runs');
    }
};
