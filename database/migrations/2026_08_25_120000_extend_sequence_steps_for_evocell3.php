<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sequence_steps', function (Blueprint $table) {
            $table->string('step_type', 20)->default('email')->after('position');
            $table->string('meeting_url')->nullable()->after('body');
            $table->unsignedSmallInteger('on_reply_step')->nullable()->after('meeting_url');
            $table->unsignedSmallInteger('on_no_reply_step')->nullable()->after('on_reply_step');
            $table->string('variant_key', 10)->nullable()->after('on_no_reply_step');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->string('variant_key', 10)->nullable()->after('next_step');
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn('variant_key');
        });

        Schema::table('sequence_steps', function (Blueprint $table) {
            $table->dropColumn(['step_type', 'meeting_url', 'on_reply_step', 'on_no_reply_step', 'variant_key']);
        });
    }
};
