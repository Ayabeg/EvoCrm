<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->string('external_id')->nullable()->after('lead_status');
            $table->unique(['workspace_id', 'external_id']);
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->string('external_id')->nullable()->after('source');
            $table->unique(['workspace_id', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropUnique(['workspace_id', 'external_id']);
            $table->dropColumn('external_id');
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropUnique(['workspace_id', 'external_id']);
            $table->dropColumn('external_id');
        });
    }
};
