<?php

use App\Http\Controllers\Settings\AuditTrailController;
use App\Http\Controllers\Settings\LeadScoreSettingsController;
use App\Http\Controllers\Settings\MeetingScheduleController;
use App\Http\Controllers\Settings\PeopleController;
use App\Http\Controllers\Settings\PlaybookController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\QuotaController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\SmsSettingsController;
use App\Http\Controllers\Settings\SystemHealthController;
use App\Http\Middleware\EnforceProductPermissions;
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

    Route::get('settings/meetings', [MeetingScheduleController::class, 'edit'])->name('settings.meetings');
    Route::put('settings/meetings', [MeetingScheduleController::class, 'update'])->name('settings.meetings.update');

    Route::middleware(['can-manage-settings', EnforceProductPermissions::class])->group(function () {
        Route::get('settings/system-health', SystemHealthController::class)->name('settings.system-health');
        Route::get('settings/audit', AuditTrailController::class)->name('settings.audit');
        Route::get('settings/qualify', [LeadScoreSettingsController::class, 'edit'])->name('settings.qualify');
        Route::put('settings/qualify', [LeadScoreSettingsController::class, 'update'])->name('settings.qualify.update');
        Route::get('settings/playbooks', [PlaybookController::class, 'index'])->name('settings.playbooks');
        Route::post('settings/playbooks', [PlaybookController::class, 'store'])->name('settings.playbooks.store');
        Route::put('settings/playbooks/{playbook}', [PlaybookController::class, 'update'])->name('settings.playbooks.update');
        Route::delete('settings/playbooks/{playbook}', [PlaybookController::class, 'destroy'])->name('settings.playbooks.destroy');
        Route::get('settings/people', [PeopleController::class, 'index'])->name('settings.people');
        Route::post('settings/people', [PeopleController::class, 'store'])->name('settings.people.store');
        Route::post('settings/people/{user}/resend', [PeopleController::class, 'resend'])->name('settings.people.resend');
        Route::put('settings/people/{user}/role', [PeopleController::class, 'updateRole'])->name('settings.people.role');
        Route::delete('settings/people/{user}', [PeopleController::class, 'destroy'])->name('settings.people.destroy');
        Route::get('settings/sms', [SmsSettingsController::class, 'edit'])->name('settings.sms');
        Route::post('settings/sms', [SmsSettingsController::class, 'update'])->name('settings.sms.update');
        Route::delete('settings/sms', [SmsSettingsController::class, 'destroy'])->name('settings.sms.destroy');
        Route::get('settings/quotas', [QuotaController::class, 'edit'])->name('settings.quotas');
        Route::put('settings/quotas', [QuotaController::class, 'update'])->name('settings.quotas.update');
    });
});
