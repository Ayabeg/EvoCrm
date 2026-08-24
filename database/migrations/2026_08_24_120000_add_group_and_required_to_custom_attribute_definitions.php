<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('custom_attribute_definitions', function (Blueprint $table) {
            $table->string('group_name')->nullable()->after('options');
            $table->boolean('required')->default(false)->after('group_name');
        });
    }

    public function down(): void
    {
        Schema::table('custom_attribute_definitions', function (Blueprint $table) {
            $table->dropColumn(['group_name', 'required']);
        });
    }
};
