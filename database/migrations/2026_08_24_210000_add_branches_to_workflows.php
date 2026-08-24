<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            $table->string('condition_field')->nullable()->after('action_config');
            $table->string('condition_operator')->nullable()->after('condition_field');
            $table->string('condition_value')->nullable()->after('condition_operator');
            $table->string('else_action')->nullable()->after('condition_value');
            $table->json('else_action_config')->nullable()->after('else_action');
        });
    }

    public function down(): void
    {
        Schema::table('workflows', function (Blueprint $table) {
            $table->dropColumn([
                'condition_field',
                'condition_operator',
                'condition_value',
                'else_action',
                'else_action_config',
            ]);
        });
    }
};
