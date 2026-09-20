<?php

it('composes Home as an attention-first operating workspace', function () {
    $home = file_get_contents(resource_path('js/pages/home.tsx'));
    $header = file_get_contents(resource_path('js/components/dashboard/dashboard-header.tsx'));
    $widget = file_get_contents(resource_path('js/components/dashboard/home-widget.tsx'));
    $css = file_get_contents(resource_path('css/app.css'));

    expect($home)->toContain('data-home="workspace"')
        ->and($home)->toContain("title={t('Needs attention')}")
        ->and($home)->toContain("title={t('Today')}")
        ->and($home)->toContain('<HomeKpiStrip')
        ->and($home)->toContain("title={t('Pipeline')}")
        ->and($home)->toContain("title={t('Recent records')}")
        ->and($home)->toContain('lg:grid-cols-2')
        ->and($home)->toContain('lg:border-l lg:border-hairline')
        ->and($home)->toContain('overflow-x-hidden')
        ->and($home)->not->toContain('max-w-6xl')
        ->and($home)->not->toContain('Deal exceptions')
        ->and($home)->not->toContain('Your schedule')
        ->and($home)->not->toContain('Recently logged activity')
        ->and($home)->not->toContain('Date.now')
        ->and($home)->not->toContain('text-brand');

    expect(strpos($home, "title={t('Needs attention')}"))->toBeLessThan(strpos($home, '<HomeKpiStrip'));
    expect(strpos($home, "title={t('Today')}"))->toBeLessThan(strpos($home, '<HomeKpiStrip'));
    expect(strpos($home, '<HomeKpiStrip'))->toBeLessThan(strpos($home, "title={t('Pipeline')}"));
    expect(strpos($home, "title={t('Pipeline')}"))->toBeLessThan(strpos($home, "title={t('Recent records')}"));

    expect($header)->toContain('text-[28px] leading-[34px] font-[650]')
        ->and($header)->toContain('/crm/deals?create=1')
        ->and($header)->toContain('variant="secondary"')
        ->and($header)->not->toContain('variant="default"');

    expect($widget)->toContain('home-widget')
        ->and($widget)->toContain('text-[18px] leading-[26px]')
        ->and($widget)->not->toContain('min-h-[168px]')
        ->and($widget)->not->toContain('rounded-xl');

    expect($css)->toContain('.home-widget')
        ->and($css)->toContain('box-shadow: none');
});

it('keeps Home queues, snapshot, and feed on the 12px type floor', function () {
    $attention = file_get_contents(resource_path('js/components/dashboard/dashboard-attention.tsx'));
    $work = file_get_contents(resource_path('js/components/dashboard/dashboard-work.tsx'));
    $pipeline = file_get_contents(resource_path('js/components/dashboard/dashboard-pipeline.tsx'));
    $recent = file_get_contents(resource_path('js/components/dashboard/dashboard-recent.tsx'));
    $strip = file_get_contents(resource_path('js/components/dashboard/home-kpi-strip.tsx'));
    $activation = file_get_contents(resource_path('js/components/dashboard/activation-checklist.tsx'));
    $helpers = file_get_contents(resource_path('js/lib/dashboard-operating-home.ts'));

    foreach ([$attention, $work, $pipeline, $recent, $strip, $activation] as $source) {
        expect($source)->not->toContain('text-[11px]')
            ->and($source)->not->toContain('text-[10px]');
    }

    expect($attention)->toContain('text-[15px] leading-[22px]')
        ->and($attention)->toContain('openRecord')
        ->and($work)->not->toContain('Date.now')
        ->and($work)->not->toContain('/complete')
        ->and($pipeline)->toContain('formatCompactDzd')
        ->and($pipeline)->toContain('amount_cents')
        ->and($pipeline)->not->toContain('bg-brand')
        ->and($recent)->toContain('text-[12px] leading-4')
        ->and($strip)->toContain('HOME_KPI_STRIP_TRACK_CLASS')
        ->and($helpers)->toContain('text-[20px]')
        ->and($helpers)->toContain('grid-cols-2')
        ->and($helpers)->toContain('lg:grid-cols-4');
});
