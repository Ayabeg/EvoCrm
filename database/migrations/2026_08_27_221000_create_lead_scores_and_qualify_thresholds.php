<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->json('lead_score_settings')->nullable();
        });

        Schema::create('lead_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('score');
            $table->unsignedTinyInteger('fit');
            $table->unsignedTinyInteger('intent');
            $table->unsignedTinyInteger('timing');
            $table->string('reason', 280)->nullable();
            $table->json('breakdown')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_scores');

        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn('lead_score_settings');
        });
    }
};
