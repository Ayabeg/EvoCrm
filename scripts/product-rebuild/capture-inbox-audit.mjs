#!/usr/bin/env node
/**
 * WAVE 2 inbox composition BEFORE capture.
 * Audit-only. Does not send messages or mutate product code.
 *
 * Usage:
 *   node scripts/product-rebuild/capture-inbox-audit.mjs
 *   --out artifacts/product-rebuild/02-wave/before/inbox
 */
import { execFileSync } from 'node:child_process';
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

const args = parseArgs(process.argv.slice(2));
const OUTPUT_DIR = resolve(
    process.cwd(),
    args.out ||
        process.env.OUTPUT_DIR ||
        'artifacts/product-rebuild/02-wave/before/inbox',
);
const BASE_URL = (args['base-url'] || process.env.BASE_URL || 'http://127.0.0.1:8000').replace(
    /\/$/,
    '',
);
const EMAIL = args.email || process.env.EVOCRM_EMAIL || 'owner@evosales.local';
const PASSWORD = args.password || process.env.EVOCRM_PASSWORD || 'password';

const SCREENSHOT_DIR = OUTPUT_DIR;
const METRICS_PATH = join(OUTPUT_DIR, 'metrics.json');
const CONSOLE_PATH = join(OUTPUT_DIR, 'console-errors.json');
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json');

mkdirSync(SCREENSHOT_DIR, { recursive: true });

function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
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
        $workspace = $user->workspace;
        $workspace?->forceFill(['inbox_url' => null])->save();
        echo json_encode([
            'workspace' => $workspace?->name,
            'simple_mode' => (bool) $workspace?->simple_mode,
            'inbox_url' => $workspace?->fresh()->inbox_url,
            'thread' => App\\Models\\Thread::query()->where('workspace_id', $wid)->orderBy('id')->value('id'),
            'threads' => App\\Models\\Thread::query()->where('workspace_id', $wid)->count(),
        ], JSON_UNESCAPED_UNICODE);
    `);
    const jsonStart = raw.indexOf('{');
    return JSON.parse(raw.slice(jsonStart));
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
    await page.waitForTimeout(600);
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
}

function shotName(state, viewportId, lang, theme) {
    return `${state}__${viewportId}__${lang}__${theme}.png`;
}

async function measureInbox(page) {
    return page.evaluate(() => {
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

        const pick = (sel) => document.querySelector(sel);
        const rail =
            pick('.evo-rail-slot') ||
            pick('[data-slot="sidebar"]') ||
            pick('[data-sidebar="sidebar"]');
        const roomNav = pick('[data-chrome="contextual"] nav');
        const header = pick('[data-workspace="header"]');
        const folders = pick('[data-inbox-pane="nav"]') || pick('[data-inbox="queue-nav"]');
        const list = pick('[data-inbox-pane="list"]');
        const conversation = pick('[data-inbox-pane="conversation"]');
        const thread = pick('[data-inbox="thread"]');
        const composer = pick('[data-inbox="composer"]');
        const context =
            pick('[data-inbox-pane="context"]') || pick('[data-inbox="context-host"]');
        const caughtUp = [...document.querySelectorAll('p, h2')].find((el) =>
            /Vous êtes à jour|You're all caught up|أنت محدّث/.test(el.textContent || ''),
        );
        const rows = document.querySelectorAll('[data-inbox="conversation-row"]');
        const pageScroll =
            document.scrollingElement?.scrollHeight > window.innerHeight + 2;
        const frame = pick('[data-workspace-frame]');
        const panes = pick('[data-inbox="panes"]');

        const scrollers = [...document.querySelectorAll('*')].filter((el) => {
            const style = getComputedStyle(el);
            const oy = style.overflowY;
            if (oy !== 'auto' && oy !== 'scroll') {
                return false;
            }
            return el.scrollHeight > el.clientHeight + 4 && el.clientHeight > 24;
        });

        return {
            viewport: { width: window.innerWidth, height: window.innerHeight },
            dir: document.documentElement.getAttribute('dir') || 'ltr',
            lang: document.documentElement.getAttribute('lang') || '',
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            url: location.pathname + location.search,
            inboxUrlCleared: !document.querySelector('[data-inbox="embed"]'),
            native: Boolean(pick('[data-inbox="native"]')),
            banner: Boolean(pick('[data-crm="inbox-embed-banner"]')),
            rail: rect(rail),
            roomNav: rect(roomNav),
            header: rect(header),
            folders: rect(folders),
            list: rect(list),
            conversation: rect(conversation),
            thread: rect(thread),
            composer: rect(composer),
            context: rect(context),
            contextVisible: Boolean(context && context.getBoundingClientRect().width > 8),
            threadCount: rows.length,
            caughtUpVisible: Boolean(caughtUp),
            caughtUpText: caughtUp ? (caughtUp.textContent || '').trim().slice(0, 120) : null,
            pageScroll,
            frameScroll: frame
                ? {
                      overflowY: getComputedStyle(frame).overflowY,
                      scrollOwner: frame.getAttribute('data-scroll-owner'),
                      shellScroll: frame.getAttribute('data-shell-scroll'),
                      archetype: frame.getAttribute('data-archetype'),
                  }
                : null,
            panes: rect(panes),
            nestedScrollers: scrollers.slice(0, 10).map((el) => ({
                tag: el.tagName,
                inbox: el.getAttribute('data-inbox') || el.getAttribute('data-inbox-pane'),
                className: String(el.className).slice(0, 90),
                width: Math.round(el.getBoundingClientRect().width),
                height: Math.round(el.clientHeight),
                scrollHeight: el.scrollHeight,
            })),
            tabLabels: [...document.querySelectorAll('[role="tab"]')]
                .map((el) => (el.textContent || '').trim())
                .filter(Boolean),
        };
    });
}

async function gotoInbox(page, path) {
    const response = await page.goto(`${BASE_URL}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
    });
    await settle(page);
    return response;
}

async function ensureConversationPane(page, viewport) {
    if (viewport.width >= 1024) {
        return;
    }
    const conversationTab = page
        .locator('[role="tab"]')
        .filter({ hasText: /Conversation|محادثة/i })
        .first();
    if (await conversationTab.isVisible().catch(() => false)) {
        await conversationTab.click();
        await settle(page);
    }
}

async function ensureListPane(page, viewport) {
    if (viewport.width >= 1024) {
        return;
    }
    const inboxTab = page
        .locator('[role="tab"]')
        .filter({ hasText: /Inbox|Boîte|صندوق/i })
        .first();
    if (await inboxTab.isVisible().catch(() => false)) {
        await inboxTab.click();
        await settle(page);
    }
}

async function captureState(page, state, path, viewport, lang, theme, bucketRef, after) {
    const errors = [];
    bucketRef.current = errors;
    await applyTheme(page, theme);
    const response = await gotoInbox(page, path);
    await applyTheme(page, theme);
    await settle(page);
    if (after) {
        await after(page, viewport);
        await settle(page);
    }
    const file = shotName(state, viewport.id, lang, theme);
    await page.screenshot({ path: join(SCREENSHOT_DIR, file), fullPage: false });
    let metrics = null;
    try {
        metrics = await measureInbox(page);
    } catch (error) {
        metrics = { error: String(error) };
    }
    bucketRef.current = null;
    return {
        file,
        state,
        path,
        viewport: viewport.id,
        lang,
        theme,
        status: response?.status() ?? null,
        url: page.url(),
        console: errors,
        metrics,
    };
}

async function runVariant(browser, ids, lang, theme, viewports) {
    const context = await browser.newContext({
        locale: lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr-FR' : 'en-US',
        colorScheme: theme,
    });
    const page = await context.newPage();
    const bucketRef = { current: null };
    attachConsole(page, bucketRef);
    await login(page);

    const thread = ids.thread;
    const captures = [];

    for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        captures.push(
            await captureState(
                page,
                'list',
                '/inbox',
                viewport,
                lang,
                theme,
                bucketRef,
                async (p) => ensureListPane(p, viewport),
            ),
        );

        captures.push(
            await captureState(
                page,
                'selected',
                `/inbox?thread=${thread}`,
                viewport,
                lang,
                theme,
                bucketRef,
                async (p) => ensureConversationPane(p, viewport),
            ),
        );

        captures.push(
            await captureState(
                page,
                'composer',
                `/inbox?thread=${thread}`,
                viewport,
                lang,
                theme,
                bucketRef,
                async (p) => {
                    await ensureConversationPane(p, viewport);
                    const reply = p
                        .locator('[data-inbox="composer"] button[aria-pressed]')
                        .first();
                    if (await reply.isVisible().catch(() => false)) {
                        await reply.click().catch(() => {});
                    }
                    await p.locator('[data-inbox="composer"] textarea').click().catch(() => {});
                },
            ),
        );

        captures.push(
            await captureState(
                page,
                'internal-note',
                `/inbox?thread=${thread}`,
                viewport,
                lang,
                theme,
                bucketRef,
                async (p) => {
                    await ensureConversationPane(p, viewport);
                    const note = p
                        .locator('[data-inbox="composer"] button')
                        .filter({ hasText: /Note|ملاحظة|Note interne/i })
                        .first();
                    if (await note.isVisible().catch(() => false)) {
                        await note.click();
                    }
                },
            ),
        );

        captures.push(
            await captureState(
                page,
                'context-open',
                `/inbox?thread=${thread}`,
                viewport,
                lang,
                theme,
                bucketRef,
                async (p) => {
                    await ensureConversationPane(p, viewport);
                    const toggle = p
                        .locator('button')
                        .filter({ hasText: /Context|Contexte|سياق|Hide|Masquer|إخفاء/i })
                        .first();
                    if (await toggle.isVisible().catch(() => false)) {
                        const label = ((await toggle.textContent()) || '').toLowerCase();
                        if (!/hide|masquer|إخفاء/.test(label) && viewport.width < 1280) {
                            await toggle.click();
                        }
                    }
                },
            ),
        );

        captures.push(
            await captureState(
                page,
                'context-closed',
                `/inbox?thread=${thread}&context=0`,
                viewport,
                lang,
                theme,
                bucketRef,
                async (p) => ensureConversationPane(p, viewport),
            ),
        );
    }

    await context.close();
    return captures;
}

async function main() {
    const ids = loadSeededIds();
    if (ids.error || !ids.thread) {
        console.error('capture-inbox-audit: missing seeded user or thread', ids);
        process.exit(1);
    }

    setSimpleMode(false);
    console.log('seed', ids);

    const browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
    });

    const captures = [];

    setUserLocale('fr');
    captures.push(...(await runVariant(browser, ids, 'fr', 'light', VIEWPORTS)));

    setUserLocale('en');
    captures.push(
        ...(await runVariant(
            browser,
            ids,
            'en',
            'light',
            VIEWPORTS.filter((v) => v.id === '1440x1000'),
        )),
    );

    setUserLocale('ar');
    captures.push(
        ...(await runVariant(
            browser,
            ids,
            'ar',
            'light',
            VIEWPORTS.filter((v) => v.id === '1440x1000'),
        )),
    );

    setUserLocale('fr');
    captures.push(
        ...(await runVariant(
            browser,
            ids,
            'fr',
            'dark',
            VIEWPORTS.filter((v) => v.id === '1440x1000'),
        )),
    );

    setUserLocale('fr');
    await browser.close();

    const columns1440 = captures.find(
        (c) =>
            c.state === 'context-open' &&
            c.viewport === '1440x1000' &&
            c.lang === 'fr' &&
            c.theme === 'light',
    )?.metrics;

    writeFileSync(
        METRICS_PATH,
        JSON.stringify(
            {
                capturedAt: new Date().toISOString(),
                seed: ids,
                columns1440,
                captures: captures.map((c) => ({
                    file: c.file,
                    state: c.state,
                    viewport: c.viewport,
                    lang: c.lang,
                    theme: c.theme,
                    status: c.status,
                    metrics: c.metrics,
                })),
            },
            null,
            2,
        ),
    );
    writeFileSync(
        CONSOLE_PATH,
        JSON.stringify(
            captures.map((c) => ({ file: c.file, console: c.console })),
            null,
            2,
        ),
    );
    writeFileSync(
        MANIFEST_PATH,
        JSON.stringify(
            {
                output: OUTPUT_DIR,
                count: captures.length,
                files: captures.map((c) => c.file),
            },
            null,
            2,
        ),
    );

    console.log(`wrote ${captures.length} shots to ${OUTPUT_DIR}`);
    if (columns1440) {
        console.log('1440 columns', {
            rail: columns1440.rail,
            folders: columns1440.folders,
            list: columns1440.list,
            conversation: columns1440.conversation,
            thread: columns1440.thread,
            composer: columns1440.composer,
            context: columns1440.context,
            caughtUpVisible: columns1440.caughtUpVisible,
            threadCount: columns1440.threadCount,
        });
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
