<?php

/**
 * P03 — one public primitive API at @/components/ui/*, backed by Aurora
 * and painted with P02 semantic tokens. Does not own AppShell / rail width.
 */

it('keeps product buttons on the Aurora adapter with a 36px default control', function () {
    $adapter = file_get_contents(resource_path('js/components/ui/button.tsx'));
    $bridge = file_get_contents(resource_path('js/lib/aurora/shadcn-bridge.ts'));
    $product = file_get_contents(resource_path('css/app.css'));

    expect($adapter)->toContain("from '@/components/ui/aurora/button'")
        ->and($adapter)->toContain('aurora-btn--aurora aurora-btn--filled')
        ->and($bridge)->toContain("return { variant: 'aurora', filled: true }")
        ->and($product)->toContain('height: 36px')
        ->and($product)->toContain('.aurora-btn {')
        ->and($product)->toContain('border-radius: 8px')
        ->and($product)->toContain('.aurora-btn--filled.aurora-btn--aurora')
        ->and($product)->toContain('color: #ffffff')
        ->and($product)->toContain('background: var(--primary)');
});

it('exposes the locked primitives on a single @/components/ui import path', function () {
    $public = [
        'button',
        'input',
        'select',
        'tabs',
        'badge',
        'avatar',
        'checkbox',
        'dropdown-menu',
        'tooltip',
        'dialog',
        'sheet',
        'drawer',
        'sonner',
        'toast',
        'skeleton',
        'label',
        'textarea',
        'switch',
        'separator',
        'popover',
        'field',
        'callout',
    ];

    foreach ($public as $name) {
        expect(resource_path("js/components/ui/{$name}.tsx"))->toBeFile();
    }

    $ds = [
        'Button',
        'Input',
        'Select',
        'Tabs',
        'Badge',
        'Avatar',
        'Checkbox',
        'Dropdown',
        'Tooltip',
        'Modal',
        'Drawer',
        'Toast',
        'Skeleton',
        'EmptyState',
    ];

    foreach ($ds as $name) {
        $path = resource_path("js/ds/components/{$name}.tsx");
        expect($path)->toBeFile();
        expect(file_get_contents($path))->toContain('@/components/ui/');
    }
});

it('lets Input accept a label above and an error string below', function () {
    $input = file_get_contents(resource_path('js/components/ui/input.tsx'));

    expect($input)->toContain('label?:')
        ->and($input)->toContain('hint?:')
        ->and($input)->toContain("error?: boolean | string")
        ->and($input)->toContain('FieldError')
        ->and($input)->toContain("from '@/components/ui/aurora/input'");
});

it('does not introduce a third theme or Wave hex in public primitives', function () {
    $files = glob(resource_path('js/components/ui/*.tsx')) ?: [];

    expect($files)->not->toBeEmpty();

    foreach ($files as $file) {
        $src = file_get_contents($file);
        expect($src)->not->toContain('#eaeaea')
            ->and($src)->not->toContain('#d9500f')
            ->and($src)->not->toContain('EvoButton')
            ->and($src)->not->toContain('PremiumButton');
    }

    $alert = file_get_contents(resource_path('js/components/ui/alert.tsx'));
    expect($alert)->toContain('var(--color-')
        ->and($alert)->not->toContain('--evosales-canvas')
        ->and($alert)->not->toContain('--evosales-ink');
});

it('uses Phosphor inside public-facing primitives that render icons', function () {
    $files = [
        'js/components/ui/breadcrumb.tsx',
        'js/components/ui/input-otp.tsx',
        'js/components/ui/navigation-menu.tsx',
        'js/components/ui/aurora/input.tsx',
        'js/components/ui/aurora/select.tsx',
        'js/components/ui/aurora/native-select.tsx',
        'js/components/ui/aurora/checkbox.tsx',
        'js/components/ui/aurora/dialog.tsx',
        'js/components/ui/aurora/sheet.tsx',
        'js/components/ui/aurora/dropdown-menu.tsx',
        'js/components/ui/aurora/badge.tsx',
    ];

    foreach ($files as $file) {
        $src = file_get_contents(resource_path($file));
        expect($src)->not->toContain("from 'lucide-react'")
            ->and($src)->not->toContain('from "lucide-react"');
    }

    expect(file_get_contents(resource_path('js/components/ui/breadcrumb.tsx')))
        ->toContain('@phosphor-icons/react');
});

it('routes product FieldError and Callout through the public ui barrels', function () {
    $auth = [
        'js/pages/auth/login.tsx',
        'js/pages/auth/register.tsx',
        'js/pages/auth/reset-password.tsx',
        'js/pages/auth/confirm-password.tsx',
        'js/pages/auth/forgot-password.tsx',
        'js/pages/auth/two-factor-challenge.tsx',
        'js/pages/auth/auth-status.tsx',
        'js/components/alert-error.tsx',
    ];

    foreach ($auth as $file) {
        expect(file_get_contents(resource_path($file)))
            ->not->toContain("@/components/ui/aurora/");
    }

    expect(file_get_contents(resource_path('js/pages/auth/login.tsx')))
        ->toContain("@/components/ui/field");
    expect(file_get_contents(resource_path('js/pages/auth/auth-status.tsx')))
        ->toContain("@/components/ui/callout");
});

it('locks control radius to 8px for Aurora inputs without a third palette', function () {
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));

    expect($bridge)->toContain('--aurora-radius-1: 8px')
        ->and($bridge)->not->toContain('--aurora-radius-1: 12px');
});
