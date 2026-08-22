<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->foreignId('owner_id')->nullable()->after('notes')->constrained('users')->nullOnDelete();
            $table->string('wilaya')->nullable()->after('city');
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->foreignId('owner_id')->nullable()->after('meta')->constrained('users')->nullOnDelete();
            $table->string('wilaya')->nullable()->after('phone_e164');
            $table->string('city')->nullable()->after('wilaya');
            $table->timestamp('last_activity_at')->nullable()->after('owner_id');
            $table->boolean('unanswered')->default(false)->after('last_activity_at');
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->foreignId('owner_id')->nullable()->after('next_activity_at')->constrained('users')->nullOnDelete();
            $table->string('source')->nullable()->after('owner_id');
            $table->string('lost_reason')->nullable()->after('source');
            $table->date('close_date')->nullable()->after('lost_reason');
            $table->string('next_step')->nullable()->after('close_date');
            $table->timestamp('last_activity_at')->nullable()->after('next_step');
        });

        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('subject')->nullable();
            $table->text('body')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->boolean('done')->default(false);
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('deal_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'type', 'done']);
            $table->index(['contact_id', 'created_at']);
            $table->index(['deal_id', 'created_at']);
        });

        Schema::create('custom_attribute_definitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('entity');
            $table->string('key');
            $table->string('label');
            $table->string('type')->default('text');
            $table->json('options')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'entity', 'key'], 'custom_attr_def_unique');
        });

        Schema::create('custom_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('definition_id')->constrained('custom_attribute_definitions')->cascadeOnDelete();
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['definition_id', 'entity_type', 'entity_id'], 'custom_attr_val_unique');
        });

        Schema::create('saved_filters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('entity')->default('deal');
            $table->json('filters');
            $table->timestamps();
        });

        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('deal_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('draft');
            $table->string('currency', 3)->default('DZD');
            $table->unsignedBigInteger('total_cents')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('quote_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedBigInteger('unit_cents')->default(0);
            $table->unsignedBigInteger('total_cents')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_items');
        Schema::dropIfExists('quotes');
        Schema::dropIfExists('saved_filters');
        Schema::dropIfExists('custom_attribute_values');
        Schema::dropIfExists('custom_attribute_definitions');
        Schema::dropIfExists('activities');

        Schema::table('deals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_id');
            $table->dropColumn(['source', 'lost_reason', 'close_date', 'next_step', 'last_activity_at']);
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_id');
            $table->dropColumn(['wilaya', 'city', 'last_activity_at', 'unanswered']);
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropConstrainedForeignId('owner_id');
            $table->dropColumn(['wilaya']);
        });
    }
};
