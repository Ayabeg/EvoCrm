<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_magnet_submissions', function (Blueprint $table): void {
            $table->boolean('enrichment_consent')->default(false)->after('marketing_consent');
        });
    }

    public function down(): void
    {
        Schema::table('lead_magnet_submissions', function (Blueprint $table): void {
            $table->dropColumn('enrichment_consent');
        });
    }
};
