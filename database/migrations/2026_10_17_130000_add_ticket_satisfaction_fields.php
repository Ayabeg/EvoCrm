<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table): void {
            $table->unsignedTinyInteger('satisfaction_rating')->nullable()->after('resolved_at');
            $table->text('satisfaction_feedback')->nullable()->after('satisfaction_rating');
            $table->timestamp('satisfaction_submitted_at')->nullable()->after('satisfaction_feedback');
            $table->index(['workspace_id', 'satisfaction_rating'], 'tickets_workspace_satisfaction_index');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table): void {
            $table->dropIndex('tickets_workspace_satisfaction_index');
            $table->dropColumn([
                'satisfaction_rating',
                'satisfaction_feedback',
                'satisfaction_submitted_at',
            ]);
        });
    }
};
