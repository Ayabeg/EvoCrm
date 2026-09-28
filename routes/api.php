<?php

use App\Http\Controllers\Api\AgentToolController;
use App\Http\Controllers\Api\V1\ActivityController;
use App\Http\Controllers\Api\V1\AuthTokenController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\DealController;
use App\Http\Controllers\Api\V1\DeviceController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\QuoteController;
use App\Http\Controllers\Api\V1\ThreadController;
use App\Http\Middleware\EnforceProductPermissions;
use Illuminate\Support\Facades\Route;

Route::post('/agent/tools/{tool}', [AgentToolController::class, 'invoke'])
    ->middleware(['agent-runtime', 'throttle:60,1'])
    ->where('tool', '[A-Za-z0-9._-]+')
    ->name('api.agent.tools.invoke');

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::post('/auth/token', [AuthTokenController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('auth.token');

    Route::middleware(['auth:sanctum', 'api-workspace', EnforceProductPermissions::class])->group(function (): void {
        Route::delete('/auth/token', [AuthTokenController::class, 'destroy'])->name('auth.revoke');
        Route::get('/me', [MeController::class, 'show'])->name('me.show');

        Route::get('/contacts', [ContactController::class, 'index'])->name('contacts.index');
        Route::post('/contacts', [ContactController::class, 'store'])->name('contacts.store');
        Route::get('/contacts/{contact}', [ContactController::class, 'show'])->name('contacts.show');
        Route::put('/contacts/{contact}', [ContactController::class, 'update'])->name('contacts.update');

        Route::get('/leads/board', [LeadController::class, 'board'])->name('leads.board');
        Route::get('/leads/{lead}', [LeadController::class, 'show'])->name('leads.show');
        Route::post('/leads/{lead}/qualify', [LeadController::class, 'qualify'])->name('leads.qualify');

        Route::get('/deals/{deal}', [DealController::class, 'show'])->name('deals.show');
        Route::post('/deals/{deal}/move', [DealController::class, 'move'])->name('deals.move');

        Route::get('/activities', [ActivityController::class, 'index'])->name('activities.index');
        Route::post('/activities', [ActivityController::class, 'store'])->name('activities.store');

        Route::get('/quotes/{quote}', [QuoteController::class, 'show'])->name('quotes.show');
        Route::post('/quotes/{quote}/send', [QuoteController::class, 'send'])->name('quotes.send');

        Route::get('/threads', [ThreadController::class, 'index'])->name('threads.index');
        Route::post('/threads/{thread}/reply', [ThreadController::class, 'reply'])->name('threads.reply');

        Route::post('/devices', [DeviceController::class, 'store'])->name('devices.store');
    });
});
