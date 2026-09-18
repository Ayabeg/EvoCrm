<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P23 — persist checklist dismissal only.
 *
 * Activation steps are derived from CRM / P22 facts and must not live here.
 * Dismissal cannot be derived, and must survive refresh, logout, and a second session.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_activation_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('dismissed_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'user_id'], 'activation_pref_workspace_user_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_activation_preferences');
    }
};
