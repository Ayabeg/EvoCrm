<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('custom_attribute_definitions', function (Blueprint $table) {
            $table->json('formula')->nullable()->after('options');
        });

        Schema::create('saved_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('entity', 20);
            $table->json('filters')->nullable();
            $table->string('metric', 40)->default('count');
            $table->string('group_by', 40)->nullable();
            $table->timestamps();
        });

        Schema::create('scheduled_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('saved_report_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('dashboard_id')->nullable()->constrained()->nullOnDelete();
            $table->string('cron', 40)->default('0 8 * * 1');
            $table->json('recipients');
            $table->boolean('active')->default(true);
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_reports');
        Schema::dropIfExists('saved_reports');

        Schema::table('custom_attribute_definitions', function (Blueprint $table) {
            $table->dropColumn('formula');
        });
    }
};
