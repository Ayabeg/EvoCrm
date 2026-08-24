<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deal_line_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedBigInteger('unit_cents')->default(0);
            $table->unsignedBigInteger('total_cents')->default(0);
            $table->timestamps();

            $table->index(['deal_id', 'product_id']);
        });

        Schema::table('quote_items', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable()->after('quote_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quote_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('product_id');
        });

        Schema::dropIfExists('deal_line_items');
    }
};
