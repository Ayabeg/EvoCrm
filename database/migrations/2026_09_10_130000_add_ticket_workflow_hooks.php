<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->timestamp('sla_breached_at')->nullable()->after('sla_due_at');
            $table->index(['sla_breached_at', 'status', 'sla_due_at']);
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->string('trigger_status')->nullable()->after('trigger_stage_id');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['sla_breached_at', 'status', 'sla_due_at']);
            $table->dropColumn('sla_breached_at');
        });

        Schema::table('workflows', function (Blueprint $table) {
            $table->dropColumn('trigger_status');
        });
    }
};
