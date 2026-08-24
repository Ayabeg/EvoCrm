<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->string('source')->default('manual')->after('workspace_id');
            $table->index(['workspace_id', 'from_address']);
        });
    }

    public function down(): void
    {
        Schema::table('mailboxes', function (Blueprint $table) {
            $table->dropIndex(['workspace_id', 'from_address']);
            $table->dropColumn('source');
        });
    }
};
