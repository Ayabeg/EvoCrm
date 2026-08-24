<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('outbound:run')->everyMinute()->withoutOverlapping();
Schedule::command('workflow:run')->everyMinute()->withoutOverlapping();
Schedule::command('reports:deliver')->dailyAt('08:00')->timezone('Africa/Algiers')->withoutOverlapping();
Schedule::command('outbound:poll-replies')->everyFiveMinutes()->withoutOverlapping();
// Warmup advances once per Africa/Algiers day, just after the default quiet
// hours end, so peer pings (when opted in) are allowed to send immediately.
Schedule::command('outbound:warmup')->dailyAt('08:05')->timezone('Africa/Algiers')->withoutOverlapping();
