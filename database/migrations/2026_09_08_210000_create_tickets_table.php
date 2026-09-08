<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('number');
            $table->string('subject');
            $table->string('status')->default('new');
            $table->string('priority')->default('medium');
            $table->string('channel')->default('manual');
            $table->foreignId('contact_id')->constrained()->restrictOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('deal_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('thread_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('sla_due_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'number']);
            $table->unique(['workspace_id', 'thread_id']);
            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'owner_id']);
            $table->index(['workspace_id', 'contact_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
