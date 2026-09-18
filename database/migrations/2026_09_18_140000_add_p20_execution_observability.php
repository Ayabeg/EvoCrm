<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflow_executions', function (Blueprint $table) {
            $table->string('workflow_name')->nullable()->after('workflow_id');
            $table->foreignId('ticket_id')->nullable()->after('deal_id')->constrained()->nullOnDelete();
            $table->string('trigger')->nullable()->after('ticket_id');
            $table->string('branch', 16)->nullable()->after('trigger');
            $table->string('action')->nullable()->after('branch');
            $table->boolean('condition_passed')->nullable()->after('action');
            $table->unsignedInteger('delay_minutes')->default(0)->after('condition_passed');
            $table->json('action_parameters')->nullable()->after('delay_minutes');
            $table->json('result_summary')->nullable()->after('action_parameters');
            $table->string('error_summary', 500)->nullable()->after('result_summary');
            $table->timestamp('started_at')->nullable()->after('run_at');
            $table->timestamp('finished_at')->nullable()->after('started_at');

            $table->index(['workspace_id', 'run_at']);
        });
    }

    public function down(): void
    {
        Schema::table('workflow_executions', function (Blueprint $table) {
            $table->dropIndex(['workspace_id', 'run_at']);
            $table->dropConstrainedForeignId('ticket_id');
            $table->dropColumn([
                'workflow_name',
                'trigger',
                'branch',
                'action',
                'condition_passed',
                'delay_minutes',
                'action_parameters',
                'result_summary',
                'error_summary',
                'started_at',
                'finished_at',
            ]);
        });
    }
};
