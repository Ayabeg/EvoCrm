<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table): void {
            $table->softDeletes();
        });

        Schema::create('contact_merges', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('survivor_contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('absorbed_contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('merged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('snapshot');
            $table->timestamp('merged_at');
            $table->timestamp('undone_at')->nullable();
            $table->foreignId('undone_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['workspace_id', 'undone_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_merges');

        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropSoftDeletes();
        });
    }
};
