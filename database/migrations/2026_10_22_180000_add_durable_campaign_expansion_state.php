<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outbound_campaigns', function (Blueprint $table): void {
            $table->unsignedBigInteger('expansion_cursor')->nullable()->after('suppressed_count');
            $table->string('expansion_error', 500)->nullable()->after('expansion_cursor');
        });
    }

    public function down(): void
    {
        Schema::table('outbound_campaigns', function (Blueprint $table): void {
            $table->dropColumn(['expansion_cursor', 'expansion_error']);
        });
    }
};
