<?php

/**
 * P03 — Canonical primitives live in resources/js/evo/ui/*.
 * Product imports @/evo/ui/* (sidebar/sonner/empty-illustration stay as implementations).
 * Does not own AppShell / rail width.
 */

it('keeps product buttons on the Evo adapter with a 36px default control', function () {
    $bridge = file_get_contents(resource_path('js/lib/aurora/shadcn-bridge.ts'));
    $product = file_get_contents(resource_path('css/app.css'));
    $evo = file_get_contents(resource_path('js/evo/ui/button.tsx'));

    expect($evo)->not->toContain('@/components/ui/aurora')
        ->and($evo)->not->toContain('PremiumButton')
        ->and($evo)->not->toContain('GlassButton')
        ->and($evo)->toContain('data-slot="button"')
        ->and($bridge)->toContain("return { variant: 'default', filled: true }")
        ->and($evo)->toContain('evo-btn')
        ->and($evo)->toContain('h-9')
        ->and($product)->toContain('height: 36px')
        ->and($product)->toContain('.evo-btn')
        ->and($product)->toContain('border-radius: 8px')
        ->and($product)->toContain('color: var(--evo-on-primary)')
        ->and($product)->toContain('background: var(--primary)');
});

it('exposes the locked primitives on a single @/evo/ui import path', function () {
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
        expect(resource_path("js/evo/ui/{$name}.tsx"))->toBeFile();
    }

    expect(resource_path('js/components/ui/sonner.tsx'))->toBeFile();
    expect(resource_path('js/evo/patterns/empty-state/index.tsx'))->toBeFile();

    $pages = [
        'js/pages/auth/login.tsx' => '@/evo/ui/field',
        'js/pages/auth/auth-status.tsx' => '@/evo/ui/callout',
        'js/components/crm/create-drawer.tsx' => '@/evo/ui/drawer',
        'js/components/crm/record-hub.tsx' => '@/evo/ui/card',
    ];

    foreach ($pages as $file => $import) {
        expect(file_get_contents(resource_path($file)))->toContain($import);
    }

    foreach ($public as $name) {
        $src = file_get_contents(resource_path("js/evo/ui/{$name}.tsx"));
        expect($src)->not->toContain("@/components/ui/{$name}'");
        expect($src)->not->toContain("@/ds/components/");
    }
});

it('lets Input and Select accept a label above and an error string below', function () {
    $input = file_get_contents(resource_path('js/evo/ui/input.tsx'));
    $select = file_get_contents(resource_path('js/evo/ui/select.tsx'));

    expect($input)->toContain('label?:')
        ->and($input)->toContain('hint?:')
        ->and($input)->toContain('error?: boolean | string')
        ->and($input)->toContain('FieldError')
        ->and($select)->toContain('label?:')
        ->and($select)->toContain('hint?:')
        ->and($select)->toContain('error?: boolean | string')
        ->and($select)->toContain('FieldError');
});

it('does not introduce a third theme or Wave hex in public primitives', function () {
    $files = array_merge(
        glob(resource_path('js/components/ui/*.tsx')) ?: [],
        glob(resource_path('js/evo/ui/*.tsx')) ?: [],
    );

    expect($files)->not->toBeEmpty();

    foreach ($files as $file) {
        $src = file_get_contents($file);
        expect($src)->not->toContain('#eaeaea')
            ->and($src)->not->toContain('#d9500f')
            ->and($src)->not->toContain('EvoButton')
            ->and($src)->not->toContain('PremiumButton');
    }

    $alert = file_get_contents(resource_path('js/evo/ui/alert.tsx'));
    expect($alert)->toContain('var(--evo-')
        ->and($alert)->not->toContain('--evosales-canvas')
        ->and($alert)->not->toContain('--evosales-ink');
});

it('uses Phosphor inside public-facing primitives that render icons', function () {
    $files = [
        'js/components/ui/breadcrumb.tsx',
        'js/components/ui/input-otp.tsx',
        'js/components/ui/navigation-menu.tsx',
        'js/evo/ui/input.tsx',
        'js/evo/ui/select.tsx',
        'js/evo/ui/native-select.tsx',
        'js/evo/ui/checkbox.tsx',
        'js/evo/ui/dialog.tsx',
        'js/evo/ui/sheet.tsx',
        'js/evo/ui/dropdown-menu.tsx',
        'js/evo/ui/badge.tsx',
        'js/evo/ui/button.tsx',
    ];

    foreach ($files as $file) {
        $src = file_get_contents(resource_path($file));
        expect($src)->not->toContain("from 'lucide-react'")
            ->and($src)->not->toContain('from "lucide-react"');
    }

    expect(file_get_contents(resource_path('js/components/ui/breadcrumb.tsx')))
        ->toContain('@phosphor-icons/react');
    expect(file_get_contents(resource_path('js/evo/ui/button.tsx')))
        ->not->toContain('lucide-react');
    expect(file_get_contents(resource_path('js/evo/ui/input.tsx')))
        ->not->toContain('lucide-react');
    expect(file_get_contents(resource_path('js/evo/ui/select.tsx')))
        ->not->toContain('lucide-react');
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
        ->toContain("@/evo/ui/field");
    expect(file_get_contents(resource_path('js/pages/auth/auth-status.tsx')))
        ->toContain("@/evo/ui/callout");
});

it('locks control radius to 8px for Aurora inputs without a third palette', function () {
    $bridge = file_get_contents(resource_path('css/aurora-evotechly-bridge.css'));

    expect($bridge)->toContain('--aurora-radius-1: 8px')
        ->and($bridge)->not->toContain('--aurora-radius-1: 12px');
});
