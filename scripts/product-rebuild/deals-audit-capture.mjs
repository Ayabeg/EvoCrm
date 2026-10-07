#!/usr/bin/env node
/**
 * WAVE 2 Agent A — Deals composition audit capture.
 * AUDIT ONLY. Does not modify product code or seed extra records.
 *
 * Usage:
 *   node scripts/product-rebuild/deals-audit-capture.mjs
 *
 * Writes screenshots + metrics under artifacts/product-rebuild/02-wave/before/deals/
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');
const OUTPUT_DIR = resolve(REPO_ROOT, 'artifacts/product-rebuild/02-wave/before/deals');
const SCREENSHOT_DIR = OUTPUT_DIR;
const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const EMAIL = process.env.EVOCRM_EMAIL || 'owner@evosales.local';
const PASSWORD = process.env.EVOCRM_PASSWORD || 'password';

const VIEWPORTS = [
    { id: '1440x1000', width: 1440, height: 1000 },
    { id: '1280x900', width: 1280, height: 900 },
    { id: '1024x768', width: 1024, height: 768 },
    { id: '768x1024', width: 768, height: 1024 },
    { id: '430x932', width: 430, height: 932 },
    { id: '390x844', width: 390, height: 844 },
];

const ROUTES = [
    { id: 'deals-list', path: '/crm/deals', kind: 'list' },
    { id: 'deals-board', path: '/crm/deals/board', kind: 'board' },
];

mkdirSync(SCREENSHOT_DIR, { recursive: true });

function phpEval(code) {
    return execFileSync('php', ['artisan', 'tinker', `--execute=${code}`], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
    }).trim();
}

function setUserLocale(locale) {
    phpEval(`
        $user = App\\Models\\User::query()->where('email', '${EMAIL}')->first();
        $user->forceFill([
            'preferences' => App\\Support\\Locale::mergePreference($user->preferences, '${locale}'),
        ])->save();
        echo App\\Support\\Locale::fromPreferences($user->fresh()->preferences);
    `);
}

function setSimpleMode(on) {
    phpEval(`
        $user = App\\Models\\User::query()->where('email', '${EMAIL}')->first();
        $user->workspace->forceFill(['simple_mode' => ${on ? 'true' : 'false'}])->save();
        echo $user->workspace->fresh()->simple_mode ? '1' : '0';
    `);
}

function seedFacts() {
    const raw = phpEval(`
        $user = App\\Models\\User::query()->where('email', '${EMAIL}')->first();
        $wid = $user->workspace_id;
        echo json_encode([
            'workspace' => $user->workspace?->name,
            'simple_mode' => (bool) $user->workspace?->simple_mode,
            'locale' => App\\Support\\Locale::fromPreferences($user->preferences),
            'deals' => App\\Models\\Deal::query()->where('workspace_id', $wid)->count(),
            'pipelines' => App\\Models\\Pipeline::query()->where('workspace_id', $wid)->count(),
            'stages' => App\\Models\\Stage::query()->whereHas('pipeline', fn ($q) => $q->where('workspace_id', $wid))->count(),
        ], JSON_UNESCAPED_UNICODE);
    `);
    return JSON.parse(raw.slice(raw.indexOf('{')));
}

async function login(page) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('#email').fill(EMAIL);
    await page.locator('#password').fill(PASSWORD);
    await Promise.all([
        page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 }),
        page.locator('[data-test="login-button"]').click(),
    ]);
}

async function applyTheme(page, theme) {
    await page.evaluate((mode) => {
        window.localStorage.setItem('appearance', mode);
        document.cookie = `appearance=${mode};path=/;max-age=31536000;SameSite=Lax`;
        const dark = mode === 'dark';
        document.documentElement.classList.toggle('dark', dark);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    }, theme);
}

async function settle(page) {
    await page
        .addStyleTag({
            content:
                '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
        })
        .catch(() => {});
    await page.waitForTimeout(800);
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
}

function attachConsole(page, bucketRef) {
    page.on('console', (msg) => {
        if (!bucketRef.current) {
            return;
        }
        if (msg.type() === 'error' || msg.type() === 'warning') {
            bucketRef.current.push({
                type: msg.type(),
                text: msg.text(),
                location: msg.location(),
            });
        }
    });
    page.on('pageerror', (error) => {
        bucketRef.current?.push({ type: 'pageerror', text: error.message, stack: error.stack });
    });
    page.on('requestfailed', (req) => {
        const failure = req.failure();
        bucketRef.current?.push({
            type: 'requestfailed',
            text: `${req.method()} ${req.url()} ${failure?.errorText || ''}`.trim(),
        });
    });
}

async function measureBands(page, kind) {
    return page.evaluate((surface) => {
        const box = (el) => {
            if (!el) {
                return null;
            }
            const r = el.getBoundingClientRect();
            return {
                x: Math.round(r.x * 10) / 10,
                y: Math.round(r.y * 10) / 10,
                width: Math.round(r.width * 10) / 10,
                height: Math.round(r.height * 10) / 10,
                bottom: Math.round(r.bottom * 10) / 10,
            };
        };

        const textOf = (el) => (el?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 160);

        const firstUseful =
            surface === 'board'
                ? document.querySelector('[data-testid^="deal-card-"]') ||
                  document.querySelector('[data-pipeline-card]') ||
                  document.querySelector('[data-crm="deals-board"] a[href^="/crm/deals/"]')
                : document.querySelector('table tbody tr') ||
                  document.querySelector('[role="rowgroup"] [role="row"]') ||
                  document.querySelector('[data-slot="table-row"]');

        const usefulBox = box(firstUseful);
        const header = document.querySelector('[data-workspace="header"]');
        const headerBox = box(header);

        const named = [
            {
                id: 'workspace-header',
                label: 'WorkspaceHeader (PageHeader adapter)',
                selector: '[data-workspace="header"]',
            },
            {
                id: 'forecast-bar',
                label: 'DealForecastBar',
                selector: '[data-testid="forecast-totals"]',
            },
            {
                id: 'attention-queue',
                label: 'DealAttentionQueue',
                selector: '[data-crm="deal-attention-queue"]',
            },
            {
                id: 'saved-views',
                label: 'SavedViews',
                selector: '[data-crm="views"]',
            },
            {
                id: 'filter-bar',
                label: 'FilterBar / operational toolbar',
                selector: '[data-crm="list-toolbar"]',
            },
            {
                id: 'active-filter-chips',
                label: 'Active filter chips (Row 3)',
                selector: '[data-crm="active-filters"]',
            },
            {
                id: 'stage-pills',
                label: 'StagePills (full-width stage-count strip)',
                selector: '[data-crm="stage-pills"]',
            },
            {
                id: 'pipeline-empty',
                label: 'Pipeline empty banner',
                selector: '[data-crm="pipeline-empty"]',
            },
            {
                id: 'bulk-bar',
                label: 'BulkActionBar',
                selector: '[data-crm="bulk-bar"], [data-ds="bulk-action-bar"]',
            },
        ];

        const bands = named
            .map((spec) => {
                const el = document.querySelector(spec.selector);
                const rect = box(el);
                if (!el || !rect || rect.height < 1) {
                    return {
                        ...spec,
                        present: false,
                        rect: null,
                        text: '',
                    };
                }
                return {
                    ...spec,
                    present: true,
                    rect,
                    text: textOf(el),
                    display: getComputedStyle(el).display,
                    overflowY: getComputedStyle(el).overflowY,
                };
            })
            .filter((band) => band.present);

        const columnHeader = document.querySelector('[data-evo="pipeline"] header, [data-testid^="stage-column"] header');
        const columnHeaderBox = box(columnHeader);

        const rail =
            document.querySelector('[data-slot="sidebar"] > .fixed') ||
            document.querySelector('[data-sidebar="sidebar"]') ||
            document.querySelector('[data-slot="sidebar"]');
        const frame = document.querySelector('[data-workspace-frame]');
        const workspace = document.querySelector('[data-crm="deals-board"], [data-crm="deals-workspace"]');
        const pipeline = document.querySelector('[data-evo="pipeline"]');
        const tableHead = document.querySelector('table thead, [data-slot="table-header"]');

        const scrollers = [...document.querySelectorAll('*')].filter((el) => {
            const style = getComputedStyle(el);
            return (
                (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
                el.scrollHeight > el.clientHeight + 2
            );
        });

        const orangePrimaries = [...document.querySelectorAll('button, a, [role="button"]')].filter((el) => {
            const style = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > window.innerHeight) {
                return false;
            }
            return (
                style.backgroundColor.includes('236, 96, 37') ||
                style.backgroundColor.includes('232, 83, 14') ||
                style.backgroundColor.includes('236,96,37') ||
                String(el.className).includes('bg-brand')
            );
        });

        const gaps = [];
        const ordered = [...bands].sort((a, b) => a.rect.y - b.rect.y);
        for (let i = 0; i < ordered.length - 1; i += 1) {
            const a = ordered[i];
            const b = ordered[i + 1];
            const gap = Math.round((b.rect.y - a.rect.bottom) * 10) / 10;
            if (gap > 0.5) {
                gaps.push({ after: a.id, before: b.id, height: gap });
            }
        }
        if (usefulBox && ordered.length) {
            const last = ordered[ordered.length - 1];
            const gap = Math.round((usefulBox.y - last.rect.bottom) * 10) / 10;
            if (gap > 0.5) {
                gaps.push({ after: last.id, before: 'first-useful', height: gap });
            }
        }

        return {
            dir: document.documentElement.getAttribute('dir') || 'ltr',
            lang: document.documentElement.getAttribute('lang') || '',
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            viewport: { width: window.innerWidth, height: window.innerHeight },
            rail: box(rail),
            frame: frame
                ? {
                      ...box(frame),
                      archetype: frame.getAttribute('data-archetype'),
                      scrollOwner: frame.getAttribute('data-scroll-owner'),
                      shellScroll: frame.getAttribute('data-shell-scroll'),
                  }
                : null,
            workspace: workspace
                ? {
                      ...box(workspace),
                      crm: workspace.getAttribute('data-crm'),
                  }
                : null,
            header: headerBox,
            bands,
            gaps,
            firstUseful: usefulBox
                ? {
                      ...usefulBox,
                      tag: firstUseful.tagName,
                      testId: firstUseful.getAttribute('data-testid'),
                      text: textOf(firstUseful),
                  }
                : null,
            contentStartY: usefulBox?.y ?? null,
            columnHeader: columnHeaderBox
                ? { ...columnHeaderBox, text: textOf(columnHeader) }
                : null,
            tableHead: box(tableHead),
            pipeline: pipeline ? { ...box(pipeline), overflowX: getComputedStyle(pipeline).overflowX } : null,
            documentScroll: {
                scrollHeight: document.documentElement.scrollHeight,
                clientHeight: document.documentElement.clientHeight,
                windowScrolls: document.documentElement.scrollHeight > window.innerHeight + 2,
            },
            nestedScrollers: scrollers.slice(0, 12).map((el) => ({
                tag: el.tagName,
                testId: el.getAttribute('data-testid'),
                crm: el.getAttribute('data-crm'),
                className: String(el.className).slice(0, 90),
                clientHeight: el.clientHeight,
                scrollHeight: el.scrollHeight,
            })),
            primaryActionCount: orangePrimaries.length,
            primaryActionLabels: orangePrimaries
                .map((el) => (el.innerText || el.getAttribute('aria-label') || '').trim())
                .filter(Boolean),
            titleText: textOf(document.querySelector('[data-workspace-slot="c"]')),
            countText: textOf(document.querySelector('[data-workspace-slot="d"]')),
        };
    }, kind);
}

async function captureOne(page, route, viewport, lang, theme, bucketRef) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const errors = [];
    bucketRef.current = errors;
    await applyTheme(page, theme);
    const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
    });
    await applyTheme(page, theme);
    await settle(page);

    const file = `${route.id}__${viewport.id}__${lang}__${theme}.png`;
    await page.screenshot({ path: join(SCREENSHOT_DIR, file), fullPage: false });
    const metrics = await measureBands(page, route.kind);
    bucketRef.current = null;

    return {
        file,
        route: route.id,
        path: route.path,
        viewport: viewport.id,
        lang,
        theme,
        status: response?.status() ?? null,
        url: page.url(),
        console: errors,
        metrics,
    };
}

async function main() {
    setSimpleMode(false);
    setUserLocale('fr');
    const facts = seedFacts();

    const browser = await chromium.launch({
        headless: true,
        args: ['--font-render-hinting=none'],
    });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        locale: 'fr-FR',
        colorScheme: 'light',
    });
    const page = await context.newPage();
    const bucketRef = { current: null };
    attachConsole(page, bucketRef);
    await login(page);

    const captures = [];

    for (const viewport of VIEWPORTS) {
        for (const route of ROUTES) {
            captures.push(await captureOne(page, route, viewport, 'fr', 'light', bucketRef));
        }
    }

    setUserLocale('en');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await settle(page);
    for (const route of ROUTES) {
        captures.push(await captureOne(page, route, VIEWPORTS[0], 'en', 'light', bucketRef));
    }

    setUserLocale('ar');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await settle(page);
    for (const route of ROUTES) {
        captures.push(await captureOne(page, route, VIEWPORTS[0], 'ar', 'light', bucketRef));
    }

    setUserLocale('fr');
    await applyTheme(page, 'dark');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await settle(page);
    for (const route of ROUTES) {
        captures.push(await captureOne(page, route, VIEWPORTS[0], 'fr', 'dark', bucketRef));
    }

    setUserLocale('fr');
    await applyTheme(page, 'light');

    writeFileSync(
        join(OUTPUT_DIR, 'metrics.json'),
        JSON.stringify({ facts, capturedAt: new Date().toISOString(), captures }, null, 2),
    );
    writeFileSync(
        join(OUTPUT_DIR, 'console-errors.json'),
        JSON.stringify(
            Object.fromEntries(captures.map((c) => [`${c.route}__${c.viewport}__${c.lang}__${c.theme}`, c.console])),
            null,
            2,
        ),
    );
    writeFileSync(
        join(OUTPUT_DIR, 'manifest.json'),
        JSON.stringify(
            {
                output: OUTPUT_DIR,
                email: EMAIL,
                baseUrl: BASE_URL,
                files: captures.map((c) => c.file),
            },
            null,
            2,
        ),
    );

    await browser.close();
    console.log(`Wrote ${captures.length} shots to ${OUTPUT_DIR}`);
    for (const cap of captures) {
        const y = cap.metrics?.contentStartY;
        console.log(
            `${cap.file}  status=${cap.status}  firstUsefulY=${y ?? 'n/a'}  bands=${cap.metrics?.bands?.length ?? 0}  console=${cap.console.length}`,
        );
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
