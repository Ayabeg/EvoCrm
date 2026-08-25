<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_segment_memberships', function (Blueprint $table) {
            $table->timestamp('exited_at')->nullable()->after('entered_at');
            $table->dropUnique(['contact_id', 'saved_filter_id']);
        });
    }

    public function down(): void
    {
        Schema::table('contact_segment_memberships', function (Blueprint $table) {
            $table->unique(['contact_id', 'saved_filter_id']);
            $table->dropColumn('exited_at');
        });
    }
};
