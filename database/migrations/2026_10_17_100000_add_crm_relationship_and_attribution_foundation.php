<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table): void {
            $table->foreignId('parent_company_id')
                ->nullable()
                ->after('workspace_id')
                ->constrained('companies')
                ->nullOnDelete();
            $table->string('account_type', 32)->default('prospect')->after('name');
            $table->index(['workspace_id', 'parent_company_id'], 'companies_workspace_parent_index');
        });

        Schema::table('contacts', function (Blueprint $table): void {
            $table->string('source_detail')->nullable()->after('source');
            $table->string('source_campaign')->nullable()->after('source_detail');
            $table->string('source_medium')->nullable()->after('source_campaign');
            $table->timestamp('first_touch_at')->nullable()->after('last_activity_at');
            $table->timestamp('last_touch_at')->nullable()->after('first_touch_at');
            $table->index(['workspace_id', 'source'], 'contacts_workspace_source_index');
            $table->index(['workspace_id', 'source_campaign'], 'contacts_workspace_campaign_index');
        });

        Schema::table('leads', function (Blueprint $table): void {
            $table->string('source_detail')->nullable()->after('source');
            $table->string('source_campaign')->nullable()->after('source_detail');
            $table->string('source_medium')->nullable()->after('source_campaign');
            $table->timestamp('first_touch_at')->nullable()->after('qualified_at');
            $table->timestamp('last_touch_at')->nullable()->after('first_touch_at');
            $table->index(['workspace_id', 'source'], 'leads_workspace_source_index');
            $table->index(['workspace_id', 'source_campaign'], 'leads_workspace_campaign_index');
        });

        Schema::create('record_relationships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('from_type', 64);
            $table->unsignedBigInteger('from_id');
            $table->string('to_type', 64);
            $table->unsignedBigInteger('to_id');
            $table->string('relationship_type', 64);
            $table->json('meta')->nullable();
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->timestamps();

            $table->unique(
                ['workspace_id', 'from_type', 'from_id', 'to_type', 'to_id', 'relationship_type'],
                'record_relationships_unique'
            );
            $table->index(['workspace_id', 'from_type', 'from_id'], 'record_relationships_from_index');
            $table->index(['workspace_id', 'to_type', 'to_id'], 'record_relationships_to_index');
        });

        Schema::create('contact_consents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->string('channel', 32);
            $table->string('purpose', 64)->default('marketing');
            $table->string('status', 24)->default('unknown');
            $table->string('source', 64)->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'contact_id', 'channel', 'purpose'], 'contact_consents_unique');
            $table->index(['workspace_id', 'status'], 'contact_consents_workspace_status_index');
        });

        Schema::create('deal_probability_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('deal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stage_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('probability');
            $table->unsignedBigInteger('amount_cents')->default(0);
            $table->string('reason', 64)->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['workspace_id', 'recorded_at'], 'deal_probability_snapshots_workspace_time_index');
            $table->index(['deal_id', 'recorded_at'], 'deal_probability_snapshots_deal_time_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deal_probability_snapshots');
        Schema::dropIfExists('contact_consents');
        Schema::dropIfExists('record_relationships');

        Schema::table('contacts', function (Blueprint $table): void {
            $table->dropIndex('contacts_workspace_source_index');
            $table->dropIndex('contacts_workspace_campaign_index');
            $table->dropColumn([
                'source_detail',
                'source_campaign',
                'source_medium',
                'first_touch_at',
                'last_touch_at',
            ]);
        });

        Schema::table('leads', function (Blueprint $table): void {
            $table->dropIndex('leads_workspace_source_index');
            $table->dropIndex('leads_workspace_campaign_index');
            $table->dropColumn([
                'source_detail',
                'source_campaign',
                'source_medium',
                'first_touch_at',
                'last_touch_at',
            ]);
        });

        Schema::table('companies', function (Blueprint $table): void {
            $table->dropForeign(['parent_company_id']);
            $table->dropIndex('companies_workspace_parent_index');
            $table->dropColumn(['parent_company_id', 'account_type']);
        });
    }
};
