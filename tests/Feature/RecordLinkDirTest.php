<?php

it('passes dir through RecordLink so dashboard recent titles isolate bidi', function () {
    $link = file_get_contents(resource_path('js/ds/workspace/quick-record/RecordLink.tsx'));
    $recent = file_get_contents(resource_path('js/components/dashboard/dashboard-recent.tsx'));

    expect($link)->toContain("dir?: 'auto' | 'ltr' | 'rtl'")
        ->and($link)->toContain('dir={dir}')
        ->and($recent)->toContain('<RecordLink')
        ->and($recent)->toContain('dir="auto"');
});
