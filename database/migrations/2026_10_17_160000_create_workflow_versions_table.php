<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflow_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('workflow_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->json('snapshot');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('restored_from_version_id')->nullable();
            $table->timestamps();

            $table->unique(['workflow_id', 'version']);
            $table->index(['workspace_id', 'workflow_id', 'created_at']);
            $table->index('restored_from_version_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_versions');
    }
};
