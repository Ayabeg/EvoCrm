<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('saved_filters', function (Blueprint $table) {
            $table->string('visibility', 20)->default('private')->after('entity');
            $table->boolean('is_workspace_default')->default(false)->after('is_default');
        });
    }

    public function down(): void
    {
        Schema::table('saved_filters', function (Blueprint $table) {
            $table->dropColumn(['visibility', 'is_workspace_default']);
        });
    }
};
