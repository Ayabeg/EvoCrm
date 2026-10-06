#!/usr/bin/env node
/**
 * EvoCRM product-rebuild visual capture.
 *
 * Reusable Wave 0 / later-wave script. Same route × viewport matrix every time.
 * Parameterize the output folder so AFTER sheets land next to BEFORE ones.
 *
 * Usage:
 *   node scripts/product-rebuild/capture.mjs --out artifacts/product-rebuild/00-baseline
 *   OUTPUT_DIR=artifacts/product-rebuild/01-after node scripts/product-rebuild/capture.mjs
 *
 * Env / flags:
 *   --out, --output, -o, OUTPUT_DIR   output root (required unless env set)
 *   --base-url, BASE_URL              default http://127.0.0.1:8000
 *   --email, EVOCRM_EMAIL             seeded owner (default owner@evosales.local)
 *   --password, EVOCRM_PASSWORD       default password
 *   --skip-sheet                      skip contact-sheet composition
 *   --only contacts,dashboard         optional route-id subset
 *
 * Does not modify product code or seed extra records. Record IDs come from
 * the already-seeded workspace (artisan read, then Inertia page fallback).
 */

import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');

const VIEWPORTS = [
    { id: '1440x1000', width: 1440, height: 1000 },
    { id: '1280x900', width: 1280, height: 900 },
    { id: '1024x768', width: 1024, height: 768 },
    { id: '768x1024', width: 768, height: 1024 },
    { id: '430x932', width: 430, height: 932 },
    { id: '390x844', width: 390, height: 844 },
];

const LOCALE_VARIANTS = ['fr', 'en', 'ar'];
const VARIANT_ROUTES = ['contacts', 'deal-record', 'inbox', 'dashboard'];

const args = parseArgs(process.argv.slice(2));
const OUTPUT_DIR = resolve(
    process.cwd(),
    args.out || process.env.OUTPUT_DIR || '',
);
const BASE_URL = (args['base-url'] || process.env.BASE_URL || 'http://127.0.0.1:8000').replace(
    /\/$/,
    '',
);
const EMAIL = args.email || process.env.EVOCRM_EMAIL || 'owner@evosales.local';
const PASSWORD = args.password || process.env.EVOCRM_PASSWORD || 'password';
const ONLY = new Set(
    String(args.only || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
);

if (!args.out && !process.env.OUTPUT_DIR) {
    console.error('capture.mjs: pass --out <dir> or set OUTPUT_DIR');
    process.exit(1);
}

const SCREENSHOT_DIR = join(OUTPUT_DIR, 'screenshots');
const METRICS_PATH = join(OUTPUT_DIR, 'metrics.json');
const CONSOLE_PATH = join(OUTPUT_DIR, 'console-errors.json');
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json');

mkdirSync(SCREENSHOT_DIR, { recursive: true });

const FR_MARKERS = [
    'Accueil',
    'Affaires',
    'Sociétés',
    'Devis',
    'Paramètres',
    'Créer',
    'Rechercher',
    'Nouveau',
    'Colonnes',
    'Filtrer',
    'Tableau',
    'Liste',
    'Prospects',
    'Boîte de réception',
];
const EN_MARKERS = [
    'Dashboard',
    'Deals',
    'Companies',
    'Quotes',
    'Settings',
    'Create',
    'Search',
    'Board options',
    'Columns',
    'Filter',
    'Inbox',
    'Leads',
    'Contacts',
    'Hello',
    'New deal',
    'Add view',
];

function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (token === '--skip-sheet') {
            out['skip-sheet'] = true;
            continue;
        }
        if (!token.startsWith('--') && token !== '-o') {
            continue;
        }
        const key = token === '-o' ? 'out' : token.slice(2);
        const next = argv[i + 1];
        if (!next || next.startsWith('-')) {
            out[key] = true;
            continue;
        }
        out[key] = next;
        i += 1;
    }
    return out;
}

function phpEval(code) {
    return execFileSync('php', ['artisan', 'tinker', `--execute=${code}`], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
    }).trim();
}

function loadSeededIds() {
    const raw = phpEval(`
        $user = App\\Models\\User::query()->where('email', '${EMAIL}')->first();
        if (!$user) { echo json_encode(['error' => 'missing user']); return; }
        $wid = $user->workspace_id;
        echo json_encode([
            'workspace' => $user->workspace?->name,
            'simple_mode' => (bool) $user->workspace?->simple_mode,
            'inbox_url' => $user->workspace?->inbox_url,
            'contact' => App\\Models\\Contact::query()->where('workspace_id', $wid)->orderBy('id')->value('id'),
            'company' => App\\Models\\Company::query()->where('workspace_id', $wid)->orderBy('id')->value('id'),
            'lead' => App\\Models\\Lead::query()->where('workspace_id', $wid)->orderBy('id')->value('id'),
            'deal' => App\\Models\\Deal::query()->where('workspace_id', $wid)->orderBy('id')->value('id'),
            'quote' => App\\Models\\Quote::query()->where('workspace_id', $wid)->orderBy('id')->value('id'),
            'thread' => App\\Models\\Thread::query()->where('workspace_id', $wid)->orderBy('id')->value('id'),
            'counts' => [
                'contacts' => App\\Models\\Contact::query()->where('workspace_id', $wid)->count(),
                'companies' => App\\Models\\Company::query()->where('workspace_id', $wid)->count(),
                'leads' => App\\Models\\Lead::query()->where('workspace_id', $wid)->count(),
                'deals' => App\\Models\\Deal::query()->where('workspace_id', $wid)->count(),
                'quotes' => App\\Models\\Quote::query()->where('workspace_id', $wid)->count(),
                'threads' => App\\Models\\Thread::query()->where('workspace_id', $wid)->count(),
            ],
        ], JSON_UNESCAPED_UNICODE);
    `);
    const jsonStart = raw.indexOf('{');
    return JSON.parse(raw.slice(jsonStart));
}

function setSimpleMode(on) {
    phpEval(`
        $user = App\\Models\\User::query()->where('email', '${EMAIL}')->first();
        $user->workspace->forceFill(['simple_mode' => ${on ? 'true' : 'false'}])->save();
        echo $user->workspace->fresh()->simple_mode ? '1' : '0';
    `);
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

function routeDefs(ids) {
    return [
        { id: 'dashboard', path: '/dashboard', useful: 'dashboard' },
        { id: 'contacts', path: '/crm/contacts', useful: 'list' },
        { id: 'companies', path: '/crm/companies', useful: 'list' },
        { id: 'leads', path: '/crm/leads', useful: 'list' },
        { id: 'deals-list', path: '/crm/deals', useful: 'list' },
        { id: 'deals-board', path: '/crm/deals/board', useful: 'board' },
        {
            id: 'contact-record',
            path: ids.contact ? `/crm/contacts/${ids.contact}` : null,
            useful: 'record',
        },
        {
            id: 'company-record',
            path: ids.company ? `/crm/companies/${ids.company}` : null,
            useful: 'record',
        },
        {
            id: 'lead-record',
            path: ids.lead ? `/crm/leads/${ids.lead}` : null,
            useful: 'record',
        },
        {
            id: 'deal-record',
            path: ids.deal ? `/crm/deals/${ids.deal}` : null,
            useful: 'record',
        },
        { id: 'inbox', path: '/inbox', useful: 'inbox' },
        {
            id: 'inbox-thread',
            path: ids.thread ? `/inbox?thread=${ids.thread}` : null,
            useful: 'inbox-thread',
        },
        { id: 'quotes', path: '/crm/quotes', useful: 'list' },
        {
            id: 'quote-detail',
            path: ids.quote ? `/crm/quotes/${ids.quote}` : null,
            useful: 'record',
        },
        { id: 'settings', path: '/settings', useful: 'settings' },
    ];
}

function shotName(routeId, viewportId, lang, theme) {
    return `${routeId}__${viewportId}__${lang}__${theme}.png`;
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
    await page.addStyleTag({
        content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
    }).catch(() => {});
    await page.waitForTimeout(700);
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

async function measure(page, routeId, useful) {
    return page.evaluate(
        ({ routeId: id, useful: kind, frMarkers, enMarkers }) => {
            const rect = (el) => {
                if (!el) {
                    return null;
                }
                const r = el.getBoundingClientRect();
                return {
                    x: Math.round(r.x),
                    y: Math.round(r.y),
                    width: Math.round(r.width),
                    height: Math.round(r.height),
                };
            };

            const topbar = document.querySelector('.app-topbar');
            const sidebar =
                document.querySelector('[data-slot="sidebar"]') ||
                document.querySelector('[data-sidebar]');
            const inset = document.querySelector('[data-slot="sidebar-inset"]');

            const usefulSelectors = {
                list: [
                    'table tbody tr',
                    '[role="rowgroup"] [role="row"]',
                    '[data-slot="table-row"]',
                    '[data-crm$="-workspace"] tbody tr',
                ],
                board: [
                    '[data-testid^="deal-card-"]',
                    '[data-crm="deals-board"] a[href^="/crm/deals/"]',
                    '[data-pipeline-card]',
                ],
                record: [
                    '[data-crm$="-record"] h1',
                    '[data-crm="object-header"]',
                    '[data-crm$="-record"]',
                ],
                inbox: [
                    '[data-inbox="list"] a',
                    '[data-inbox="list"] button',
                    '[data-inbox-pane="list"] [data-inbox-thread]',
                    '[data-crm="inbox-workspace"] [data-inbox]',
                ],
                'inbox-thread': [
                    '[data-inbox="thread"]',
                    '[data-inbox-pane="conversation"]',
                    '[data-inbox-thread]',
                ],
                dashboard: [
                    '[data-home] [data-kpi]',
                    '[data-kpi]',
                    'h1',
                    '.aurora-page-shell h1',
                    '.aurora-page-shell h2',
                ],
                settings: [
                    '[data-settings] form',
                    'form',
                    'h1',
                ],
            };

            const pickFirst = (selectors) => {
                for (const sel of selectors) {
                    const found = [...document.querySelectorAll(sel)].find((el) => {
                        const r = el.getBoundingClientRect();
                        return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < window.innerHeight + 40;
                    });
                    if (found) {
                        return found;
                    }
                }
                return null;
            };

            const usefulEl = pickFirst(usefulSelectors[kind] || usefulSelectors.list);
            const usefulRect = rect(usefulEl);

            const primaryButtons = [...document.querySelectorAll('button, a, [role="button"]')].filter(
                (el) => {
                    const style = getComputedStyle(el);
                    const bg = style.backgroundColor;
                    const r = el.getBoundingClientRect();
                    if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > window.innerHeight) {
                        return false;
                    }
                    const orange =
                        bg.includes('232, 83, 14') ||
                        bg.includes('232,83,14') ||
                        el.className.toString().includes('evo-create-btn') ||
                        el.className.toString().includes('bg-brand');
                    return orange;
                },
            );

            const scrollers = [...document.querySelectorAll('*')].filter((el) => {
                const style = getComputedStyle(el);
                const oy = style.overflowY;
                if (oy !== 'auto' && oy !== 'scroll') {
                    return false;
                }
                return el.scrollHeight > el.clientHeight + 4 && el.clientHeight > 24;
            });

            const overflowX = document.documentElement.scrollWidth > window.innerWidth + 2;
            const overflowY = document.documentElement.scrollHeight > window.innerHeight + 2;
            const overflowingChildren = [...document.querySelectorAll('body *')].filter((el) => {
                const r = el.getBoundingClientRect();
                return r.right > window.innerWidth + 4 && r.width > 40 && r.top < window.innerHeight;
            }).length;

            const chromeRoot = inset || document.querySelector('.aurora-page-shell') || document.body;
            const firstUsefulY = usefulRect?.y ?? window.innerHeight;
            const bands = [];
            for (const el of chromeRoot.querySelectorAll('div, header, nav, section')) {
                const r = el.getBoundingClientRect();
                if (
                    r.top >= -4 &&
                    r.bottom <= firstUsefulY + 8 &&
                    r.height >= 28 &&
                    r.height <= 88 &&
                    r.width > chromeRoot.clientWidth * 0.55
                ) {
                    bands.push({ y: Math.round(r.y), height: Math.round(r.height) });
                }
            }
            const clustered = [];
            for (const band of bands.sort((a, b) => a.y - b.y)) {
                const last = clustered[clustered.length - 1];
                if (!last || Math.abs(last.y - band.y) > 10) {
                    clustered.push(band);
                }
            }

            const visibleText = [...document.querySelectorAll('a, button, h1, h2, nav, [data-slot="sidebar"], .app-topbar, [data-crm="object-header"]')]
                .map((el) => (el.innerText || '').trim())
                .filter(Boolean)
                .join(' \n ');

            const foundFr = frMarkers.filter((m) => visibleText.includes(m));
            const foundEn = enMarkers.filter((m) => visibleText.includes(m));

            return {
                route: id,
                viewport: { width: window.innerWidth, height: window.innerHeight },
                dir: document.documentElement.getAttribute('dir') || 'ltr',
                lang: document.documentElement.getAttribute('lang') || '',
                theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
                topBar: rect(topbar),
                sidebar: rect(sidebar),
                inset: rect(inset),
                firstUseful: usefulRect
                    ? { ...usefulRect, selectorHint: usefulEl?.tagName, text: (usefulEl?.innerText || '').slice(0, 80) }
                    : null,
                contentStartY: usefulRect?.y ?? null,
                primaryActionCount: primaryButtons.length,
                primaryActionLabels: primaryButtons.map((el) => (el.innerText || el.getAttribute('aria-label') || '').trim()).filter(Boolean),
                toolbarRowCount: clustered.length,
                toolbarBands: clustered,
                nestedScrollCount: scrollers.length,
                nestedScrollers: scrollers.slice(0, 8).map((el) => ({
                    tag: el.tagName,
                    className: String(el.className).slice(0, 80),
                    scrollHeight: el.scrollHeight,
                    clientHeight: el.clientHeight,
                })),
                overflow: {
                    documentX: overflowX,
                    documentY: overflowY,
                    overflowingChildCount: overflowingChildren,
                },
                language: {
                    frenchMarkers: foundFr,
                    englishMarkers: foundEn,
                    mixed: foundFr.length > 0 && foundEn.length > 0,
                },
            };
        },
        { routeId, useful, frMarkers: FR_MARKERS, enMarkers: EN_MARKERS },
    );
}

async function captureOne(page, route, viewport, lang, theme, bucketRef) {
    if (!route.path) {
        return {
            skipped: true,
            reason: 'no seeded record for this route',
            route: route.id,
            viewport: viewport.id,
            lang,
            theme,
        };
    }

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

    const file = shotName(route.id, viewport.id, lang, theme);
    const dest = join(SCREENSHOT_DIR, file);
    await page.screenshot({ path: dest, fullPage: false });

    let metrics = null;
    try {
        metrics = await measure(page, route.id, route.useful);
    } catch (error) {
        metrics = { error: String(error) };
    }

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

function sheetHtml(cells, title) {
    const figures = cells
        .map(
            (cell) => `
      <figure>
        <img src="${cell.src}" alt="${cell.label}" />
        <figcaption>${cell.label}</figcaption>
      </figure>`,
        )
        .join('');
    return `<!doctype html>
<html><head><meta charset="utf-8" />
<title>${title}</title>
<style>
  html, body { margin: 0; background: #11120f; color: #f4f1ea; font: 13px/1.35 ui-sans-serif, system-ui, sans-serif; }
  h1 { font-size: 18px; font-weight: 600; margin: 0; padding: 16px 16px 8px; }
  p { margin: 0; padding: 0 16px 12px; color: #b9b4a8; }
  .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; padding: 12px 16px 20px; }
  .grid.mobile { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  figure { margin: 0; background: #1a1b18; border: 1px solid #2c2d28; padding: 6px; }
  img { display: block; width: 100%; height: auto; background: #000; }
  figcaption { margin-top: 6px; font-size: 11px; letter-spacing: 0.01em; color: #ece7db; }
</style></head>
<body>
  <h1>${title}</h1>
  <p>Local seed capture · ${BASE_URL} · ${EMAIL} · Full Mode unless noted</p>
  <div class="grid">${figures}</div>
</body></html>`;
}

async function composeSheets(browser, captures) {
    const byKey = new Map(captures.filter((c) => c.file).map((c) => [`${c.route}__${c.viewport}__${c.lang}__${c.theme}`, c]));
    const keyRoutes1440 = [
        'dashboard',
        'contacts',
        'companies',
        'leads',
        'deals-list',
        'deals-board',
        'inbox',
        'quotes',
        'settings',
    ];
    const recordRoutes1440 = [
        'contact-record',
        'company-record',
        'lead-record',
        'deal-record',
        'inbox-thread',
        'quote-detail',
    ];
    const mobileRow = [
        'dashboard',
        'contacts',
        'deals-board',
        'inbox',
        'deal-record',
    ];

    const cell = (route, viewport, lang, theme) => {
        const cap = byKey.get(`${route}__${viewport}__${lang}__${theme}`);
        if (!cap) {
            return null;
        }
        return {
            src: `screenshots/${cap.file}`,
            label: `${route} · ${viewport} · ${lang} · ${theme}`,
        };
    };

    const sheet1 = keyRoutes1440.map((r) => cell(r, '1440x1000', 'fr', 'light')).filter(Boolean);
    const sheet2 = [
        ...recordRoutes1440.map((r) => cell(r, '1440x1000', 'fr', 'light')).filter(Boolean),
    ];
    const mobile = mobileRow.map((r) => cell(r, '390x844', 'fr', 'light')).filter(Boolean);

    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const writeAndShot = async (name, html, extraMobile = []) => {
        const htmlPath = join(OUTPUT_DIR, `${name}.html`);
        const body =
            extraMobile.length > 0
                ? html.replace(
                      '</body>',
                      `<h1>Mobile 390×844</h1><div class="grid mobile">${extraMobile
                          .map(
                              (c) => `<figure><img src="${c.src}" alt="${c.label}" /><figcaption>${c.label}</figcaption></figure>`,
                          )
                          .join('')}</div></body>`,
                  )
                : html;
        writeFileSync(htmlPath, body);
        await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
        await page.screenshot({
            path: join(OUTPUT_DIR, `${name}.png`),
            fullPage: true,
        });
    };

    await writeAndShot(
        'BEFORE-CONTACT-SHEET',
        sheetHtml(sheet1, 'W0 BEFORE · 1440 workspace routes'),
        mobile,
    );
    await writeAndShot(
        'BEFORE-CONTACT-SHEET-2',
        sheetHtml(sheet2, 'W0 BEFORE · 1440 records + quote + open thread'),
    );
    await page.close();
}

async function main() {
    const ids = loadSeededIds();
    if (ids.error) {
        throw new Error(`Seeded user missing: ${ids.error}`);
    }

    setSimpleMode(false);
    setUserLocale('fr');

    const routes = routeDefs(ids).filter((r) => ONLY.size === 0 || ONLY.has(r.id));
    const browser = await chromium.launch({
        headless: true,
        args: ['--font-render-hinting=none'],
    });
    const context = await browser.newContext({
        locale: 'fr-DZ',
        colorScheme: 'light',
        reducedMotion: 'reduce',
    });
    await context.addCookies([
        { name: 'appearance', value: 'light', url: BASE_URL },
        { name: 'locale', value: 'fr', url: BASE_URL },
    ]);

    const page = await context.newPage();
    const bucketRef = { current: null };
    attachConsole(page, bucketRef);
    const captures = [];

    await login(page);
    await applyTheme(page, 'light');

    for (const viewport of VIEWPORTS) {
        for (const route of routes) {
            process.stdout.write(`capture ${route.id} ${viewport.id} fr light\n`);
            captures.push(await captureOne(page, route, viewport, 'fr', 'light', bucketRef));
        }
    }

    const desktop = VIEWPORTS[0];
    for (const lang of LOCALE_VARIANTS) {
        setUserLocale(lang);
        await context.addCookies([{ name: 'locale', value: lang, url: BASE_URL }]);
        for (const route of routes.filter((r) => VARIANT_ROUTES.includes(r.id))) {
            if (lang === 'fr') {
                continue;
            }
            process.stdout.write(`capture ${route.id} ${desktop.id} ${lang} light\n`);
            captures.push(await captureOne(page, route, desktop, lang, 'light', bucketRef));
        }
    }

    setUserLocale('fr');
    await context.addCookies([{ name: 'locale', value: 'fr', url: BASE_URL }]);
    await applyTheme(page, 'dark');
    for (const route of routes.filter((r) => VARIANT_ROUTES.includes(r.id))) {
        process.stdout.write(`capture ${route.id} ${desktop.id} fr dark\n`);
        captures.push(await captureOne(page, route, desktop, 'fr', 'dark', bucketRef));
    }

    await applyTheme(page, 'light');
    setSimpleMode(true);
    process.stdout.write('capture dashboard-simple 1440x1000 fr light\n');
    captures.push(
        await captureOne(
            page,
            { id: 'dashboard-simple', path: '/dashboard', useful: 'dashboard' },
            desktop,
            'fr',
            'light',
            bucketRef,
        ),
    );
    setSimpleMode(false);

    const consoleErrors = {};
    for (const cap of captures) {
        const key = `${cap.route}__${cap.viewport}__${cap.lang}__${cap.theme}`;
        consoleErrors[key] = (cap.console || []).filter(
            (e) => e.type === 'error' || e.type === 'pageerror' || e.type === 'requestfailed',
        );
    }

    writeFileSync(
        METRICS_PATH,
        JSON.stringify(
            {
                capturedAt: new Date().toISOString(),
                commit: execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim(),
                baseUrl: BASE_URL,
                email: EMAIL,
                seeded: ids,
                captures,
            },
            null,
            2,
        ),
    );
    writeFileSync(CONSOLE_PATH, JSON.stringify(consoleErrors, null, 2));
    writeFileSync(
        MANIFEST_PATH,
        JSON.stringify(
            {
                viewports: VIEWPORTS,
                routes: routes.map((r) => r.id),
                output: OUTPUT_DIR,
                files: captures.map((c) => c.file).filter(Boolean),
            },
            null,
            2,
        ),
    );

    if (!args['skip-sheet']) {
        await composeSheets(browser, captures);
    }

    await browser.close();

    const skipped = captures.filter((c) => c.skipped);
    process.stdout.write(
        `done ${captures.length - skipped.length} shots, ${skipped.length} skipped → ${OUTPUT_DIR}\n`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
