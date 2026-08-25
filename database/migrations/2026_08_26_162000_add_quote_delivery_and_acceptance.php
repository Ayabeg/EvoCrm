<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->longText('snapshot_html')->nullable()->after('notes');
            $table->json('snapshot')->nullable()->after('snapshot_html');
            $table->timestamp('expires_at')->nullable()->after('snapshot');
            $table->timestamp('sent_at')->nullable()->after('expires_at');
            $table->string('public_token', 80)->nullable()->unique()->after('sent_at');
            $table->timestamp('token_expires_at')->nullable()->after('public_token');
            $table->timestamp('revoked_at')->nullable()->after('token_expires_at');
            $table->timestamp('accepted_at')->nullable()->after('revoked_at');
            $table->string('accepted_ip', 45)->nullable()->after('accepted_at');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn([
                'snapshot_html',
                'snapshot',
                'expires_at',
                'sent_at',
                'public_token',
                'token_expires_at',
                'revoked_at',
                'accepted_at',
                'accepted_ip',
            ]);
        });
    }
};
