<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('workflow_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('deal_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('run_at');
            $table->string('status', 20)->default('pending');
            $table->timestamps();

            $table->index(['status', 'run_at']);
            $table->index(['workspace_id', 'workflow_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_executions');
    }
};
