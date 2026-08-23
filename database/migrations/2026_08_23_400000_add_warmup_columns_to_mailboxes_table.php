<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->unsignedInteger('warmup_day')->default(0)->after('daily_limit');
            $table->unsignedInteger('warmup_ceiling')->default(40)->after('warmup_day');
            $table->unsignedInteger('warmup_previous_limit')->nullable()->after('warmup_ceiling');
            $table->timestamp('warmup_started_at')->nullable()->after('warmup_previous_limit');
            $table->date('warmup_last_advanced_on')->nullable()->after('warmup_started_at');
            $table->boolean('warmup_peers')->default(false)->after('warmup_last_advanced_on');
            $table->boolean('warmup_opted_in')->default(false)->after('warmup_peers');
        });
    }

    public function down(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->dropColumn([
                'warmup_day',
                'warmup_ceiling',
                'warmup_previous_limit',
                'warmup_started_at',
                'warmup_last_advanced_on',
                'warmup_peers',
                'warmup_opted_in',
            ]);
        });
    }
};
