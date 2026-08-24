<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->string('type')->nullable()->after('source');
            $table->string('priority')->nullable()->after('type');
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->string('lead_status')->nullable()->after('source');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->string('industry')->nullable()->after('domain');
        });
    }

    public function down(): void
    {
        Schema::table('deals', function (Blueprint $table) {
            $table->dropColumn(['type', 'priority']);
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn('lead_status');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn('industry');
        });
    }
};
