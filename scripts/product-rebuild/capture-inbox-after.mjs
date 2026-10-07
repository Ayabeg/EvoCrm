#!/usr/bin/env node
/**
 * WAVE 2 inbox composition AFTER capture.
 * Does not send messages or mutate product code beyond locale / inbox_url=null.
 *
 * Usage:
 *   node scripts/product-rebuild/capture-inbox-after.mjs
 *   --out artifacts/product-rebuild/02-wave/after/inbox
 */
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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

const ALL_STATES = [
    'list',
    'selected',
    'composer',
    'internal-note',
    'context-open',
    'context-closed',
];

const args = parseArgs(process.argv.slice(2));
const OUTPUT_DIR = resolve(
    process.cwd(),
    args.out ||
        process.env.OUTPUT_DIR ||
        'artifacts/product-rebuild/02-wave/after/inbox',
);
const BASE_URL = (args['base-url'] || process.env.BASE_URL || 'http://127.0.0.1:8000').replace(
    /\/$/,
    '',
);
const EMAIL = args.email || process.env.EVOCRM_EMAIL || 'owner@evosales.local';
const PASSWORD = args.password || process.env.EVOCRM_PASSWORD || 'password';

const SCREENSHOT_DIR = OUTPUT_DIR;
const METRICS_PATH = join(OUTPUT_DIR, 'metrics.json');
const COLUMNS_PATH = join(OUTPUT_DIR, 'column-metrics.json');
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
        const visible = (el) => {
            if (!el) {
                return false;
            }
            const r = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            return r.width > 8 && r.height > 8 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rect = (el) => {
            if (!visible(el)) {
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
        const pickVisible = (sel) =>
            [...document.querySelectorAll(sel)].find((el) => visible(el)) ?? null;

        const rail =
            pickVisible('.evo-rail-slot') ||
            pickVisible('[data-slot="sidebar"]') ||
            pickVisible('[data-sidebar="sidebar"]');
        const roomNav = pickVisible('[data-chrome="contextual"] nav');
        const header = pickVisible('[data-workspace="header"]');
        const folders =
            pickVisible('[data-inbox-pane="nav"]') || pickVisible('[data-inbox="queue-nav"]');
        const folderFlyout = pickVisible('[data-inbox="folder-flyout"]');
        const list = pickVisible('[data-inbox-pane="list"]');
        const conversation = pickVisible('[data-inbox-pane="conversation"]');
        const thread = pickVisible('[data-inbox="thread"]');
        const composer = pickVisible('[data-inbox="composer"]');
        const context =
            pickVisible('[data-inbox-pane="context"]') || pickVisible('[data-inbox="context-host"]');
        const back = pickVisible('[data-inbox="back"]');
        const caughtUp = [...document.querySelectorAll('p, h2')].find((el) =>
            /Vous êtes à jour|You're all caught up|أنت محدّث/.test(el.textContent || ''),
        );
        const pickCopy = [...document.querySelectorAll('p')].find((el) =>
            /Choisissez un fil|Pick a conversation|اختر محادثة من القائمة/.test(el.textContent || ''),
        );
        const rows = document.querySelectorAll('[data-inbox="conversation-row"]');
        const pageScroll =
            document.scrollingElement?.scrollHeight > window.innerHeight + 2;
        const frame = pickVisible('[data-workspace-frame]');
        const panes = pickVisible('[data-inbox="panes"]');
        const channelFilter = pickVisible('[data-inbox="channel-filter"]');

        const scrollers = [...document.querySelectorAll('*')].filter((el) => {
            const style = getComputedStyle(el);
            const oy = style.overflowY;
            if (oy !== 'auto' && oy !== 'scroll') {
                return false;
            }
            if (!visible(el)) {
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
            native: Boolean(pickVisible('[data-inbox="native"]')),
            banner: Boolean(pickVisible('[data-crm="inbox-embed-banner"]')),
            rail: rect(rail),
            roomNav: rect(roomNav),
            header: rect(header),
            folders: rect(folders),
            folderFlyout: rect(folderFlyout),
            list: rect(list),
            conversation: rect(conversation),
            thread: rect(thread),
            composer: rect(composer),
            context: rect(context),
            back: rect(back),
            channelFilter: rect(channelFilter),
            contextVisible: Boolean(context && context.getBoundingClientRect().width > 8),
            threadCount: rows.length,
            caughtUpVisible: Boolean(caughtUp && visible(caughtUp)),
            caughtUpText: caughtUp ? (caughtUp.textContent || '').trim().slice(0, 120) : null,
            pickConversationVisible: Boolean(pickCopy && visible(pickCopy)),
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
                .filter((el) => visible(el))
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
    const back = page.locator('[data-inbox="back"]').first();
    if (await back.isVisible().catch(() => false)) {
        await back.click();
        await settle(page);
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

function shouldCapture(state, viewport, lang, theme) {
    if (lang === 'fr' && theme === 'light') {
        return true;
    }
    if (ALL_STATES.includes(state) && ['1440x1000', '1280x900', '768x1024', '390x844'].includes(viewport.id)) {
        return true;
    }
    return ['list', 'selected', 'context-closed'].includes(state);
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

        const states = [
            ['list', '/inbox', async (p) => ensureListPane(p, viewport)],
            ['selected', `/inbox?thread=${thread}&context=0`, async (p) => ensureConversationPane(p, viewport)],
            [
                'composer',
                `/inbox?thread=${thread}&context=0`,
                async (p) => {
                    await ensureConversationPane(p, viewport);
                    const reply = p.locator('[data-inbox="composer"] button[aria-pressed]').first();
                    if (await reply.isVisible().catch(() => false)) {
                        await reply.click().catch(() => {});
                    }
                    await p.locator('[data-inbox="composer"] textarea').click().catch(() => {});
                },
            ],
            [
                'internal-note',
                `/inbox?thread=${thread}&context=0`,
                async (p) => {
                    await ensureConversationPane(p, viewport);
                    const note = p
                        .locator('[data-inbox="composer"] button')
                        .filter({ hasText: /Note|ملاحظة|interne|داخلية/i })
                        .first();
                    if (await note.isVisible().catch(() => false)) {
                        await note.click();
                    }
                },
            ],
            [
                'context-open',
                `/inbox?thread=${thread}`,
                async (p) => {
                    await ensureConversationPane(p, viewport);
                    const toggle = p
                        .locator('button')
                        .filter({ hasText: /Context|Contexte|سياق|Hide|Masquer|إخفاء/i })
                        .first();
                    if (await toggle.isVisible().catch(() => false)) {
                        const label = ((await toggle.textContent()) || '').toLowerCase();
                        if (!/hide|masquer|إخفاء/.test(label) && viewport.width < 1440) {
                            await toggle.click();
                            await settle(p);
                        }
                    }
                },
            ],
            [
                'context-closed',
                `/inbox?thread=${thread}&context=0`,
                async (p) => ensureConversationPane(p, viewport),
            ],
        ];

        for (const [state, path, after] of states) {
            if (!shouldCapture(state, viewport, lang, theme)) {
                continue;
            }
            captures.push(
                await captureState(page, state, path, viewport, lang, theme, bucketRef, after),
            );
        }
    }

    await context.close();
    return captures;
}

function writeAliases(captures) {
    const aliases = [];
    for (const shot of captures) {
        if (shot.state === 'selected') {
            const dest = shotName('thread', shot.viewport, shot.lang, shot.theme);
            copyFileSync(join(SCREENSHOT_DIR, shot.file), join(SCREENSHOT_DIR, dest));
            aliases.push(dest);
        }
        if (shot.state === 'list' && ['390x844', '430x932'].includes(shot.viewport)) {
            const dest = shotName('mobile-list', shot.viewport, shot.lang, shot.theme);
            copyFileSync(join(SCREENSHOT_DIR, shot.file), join(SCREENSHOT_DIR, dest));
            aliases.push(dest);
        }
        if (shot.state === 'selected' && ['390x844', '430x932'].includes(shot.viewport)) {
            const dest = shotName('mobile-thread', shot.viewport, shot.lang, shot.theme);
            copyFileSync(join(SCREENSHOT_DIR, shot.file), join(SCREENSHOT_DIR, dest));
            aliases.push(dest);
        }
    }
    return aliases;
}

function pick(captures, state, viewport, lang = 'fr', theme = 'light') {
    return captures.find(
        (c) => c.state === state && c.viewport === viewport && c.lang === lang && c.theme === theme,
    );
}

async function main() {
    const ids = loadSeededIds();
    if (ids.error || !ids.thread) {
        console.error('capture-inbox-after: missing seeded user or thread', ids);
        process.exit(1);
    }

    setSimpleMode(false);
    console.log('seed', ids);

    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
        browser = await chromium.launch({ headless: true });
    }

    const captures = [];

    setUserLocale('fr');
    captures.push(...(await runVariant(browser, ids, 'fr', 'light', VIEWPORTS)));

    setUserLocale('en');
    captures.push(...(await runVariant(browser, ids, 'en', 'light', VIEWPORTS)));

    setUserLocale('ar');
    captures.push(...(await runVariant(browser, ids, 'ar', 'light', VIEWPORTS)));

    setUserLocale('fr');
    captures.push(...(await runVariant(browser, ids, 'fr', 'dark', VIEWPORTS)));

    setUserLocale('fr');
    await browser.close();

    const aliases = writeAliases(captures);

    const columns = {};
    for (const viewport of VIEWPORTS) {
        columns[viewport.id] = {
            list: pick(captures, 'list', viewport.id)?.metrics ?? null,
            selectedClosed: pick(captures, 'context-closed', viewport.id)?.metrics ?? null,
            contextOpen: pick(captures, 'context-open', viewport.id)?.metrics ?? null,
        };
    }

    writeFileSync(
        METRICS_PATH,
        JSON.stringify(
            {
                capturedAt: new Date().toISOString(),
                seed: ids,
                columns,
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
    writeFileSync(COLUMNS_PATH, JSON.stringify({ capturedAt: new Date().toISOString(), seed: ids, columns }, null, 2));
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
                aliases,
                files: [...captures.map((c) => c.file), ...aliases],
            },
            null,
            2,
        ),
    );

    console.log(`wrote ${captures.length} shots + ${aliases.length} aliases to ${OUTPUT_DIR}`);
    const c1440 = columns['1440x1000'];
    console.log('1440 list', c1440?.list && {
        rail: c1440.list.rail,
        folders: c1440.list.folders,
        list: c1440.list.list,
        conversation: c1440.list.conversation,
        caughtUpVisible: c1440.list.caughtUpVisible,
        pickConversationVisible: c1440.list.pickConversationVisible,
        threadCount: c1440.list.threadCount,
        banner: c1440.list.banner,
    });
    console.log('1440 closed', c1440?.selectedClosed && {
        list: c1440.selectedClosed.list,
        thread: c1440.selectedClosed.thread,
        conversation: c1440.selectedClosed.conversation,
        context: c1440.selectedClosed.context,
        folders: c1440.selectedClosed.folders,
    });
    console.log('1440 open', c1440?.contextOpen && {
        list: c1440.contextOpen.list,
        thread: c1440.contextOpen.thread,
        conversation: c1440.contextOpen.conversation,
        context: c1440.contextOpen.context,
    });
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
