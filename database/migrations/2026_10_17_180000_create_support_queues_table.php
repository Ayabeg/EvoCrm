<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_queues', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('slug', 140);
            $table->boolean('is_active')->default(true);
            $table->boolean('round_robin')->default(false);
            $table->unsignedInteger('round_robin_cursor')->default(0);
            $table->timestamps();

            $table->unique(['workspace_id', 'slug']);
            $table->index(['workspace_id', 'is_active']);
        });

        Schema::table('tickets', function (Blueprint $table): void {
            $table->foreignId('queue_id')
                ->nullable()
                ->after('owner_id')
                ->constrained('support_queues')
                ->nullOnDelete();
            $table->index(['workspace_id', 'queue_id', 'status'], 'tickets_workspace_queue_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table): void {
            $table->dropIndex('tickets_workspace_queue_status_index');
            $table->dropConstrainedForeignId('queue_id');
        });

        Schema::dropIfExists('support_queues');
    }
};
