<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('inbox_url')->nullable()->after('default_dial_code');
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->timestamp('next_activity_at')->nullable()->after('closed_at');
        });

        Schema::table('threads', function (Blueprint $table) {
            $table->unsignedInteger('unread_count')->default(0)->after('last_message_at');
        });
    }

    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn('inbox_url');
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropColumn('next_activity_at');
        });

        Schema::table('threads', function (Blueprint $table) {
            $table->dropColumn('unread_count');
        });
    }
};
