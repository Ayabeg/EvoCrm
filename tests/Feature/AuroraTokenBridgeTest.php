<?php

/**
 * Guards the EvoDesk rail against a cyclic custom-property pair that
 * made `background: var(--sidebar)` invalid (transparent) in light mode.
 *
 * aurora.css sets `--sidebar: var(--aurora-nav-bg)`.
 * The bridge must re-assert both as literals so they cannot point at each other.
 */
it('re-asserts the EvoDesk rail as a literal after Aurora remaps --sidebar', function () {
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));

    expect($bridge)->toBeString();
    expect($bridge)->toMatch('/--aurora-nav-bg:\s*#000000/');
    expect($bridge)->toMatch('/--sidebar:\s*#000000/');
    expect($bridge)->not->toMatch('/--aurora-nav-bg:\s*var\(--sidebar\)/');
});

it('places the mobile sidebar dialog title inside SheetContent', function () {
    $sidebar = file_get_contents(resource_path('js/components/ui/sidebar.tsx'));

    $contentPos = strpos($sidebar, '<SheetContent');
    $headerPos = strpos($sidebar, '<SheetHeader');

    expect($contentPos)->not->toBeFalse();
    expect($headerPos)->not->toBeFalse();
    expect($headerPos)->toBeGreaterThan($contentPos);
});
