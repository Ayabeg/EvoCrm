<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropUnique(['workspace_id', 'email']);
            $table->dropUnique(['workspace_id', 'phone_e164']);
            $table->index(['workspace_id', 'email']);
            $table->index(['workspace_id', 'phone_e164']);
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex(['workspace_id', 'email']);
            $table->dropIndex(['workspace_id', 'phone_e164']);
            $table->unique(['workspace_id', 'email']);
            $table->unique(['workspace_id', 'phone_e164']);
        });
    }
};
