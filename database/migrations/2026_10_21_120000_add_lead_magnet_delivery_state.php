<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_magnet_submissions', function (Blueprint $table): void {
            $table->text('delivery_error')->nullable()->after('delivery_status');
            $table->timestamp('accepted_at')->nullable()->after('delivery_error');
        });
    }

    public function down(): void
    {
        Schema::table('lead_magnet_submissions', function (Blueprint $table): void {
            $table->dropColumn(['delivery_error', 'accepted_at']);
        });
    }
};
