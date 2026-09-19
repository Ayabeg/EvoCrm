<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('outbound:run')->name('outbound:run')->everyMinute()->withoutOverlapping();
Schedule::command('workflow:run')->name('workflow:run')->everyMinute()->withoutOverlapping();
Schedule::command('tickets:check-sla')->name('tickets:check-sla')->everyMinute()->withoutOverlapping();
Schedule::command('meetings:nudge')->name('meetings:nudge')->everyMinute()->withoutOverlapping();
Schedule::command('reports:deliver')->name('reports:deliver')->dailyAt('08:00')->timezone('Africa/Algiers')->withoutOverlapping();
Schedule::command('google:sync-mail')->name('google:sync-mail')->everyFifteenMinutes()->withoutOverlapping();
Schedule::command('google:sync-calendar')->name('google:sync-calendar')->everyFifteenMinutes()->withoutOverlapping();
Schedule::command('meta:sync --kind=ads')->name('meta:sync')->everyFifteenMinutes()->withoutOverlapping();
Schedule::command('outbound:poll-replies')->name('outbound:poll-replies')->everyFiveMinutes()->withoutOverlapping();
Schedule::command('outbound:sync-mailboxes')->name('outbound:sync-mailboxes')->everyFifteenMinutes()->withoutOverlapping();
// Warmup advances once per Africa/Algiers day, just after the default quiet
// hours end, so peer pings (when opted in) are allowed to send immediately.
Schedule::command('outbound:warmup')->name('outbound:warmup')->dailyAt('08:05')->timezone('Africa/Algiers')->withoutOverlapping();
Schedule::command('lead-os:graph')->name('lead-os:graph')->dailyAt('02:15')->timezone('Africa/Algiers')->withoutOverlapping();
Schedule::command('deals:lost-review')->name('deals:lost-review')->weeklyOn(1, '07:30')->timezone('Africa/Algiers')->withoutOverlapping();
