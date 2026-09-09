<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meeting_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->boolean('enabled')->default(true);
            $table->unsignedTinyInteger('slot_minutes')->default(30);
            $table->string('timezone')->default('Africa/Algiers');
            $table->string('work_start', 5)->default('09:00');
            $table->string('work_end', 5)->default('17:00');
            $table->json('weekdays')->nullable();
            $table->string('location_note')->nullable();
            $table->string('intro')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_schedules');
    }
};
