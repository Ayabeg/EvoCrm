<?php

namespace App\Services\Crm;

use App\Models\ScheduledReport;
use App\Support\ReportWidgets;
use Illuminate\Support\Carbon;

class ScheduledReportRenderer
{
    /**
     * @return array{subject: string, html: string, window: string}
     */
    public function render(ScheduledReport $schedule): array
    {
        $schedule->loadMissing(['savedReport', 'dashboard', 'workspace']);
        $window = now('Africa/Algiers')->toDateString();
        $title = $schedule->name
            ?: $schedule->savedReport?->name
            ?: $schedule->dashboard?->name
            ?: 'EvoSales report';

        $rows = [];

        if ($schedule->savedReport) {
            $report = $schedule->savedReport;
            $rows[] = '<p>Saved report: '.e($report->name).' · '.e($report->entity).' · '.e($report->metric).'</p>';
        }

        if ($schedule->dashboard) {
            $keys = $schedule->dashboard->widgetKeys();
            $rows[] = '<p>Dashboard: '.e($schedule->dashboard->name).'</p><ul>'
                .collect($keys)->map(fn (string $key) => '<li>'.e(ReportWidgets::get($key)['title'] ?? $key).'</li>')->implode('')
                .'</ul>';
        }

        if ($rows === []) {
            $rows[] = '<p>No saved report or dashboard is attached to this schedule.</p>';
        }

        $html = '<html><body><h1>'.e($title).'</h1><p>Window '.$window.' Africa/Algiers</p>'.implode('', $rows).'</body></html>';

        return [
            'subject' => $title.' · '.$window,
            'html' => $html,
            'window' => $window,
        ];
    }

    public function dueWindow(ScheduledReport $schedule, ?Carbon $now = null): string
    {
        $now ??= now('Africa/Algiers');

        return $now->toDateString();
    }
}
