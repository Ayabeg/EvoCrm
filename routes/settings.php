<?php

use App\Http\Controllers\Settings\PeopleController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    Route::middleware('can-manage-settings')->group(function () {
        Route::get('settings/people', [PeopleController::class, 'index'])->name('settings.people');
        Route::post('settings/people', [PeopleController::class, 'store'])->name('settings.people.store');
        Route::post('settings/people/{user}/resend', [PeopleController::class, 'resend'])->name('settings.people.resend');
        Route::put('settings/people/{user}/role', [PeopleController::class, 'updateRole'])->name('settings.people.role');
        Route::delete('settings/people/{user}', [PeopleController::class, 'destroy'])->name('settings.people.destroy');
    });
});
