<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_scores', function (Blueprint $table): void {
            $table->unsignedTinyInteger('data_quality')->default(0)->after('timing');
        });
    }

    public function down(): void
    {
        Schema::table('lead_scores', function (Blueprint $table): void {
            $table->dropColumn('data_quality');
        });
    }
};
