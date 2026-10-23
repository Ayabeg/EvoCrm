<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('outbound_campaigns', function (Blueprint $table): void {
            $table->unsignedInteger('daily_limit')->default(20)->after('mailbox_id');
        });
    }

    public function down(): void
    {
        Schema::table('outbound_campaigns', function (Blueprint $table): void {
            $table->dropColumn('daily_limit');
        });
    }
};
