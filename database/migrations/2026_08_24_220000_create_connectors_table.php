<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('connectors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 40);
            $table->string('intent', 40);
            $table->string('status', 32)->default('not_connected');
            $table->json('config')->nullable();
            $table->timestamp('connected_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('connectors');
    }
};
