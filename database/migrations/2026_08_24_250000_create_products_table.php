<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('sku');
            $table->string('name');
            $table->unsignedBigInteger('unit_cents')->default(0);
            $table->string('currency', 3)->default('DZD');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['workspace_id', 'sku']);
            $table->index(['workspace_id', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
