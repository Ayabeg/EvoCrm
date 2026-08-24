<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('saved_filters', function (Blueprint $table) {
            $table->json('columns')->nullable()->after('filters');
            $table->json('sort')->nullable()->after('columns');
            $table->boolean('is_default')->default(false)->after('sort');
        });
    }

    public function down(): void
    {
        Schema::table('saved_filters', function (Blueprint $table) {
            $table->dropColumn(['columns', 'sort', 'is_default']);
        });
    }
};
