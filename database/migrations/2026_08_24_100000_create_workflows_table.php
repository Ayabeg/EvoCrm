<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('trigger');
            $table->foreignId('trigger_stage_id')->nullable()->constrained('stages')->nullOnDelete();
            $table->string('action');
            $table->json('action_config')->nullable();
            $table->boolean('active')->default(true);
            $table->string('template_key')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'trigger', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflows');
    }
};
