<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sequences', function (Blueprint $table): void {
            $table->string('email_verification_policy', 32)
                ->default('strict')
                ->after('channel');
        });

        Schema::table('outbound_campaigns', function (Blueprint $table): void {
            $table->string('email_verification_policy', 32)
                ->default('strict')
                ->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('outbound_campaigns', function (Blueprint $table): void {
            $table->dropColumn('email_verification_policy');
        });

        Schema::table('sequences', function (Blueprint $table): void {
            $table->dropColumn('email_verification_policy');
        });
    }
};
