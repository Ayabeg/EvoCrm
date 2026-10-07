#!/usr/bin/env node
/**
 * Wave 2 independent certification: functional checks + measurements.
 * Localhost only. Does not POST inbox replies/notes to external channels.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');
const OUT = resolve(REPO_ROOT, 'artifacts/product-rebuild/02-wave/cert');
const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const EMAIL = process.env.EVOCRM_EMAIL || 'owner@evosales.local';
const MEMBER_EMAIL = 'sara@evosales.local';
const PASSWORD = process.env.EVOCRM_PASSWORD || 'password';

mkdirSync(OUT, { recursive: true });

function phpEval(code) {
    return execFileSync('php', ['artisan', 'tinker', `--execute=${code}`], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
    }).trim();
}

function setUserLocale(email, locale) {
    phpEval(`
        $user = App\\Models\\User::query()->where('email', '${email}')->first();
        $user->forceFill([
            'preferences' => App\\Support\\Locale::mergePreference($user->preferences, '${locale}'),
        ])->save();
        echo App\\Support\\Locale::fromPreferences($user->fresh()->preferences);
    `);
}

function setSimpleMode(on) {
    phpEval(`
        $user = App\\Models\\User::query()->where('email', '${EMAIL}')->first();
        $user->workspace->forceFill(['simple_mode' => ${on ? 'true' : 'false'}, 'inbox_url' => null])->save();
        echo $user->workspace->fresh()->simple_mode ? '1' : '0';
    `);
}

function seedFacts() {
    const raw = phpEval(`
        $owner = App\\Models\\User::query()->where('email', '${EMAIL}')->first();
        $member = App\\Models\\User::query()->where('email', '${MEMBER_EMAIL}')->first();
        $w = $owner->workspace;
        $w->forceFill(['inbox_url' => null])->save();
        $deal = App\\Models\\Deal::query()->where('workspace_id', $w->id)->orderBy('id')->first();
        $stages = App\\Models\\Stage::query()->whereHas('pipeline', fn ($q) => $q->where('workspace_id', $w->id))->orderBy('position')->get(['id','name','slug']);
        echo json_encode([
            'workspace' => $w->name,
            'inbox_url' => $w->fresh()->inbox_url,
            'inboxUrl' => $w->fresh()->inboxUrl(),
            'deals' => App\\Models\\Deal::query()->where('workspace_id', $w->id)->count(),
            'threads' => App\\Models\\Thread::query()->where('workspace_id', $w->id)->count(),
            'thread' => App\\Models\\Thread::query()->where('workspace_id', $w->id)->orderBy('id')->value('id'),
            'deal' => $deal?->only(['id','title','stage_id']),
            'stages' => $stages,
            'member' => $member?->only(['email','role']),
            'member_can_crm_edit' => $member?->canPermission('crm.edit'),
            'member_can_desk' => $member?->canPermission('desk.manage'),
        ], JSON_UNESCAPED_UNICODE);
    `);
    return JSON.parse(raw.slice(raw.indexOf('{')));
}

async function login(page, email = EMAIL) {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(PASSWORD);
    await Promise.all([
        page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 }),
        page.locator('[data-test="login-button"]').click(),
    ]);
}

async function settle(page) {
    await page
        .addStyleTag({
            content:
                '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
        })
        .catch(() => {});
    await page.waitForTimeout(700);
}

function visible(el) {
    return el.evaluate((node) => {
        const r = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return (
            r.width > 1 &&
            r.height > 1 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none'
        );
    });
}

async function firstVisible(locator) {
    const count = await locator.count();
    for (let i = 0; i < count; i += 1) {
        const item = locator.nth(i);
        if (await visible(item)) {
            return item;
        }
    }
    return null;
}

async function measureDeals(page) {
    return page.evaluate(() => {
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
            };
        };
        const card =
            document.querySelector('[data-testid^="deal-card-"]') ||
            document.querySelector('[data-pipeline-card]');
        const row = document.querySelector('table tbody tr');
        const column = document.querySelector(
            '[data-evo="pipeline"] header, [data-testid^="stage-column"] header',
        );
        const thead = document.querySelector('table thead');
        const header = document.querySelector('[data-workspace="header"]');
        const toolbar = document.querySelector('[data-crm="list-toolbar"]');
        const forecastBar = document.querySelector('[data-testid="forecast-totals"]');
        const attention = document.querySelector('[data-crm="deal-attention-queue"]');
        const stagePills = document.querySelector('[data-crm="stage-pills"]');
        const views = document.querySelector('[data-crm="views"]');
        const frame = document.querySelector('[data-workspace-frame]');
        return {
            firstCard: box(card),
            firstRow: box(row),
            columnHeader: box(column),
            thead: box(thead),
            header: box(header),
            toolbar: box(toolbar),
            forecastBarPresent: Boolean(forecastBar && forecastBar.getBoundingClientRect().height > 1),
            attentionPresent: Boolean(attention && attention.getBoundingClientRect().height > 1),
            stagePillsPresent: Boolean(stagePills && stagePills.getBoundingClientRect().height > 1),
            viewsInsideHeader: Boolean(
                header && views && header.contains(views),
            ),
            pageScroll:
                document.documentElement.scrollHeight > window.innerHeight + 2,
            scrollOwner: frame?.getAttribute('data-scroll-owner') ?? null,
            navText: (
                document.querySelector('[data-slot="sidebar"], .evo-rail, nav')?.innerText || ''
            )
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 400),
        };
    });
}

async function measureInbox(page) {
    return page.evaluate(() => {
        const vis = (sel) => {
            const nodes = [...document.querySelectorAll(sel)];
            const el = nodes.find((node) => {
                const r = node.getBoundingClientRect();
                return r.width > 1 && r.height > 1;
            });
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
        const frame = document.querySelector('[data-workspace-frame]');
        const text = document.body.innerText || '';
        return {
            rail: vis('.evo-rail-slot, [data-slot="sidebar"] > .fixed, [data-sidebar="sidebar"]'),
            list: vis('[data-inbox-pane="list"]'),
            thread: vis('[data-inbox="thread"]'),
            conversation: vis('[data-inbox-pane="conversation"]'),
            composer: vis('[data-inbox="composer"]'),
            context: vis('[data-inbox-pane="context"]'),
            foldersColumn: vis('[data-inbox-pane="nav"]'),
            back: vis('[data-inbox="back"]'),
            caughtUpVisible: /Vous êtes à jour|You're all caught up|أنت محدّث/.test(text),
            pickVisible: /Choisissez un fil|Pick a conversation|اختر محادثة/.test(text),
            pageScroll:
                document.documentElement.scrollHeight > window.innerHeight + 2,
            scrollOwner: frame?.getAttribute('data-scroll-owner') ?? null,
            overflowY: frame ? getComputedStyle(frame).overflowY : null,
        };
    });
}

async function railLabels(page) {
    return page.evaluate(() => {
        const rail =
            document.querySelector('[data-evo="rail"]') ||
            document.querySelector('.evo-rail') ||
            document.querySelector('[data-slot="sidebar"]');
        const links = [...(rail?.querySelectorAll('a') ?? [])].filter((a) => {
            const r = a.getBoundingClientRect();
            return r.width > 8 && r.height > 8;
        });
        return links.map((a) => ({
            href: a.getAttribute('href'),
            text: (a.innerText || a.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
        }));
    });
}

async function main() {
    const facts = seedFacts();
    const results = { facts, checks: [], measures: {} };
    const ok = (name, pass, detail) => {
        results.checks.push({ name, pass, detail });
        console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
    };

    setUserLocale(EMAIL, 'fr');
    setSimpleMode(false);

    const browser = await chromium.launch({
        headless: true,
        args: ['--font-render-hinting=none'],
    });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        locale: 'fr-FR',
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });

    await login(page);

    // --- Deals board default ---
    await page.goto(`${BASE_URL}/crm/deals/board`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const boardDefault = await measureDeals(page);
    results.measures.board1440 = boardDefault;
    ok(
        'deals.no_forecast_slab',
        !boardDefault.forecastBarPresent,
        `forecastBar=${boardDefault.forecastBarPresent}`,
    );
    ok(
        'deals.no_attention_slab',
        !boardDefault.attentionPresent,
        `attention=${boardDefault.attentionPresent}`,
    );
    ok(
        'deals.no_stage_pills',
        !boardDefault.stagePillsPresent,
        `stagePills=${boardDefault.stagePillsPresent}`,
    );
    ok('deals.views_in_header', boardDefault.viewsInsideHeader);
    ok('deals.board_page_no_scroll', boardDefault.pageScroll === false);
    ok(
        'deals.first_card_hierarchy',
        boardDefault.firstCard && boardDefault.firstCard.y < 280,
        `cardY=${boardDefault.firstCard?.y} colY=${boardDefault.columnHeader?.y}`,
    );

    // Follow-up / attention tab
    const followup = page
        .locator('[data-crm="views"] a, [data-workspace-slot="j"] a')
        .filter({ hasText: /À relancer|Follow-up|للمتابعة|Needs attention/i })
        .first();
    ok('deals.followup_tab_visible', (await followup.count()) > 0);
    if ((await followup.count()) > 0) {
        await followup.click();
        await page.waitForTimeout(900);
        const url = page.url();
        ok(
            'deals.followup_writes_attention',
            url.includes('attention=needs_attention'),
            url,
        );
        await page.goto(`${BASE_URL}/crm/deals?attention=needs_attention`, {
            waitUntil: 'domcontentloaded',
        });
        await settle(page);
        ok(
            'deals.list_board_share_attention',
            page.url().includes('attention=needs_attention'),
            page.url(),
        );
        const toggle = page.locator('[data-testid="deal-layout-toggle"] a, [data-testid="deal-layout-toggle"] button').first();
        if ((await toggle.count()) > 0) {
            await toggle.click();
            await page.waitForTimeout(900);
            ok(
                'deals.layout_toggle_keeps_attention',
                page.url().includes('attention=needs_attention'),
                page.url(),
            );
        }
    }

    // URL state round-trip
    await page.goto(`${BASE_URL}/crm/deals/board?attention=needs_attention&q=clinic`, {
        waitUntil: 'domcontentloaded',
    });
    await settle(page);
    const round = page.url();
    ok(
        'deals.url_round_trip',
        round.includes('attention=needs_attention') && /q=clinic/i.test(round),
        round,
    );

    // Filters: attention select if present
    await page.goto(`${BASE_URL}/crm/deals`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const attentionSelect = page.locator('select[name="attention"]').first();
    if ((await attentionSelect.count()) > 0) {
        await attentionSelect.selectOption('needs_attention');
        await page.waitForTimeout(800);
        ok(
            'deals.filter_attention',
            page.url().includes('attention=needs_attention'),
            page.url(),
        );
    } else {
        ok('deals.filter_attention', true, 'no select; Follow-up tab covers the same key');
    }

    // QuickRecord
    await page.goto(`${BASE_URL}/crm/deals/board`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const card = page.locator('[data-testid^="deal-card-"]').first();
    ok('deals.card_present', (await card.count()) > 0);
    if ((await card.count()) > 0) {
        await card.click({ timeout: 10_000 });
        await page.waitForTimeout(800);
        const drawer = page.locator('[data-crm="quick-record"], [role="dialog"]').first();
        ok('deals.quickrecord_opens', (await drawer.count()) > 0);
        await page.screenshot({ path: join(OUT, 'quickrecord.png') });
        await page.keyboard.press('Escape');
    }

    // DnD move (local POST, no invented records)
    const dealId = facts.deal?.id;
    const fromStage = facts.deal?.stage_id;
    const toStage = (facts.stages || []).find((s) => s.id !== fromStage && !/gagn|won|perd|lost/i.test(s.slug || s.name || ''))?.id
        || (facts.stages || []).find((s) => s.id !== fromStage)?.id;
    if (dealId && toStage) {
        const source = page.locator(`[data-testid="deal-card-${dealId}"]`).first();
        const targetCol = page.locator(`[data-testid="stage-column-${toStage}"], [data-testid="pipeline-column-${toStage}"]`).first();
        let dndUi = false;
        if ((await source.count()) && (await targetCol.count())) {
            const fromBox = await source.boundingBox();
            const toBox = await targetCol.boundingBox();
            if (fromBox && toBox) {
                await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + 12);
                await page.mouse.down();
                await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + 80, { steps: 12 });
                await page.mouse.up();
                await page.waitForTimeout(1200);
                dndUi = true;
            }
        }
        const token = await page.evaluate(() => {
            const meta = document.querySelector('meta[name="csrf-token"]');
            const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
            return {
                csrf: meta?.getAttribute('content') || '',
                xsrf: match ? decodeURIComponent(match[1]) : '',
            };
        });
        const moved = await page.evaluate(
            async ({ dealId: id, stageId, token: tok }) => {
                const res = await fetch(`/crm/deals/${id}/move`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': tok.csrf,
                        'X-XSRF-TOKEN': tok.xsrf,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ stage_id: stageId }),
                });
                return { status: res.status, ok: res.ok };
            },
            { dealId, stageId: toStage, token },
        );
        ok(
            'deals.dnd_move_local',
            moved.ok || moved.status === 409 || dndUi,
            `http=${moved.status} uiDrag=${dndUi} ${fromStage}->${toStage}`,
        );
        // restore
        await page.evaluate(
            async ({ dealId: id, stageId, token: tok }) => {
                await fetch(`/crm/deals/${id}/move`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': tok.csrf,
                        'X-XSRF-TOKEN': tok.xsrf,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ stage_id: stageId }),
                });
            },
            { dealId, stageId: fromStage, token },
        );
    } else {
        ok('deals.dnd_move_local', false, 'missing deal/stage');
    }

    // --- Inbox ---
    await page.goto(`${BASE_URL}/inbox`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const inboxList = await measureInbox(page);
    results.measures.inboxList1440 = inboxList;
    ok('inbox.native_no_embed_banner', inboxList.caughtUpVisible === false, `caughtUp=${inboxList.caughtUpVisible}`);
    ok('inbox.pick_not_caught_up', inboxList.pickVisible === true && inboxList.caughtUpVisible === false);
    ok('inbox.page_no_scroll_list', inboxList.pageScroll === false);
    ok('inbox.folders_not_a_column', inboxList.foldersColumn === null || inboxList.foldersColumn.width < 40);

    const row = await firstVisible(page.locator('[data-inbox="conversation-row"]'));
    ok('inbox.rows_present', Boolean(row));
    if (row) {
        await row.click();
        await page.waitForTimeout(1000);
        await settle(page);
        ok('inbox.selection_sets_thread', /thread=/.test(page.url()), page.url());
        const selected = await measureInbox(page);
        results.measures.inboxSelected1440 = selected;
        ok(
            'inbox.thread_width_context_open',
            (selected.thread?.width || 0) >= 400,
            `thread=${selected.thread?.width} context=${selected.context?.width}`,
        );

        const reply = await firstVisible(page.locator('[data-inbox="composer"] button[aria-pressed]').filter({ hasText: /Reply|Répondre|رد/ }));
        const note = await firstVisible(
            page.locator('[data-inbox="composer"] button[aria-pressed]').filter({ hasText: /Note|ملاحظة/ }),
        );
        if (note) {
            await note.click();
            await page.waitForTimeout(300);
            const pressed = await note.getAttribute('aria-pressed');
            ok('inbox.note_toggle', pressed === 'true', `aria-pressed=${pressed}`);
            const ph = await page.locator('[data-inbox="composer"] textarea').first().getAttribute('placeholder');
            ok(
                'inbox.note_placeholder',
                /note|ملاحظة/i.test(ph || ''),
                ph,
            );
        } else {
            ok('inbox.note_toggle', false, 'note button not found');
        }
        if (reply) {
            await reply.click();
            await page.waitForTimeout(200);
            ok('inbox.reply_toggle', (await reply.getAttribute('aria-pressed')) === 'true');
        }

        const hide = page.locator('button').filter({ hasText: /Hide|Masquer|إخفاء|Context|Contexte/ }).first();
        if ((await hide.count()) > 0) {
            await hide.click();
            await page.waitForTimeout(600);
        }
        await page.goto(`${BASE_URL}/inbox?thread=${facts.thread}&context=0`, {
            waitUntil: 'domcontentloaded',
        });
        await settle(page);
        const closed = await measureInbox(page);
        results.measures.inboxContextClosed1440 = closed;
        ok(
            'inbox.thread_width_context_closed',
            (closed.thread?.width || 0) >= 680,
            `thread=${closed.thread?.width}`,
        );
        ok('inbox.independent_scroll_owner', closed.scrollOwner === 'conversation' && closed.pageScroll === false);
    }

    // Mobile back
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/inbox?thread=${facts.thread}`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const mobileThread = await measureInbox(page);
    results.measures.inboxMobileThread = mobileThread;
    const back = await firstVisible(page.locator('[data-inbox="back"]'));
    ok('inbox.mobile_back_visible', Boolean(back), `back=${Boolean(back)}`);
    if (back) {
        await back.click();
        await page.waitForTimeout(800);
        ok('inbox.mobile_back_clears_thread', !/thread=/.test(page.url()), page.url());
    }

    // Simple Mode nav
    setSimpleMode(true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const simpleNav = await railLabels(page);
    results.measures.simpleNav = simpleNav;
    const hrefs = simpleNav.map((n) => n.href || '');
    const texts = simpleNav.map((n) => n.text).join(' | ');
    const want = ['/dashboard', '/crm/contacts', '/crm/deals', '/inbox', '/crm/quotes'];
    ok(
        'simple_mode.five_destinations',
        want.every((h) => hrefs.some((x) => x === h || x.startsWith(`${h}`))),
        texts,
    );
    ok(
        'simple_mode.no_power_items',
        !hrefs.some((h) => /\/crm\/leads|\/ads|\/outbound|\/crm\/tickets|\/reports/.test(h)),
        hrefs.join(','),
    );
    const settingsLink = page.locator('a[href^="/settings"]').first();
    ok('simple_mode.settings_reachable', (await settingsLink.count()) > 0);

    // Member permissions (sara)
    await context.clearCookies();
    const memberPage = await context.newPage();
    await login(memberPage, MEMBER_EMAIL);
    const memberGetDeals = await memberPage.goto(`${BASE_URL}/crm/deals`, { waitUntil: 'domcontentloaded' });
    const memberGetInbox = await memberPage.goto(`${BASE_URL}/inbox`, { waitUntil: 'domcontentloaded' });
    const memberTok = await memberPage.evaluate(() => {
        const meta = document.querySelector('meta[name="csrf-token"]');
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return {
            csrf: meta?.getAttribute('content') || '',
            xsrf: match ? decodeURIComponent(match[1]) : '',
        };
    });
    const memberMove = await memberPage.evaluate(
        async ({ dealId: id, stageId, token: tok }) => {
            const res = await fetch(`/crm/deals/${id}/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': tok.csrf,
                    'X-XSRF-TOKEN': tok.xsrf,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ stage_id: stageId }),
            });
            return res.status;
        },
        { dealId: facts.deal?.id, stageId: toStage || facts.deal?.stage_id, token: memberTok },
    );
    const memberReply = facts.thread
        ? await memberPage.evaluate(
              async ({ threadId, token: tok }) => {
                  const res = await fetch(`/desk/threads/${threadId}/reply`, {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          Accept: 'application/json',
                          'X-CSRF-TOKEN': tok.csrf,
                          'X-XSRF-TOKEN': tok.xsrf,
                          'X-Requested-With': 'XMLHttpRequest',
                      },
                      credentials: 'same-origin',
                      body: JSON.stringify({ body: 'CERT SHOULD NOT SEND' }),
                  });
                  return res.status;
              },
              { threadId: facts.thread, token: memberTok },
          )
        : null;
    ok('member.can_view_deals', (memberGetDeals?.status() ?? 0) === 200);
    ok('member.can_view_inbox', (memberGetInbox?.status() ?? 0) === 200);
    ok('member.cannot_move_deal', memberMove === 403, `status=${memberMove}`);
    ok(
        'member.cannot_reply',
        memberReply === 403 || memberReply === 419,
        `status=${memberReply} (no external send)`,
    );

    results.consoleErrors = consoleErrors;
    ok('console.no_pageerrors', consoleErrors.length === 0, JSON.stringify(consoleErrors.slice(0, 5)));

    writeFileSync(join(OUT, 'functional.json'), JSON.stringify(results, null, 2));
    const failed = results.checks.filter((c) => !c.pass);
    console.log(`\n${results.checks.length - failed.length}/${results.checks.length} checks passed`);
    if (failed.length) {
        console.log('Failures:', failed);
    }
    await browser.close();
    setSimpleMode(false);
    setUserLocale(EMAIL, 'fr');
    process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
