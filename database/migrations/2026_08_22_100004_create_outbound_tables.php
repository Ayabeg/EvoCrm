<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mailboxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('from_name');
            $table->string('from_address');
            $table->string('host');
            $table->unsignedInteger('port')->default(587);
            $table->string('encryption')->default('tls');
            $table->string('username');
            $table->text('password');
            $table->boolean('is_default')->default(true);
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });

        Schema::create('sequences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('channel')->default('email');
            $table->boolean('active')->default(false);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('sequence_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sequence_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->unsignedInteger('delay_hours')->default(0);
            $table->string('channel');
            $table->string('subject')->nullable();
            $table->text('body')->nullable();
            $table->string('wa_template_name')->nullable();
            $table->string('wa_template_language')->nullable();
            $table->timestamps();
        });

        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sequence_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('active');
            $table->unsignedSmallInteger('next_step')->default(1);
            $table->timestamp('next_run_at')->nullable();
            $table->timestamps();
        });

        Schema::create('outbound_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mailbox_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('sequence_id')->nullable()->constrained()->nullOnDelete();
            $table->string('channel');
            $table->string('to_address');
            $table->string('subject')->nullable();
            $table->text('body')->nullable();
            $table->string('status')->default('queued');
            $table->string('failure_reason')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('suppressions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('value');
            $table->string('reason')->default('unsubscribe');
            $table->string('source')->default('public');
            $table->timestamps();

            $table->unique(['workspace_id', 'type', 'value']);
        });

        Schema::create('quiet_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('timezone')->default('Africa/Algiers');
            $table->time('starts_at')->default('21:00');
            $table->time('ends_at')->default('08:00');
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiet_hours');
        Schema::dropIfExists('suppressions');
        Schema::dropIfExists('outbound_messages');
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('sequence_steps');
        Schema::dropIfExists('sequences');
        Schema::dropIfExists('mailboxes');
    }
};
