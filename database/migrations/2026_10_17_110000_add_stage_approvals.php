<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stages', function (Blueprint $table): void {
            $table->boolean('requires_approval')->default(false)->after('required_properties');
        });

        Schema::create('deal_stage_approvals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('deal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stage_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status', 24)->default('pending');
            $table->text('note')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status'], 'deal_stage_approvals_workspace_status_index');
            $table->index(['deal_id', 'stage_id', 'status'], 'deal_stage_approvals_deal_stage_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deal_stage_approvals');

        Schema::table('stages', function (Blueprint $table): void {
            $table->dropColumn('requires_approval');
        });
    }
};
