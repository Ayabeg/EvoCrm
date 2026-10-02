/* global process */
import pkg from '/tmp/pw/node_modules/playwright-core/index.js';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = pkg;
const BASE = process.env.APP_URL ?? 'http://127.0.0.1:8000';

const DENY = [
    { id: 'Deal', re: /\bDeal\b/ },
    { id: 'Amount', re: /\bAmount\b/ },
    { id: 'Owner', re: /\bOwner\b/ },
    { id: 'Status', re: /\bStatus\b/ },
    { id: 'Sent', re: /\bSent\b/ },
    { id: 'Created', re: /\bCreated\b/ },
    { id: 'Expires', re: /\bExpires\b/ },
    { id: 'Create', re: /\bCreate\b/ },
    { id: 'Add', re: /\bAdd\b/ },
    { id: 'View', re: /\bView\b/ },
    { id: 'Open', re: /\bOpen\b/ },
    { id: 'Move', re: /\bMove\b/ },
    { id: 'No … yet', re: /\bNo\b.+\byet\b/i },
    { id: 'Weighted', re: /\bWeighted\b/ },
    { id: 'quote', re: /\bquotes?\b/ },
    { id: 'Campaigns', re: /\bCampaigns?\b/ },
    { id: 'Sequences', re: /\bSequences?\b/ },
    { id: 'Lists', re: /\bLists\b/ },
    { id: 'Mailbox', re: /\bMailbox\b/ },
    { id: 'Recent activity', re: /Recent activity/ },
    { id: 'Schedule', re: /\bSchedule\b/ },
    { id: 'Apply', re: /\bApply\b/ },
    { id: 'Preview', re: /\bPreview\b/ },
    { id: 'Received', re: /\bReceived\b/ },
    { id: 'Continue', re: /\bContinue\b/ },
    { id: 'Close date', re: /Close date/ },
    { id: 'Last activity', re: /Last activity/ },
    { id: 'Line items', re: /Line items/ },
    { id: 'Splits', re: /\bSplits\b/ },
    { id: 'Catch-up', re: /Catch-up/i },
    { id: 'Inbound', re: /\bInbound\b/ },
    { id: 'Outbound heading', re: /(?:^|\n)\s*Outbound\s*(?:\n|$)/ },
    { id: 'Custom', re: /\bCustom\b/ },
    { id: 'Rooms', re: /\bRooms\b/ },
    { id: 'template', re: /\btemplates?\b/ },
    { id: 'Need', re: /\bNeed\b/ },
    { id: 'Conservative', re: /\bConservative\b/ },
    { id: 'Watch', re: /\bWatch\b/ },
    { id: 'Qualified at', re: /Qualified at/ },
    { id: 'days ago', re: /days ago/ },
    { id: 'AM/PM', re: /\b(?:AM|PM)\b/ },
    { id: 'ISO date', re: /\b20\d{2}-\d{2}-\d{2}\b/ },
    { id: 'US date', re: /mm\/dd\/yyyy/i },
    { id: 'localhost', re: /127\.0\.0\.1|localhost/i },
    { id: 'Evolution', re: /\bEvolution\b/ },
    { id: 'Baileys', re: /\bBaileys\b/ },
    { id: 'Cloud templates', re: /Cloud templates/i },
    { id: 'IMAP', re: /\bIMAP\b/ },
    { id: 'evosales', re: /evosales/i },
];

const ROUTES = [
    { path: '/dashboard', wait: '[data-home="workspace"]', user: 'owner' },
    { path: '/inbox', wait: '[data-inbox="panes"]', user: 'owner' },
    { path: '/crm/contacts', wait: '[data-crm="contacts-workspace"], h1', user: 'owner' },
    { path: '/crm/deals', wait: '[data-crm="deals-workspace"]', user: 'owner' },
    { path: '/crm/deals/board', wait: '[data-crm="deals-board"]', user: 'owner' },
    { path: '/crm/quotes/create', wait: '[data-crm="quote-create"]', user: 'owner' },
    { path: '/reports', wait: 'h1, [data-chrome="contextual"]', user: 'owner' },
    { path: '/outbound', wait: 'h1, [data-chrome="contextual"]', user: 'owner' },
    { path: '/outbound/campaigns', wait: 'h1, h2', user: 'owner' },
    { path: '/settings/meetings', wait: 'h1', user: 'owner' },
    { path: '/settings/whatsapp', wait: 'h1', user: 'owner' },
    { path: '/agents', wait: '[data-agents-home], [data-agents-page]', user: 'member' },
    { path: '/agents/closer', wait: '[data-agent-workspace]', user: 'member' },
];

async function login(page, email) {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password');
    await Promise.all([
        page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 25000 }),
        page.click('button[type="submit"]'),
    ]);
}

async function firstRecord(page, listPath, prefix) {
    await page.goto(`${BASE}${listPath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const hrefs = await page.locator(`a[href^="${prefix}"]`).evaluateAll((anchors, root) =>
        anchors
            .map((anchor) => anchor.getAttribute('href') ?? '')
            .filter((href) => new RegExp(`^${root}\\d+`).test(href.split('?')[0] ?? '')),
    prefix);

    return hrefs[0] ?? null;
}

function scan(text, path) {
    const hits = [];
    const visible = text.replace(/[A-Za-z0-9._%+-]+@evosales\.local/gi, '');

    for (const rule of DENY) {
        const match = visible.match(rule.re);

        if (match) {
            const at = match.index ?? 0;
            const snippet = text.slice(Math.max(0, at - 40), at + (match[0]?.length ?? 0) + 40)
                .replace(/\s+/g, ' ')
                .trim();
            hits.push(`${path}: ${rule.id} «${snippet}»`);
        }
    }

    return hits;
}

const lines = [];
const fail = [];

const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function runUser(email, routes) {
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        colorScheme: 'light',
    });
    await context.addCookies([{ name: 'appearance', value: 'light', url: BASE }]);
    await context.addInitScript(() => {
        localStorage.setItem('appearance', 'light');
        const root = document.documentElement;

        if (root?.classList) {
            root.classList.remove('dark');
        }
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('pageerror', (error) => consoleErrors.push(String(error)));
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
        }
    });
    await login(page, email);

    const extra = [];

    if (email.startsWith('visualqa')) {
        await page.goto(`${BASE}/crm/deals`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const modern = await page
            .locator('a[href^="/crm/deals/"]')
            .filter({ hasText: 'Modernisation' })
            .first()
            .getAttribute('href')
            .catch(() => null);
        const deal = modern ?? (await firstRecord(page, '/crm/deals', '/crm/deals/'));
        const quote = await firstRecord(page, '/crm/quotes', '/crm/quotes/');

        if (deal) {
            extra.push({ path: deal, wait: '[data-crm="deals-record"], h1', user: 'owner' });
        }

        if (quote) {
            extra.push({ path: quote, wait: 'h1', user: 'owner' });
        }
    }

    for (const route of [...routes, ...extra]) {
        await page.goto(`${BASE}${route.path}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        if (route.wait) {
            await page.waitForSelector(route.wait, { timeout: 20000 }).catch(() => null);
        }

        await page.waitForTimeout(600);
        const text = await page.evaluate(() => {
            const hidden = (node) => {
                if (
                    node.closest(
                        'script, style, [inert], [hidden], [aria-hidden="true"], .evo-mode-off, .sr-only',
                    )
                ) {
                    return true;
                }

                let current = node;

                while (current && current !== document.body) {
                    const style = window.getComputedStyle(current);

                    if (
                        style.display === 'none' ||
                        style.visibility === 'hidden'
                    ) {
                        return true;
                    }

                    current = current.parentElement;
                }

                return false;
            };
            const bits = [];
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
            );

            while (walker.nextNode()) {
                const node = walker.currentNode;
                const parent = node.parentElement;

                if (!parent || hidden(parent)) {
                    continue;
                }

                const value = (node.textContent ?? '').trim();

                if (value) {
                    bits.push(value);
                }
            }

            document
                .querySelectorAll('input, textarea, select, [placeholder]')
                .forEach((node) => {
                    if (hidden(node)) {
                        return;
                    }

                    bits.push(node.getAttribute('placeholder') ?? '');
                    bits.push(node.getAttribute('aria-label') ?? '');

                    if (node instanceof HTMLInputElement && node.type === 'hidden') {
                        return;
                    }

                    if ('value' in node && typeof node.value === 'string') {
                        bits.push(node.value);
                    }
                });

            return bits.join('\n');
        });
        const hits = scan(text, route.path);
        const pageErrors = consoleErrors.splice(0);
        const classList = pageErrors.filter((error) => /classList/.test(error));
        lines.push(`ROUTE ${route.path}`);

        if (hits.length) {
            lines.push(`  DENY ${hits.join(' | ')}`);
            fail.push(...hits);
        } else {
            lines.push('  copy ok');
        }

        if (pageErrors.length) {
            lines.push(`  CONSOLE ${pageErrors.join(' | ')}`);
            fail.push(...pageErrors.map((error) => `${route.path}: console ${error}`));
        }

        if (classList.length) {
            fail.push(`${route.path}: classList error`);
        }
    }

    await context.close();
}

await runUser(
    'visualqa@evosales.local',
    ROUTES.filter((route) => route.user === 'owner'),
);
await runUser(
    'rania@visualqa.local',
    ROUTES.filter((route) => route.user === 'member'),
);

await browser.close();

if (fail.length) {
    lines.push('');
    lines.push(`FAIL ${fail.length}`);
    fail.forEach((item) => lines.push(`- ${item}`));
} else {
    lines.push('');
    lines.push('PASS');
}

const report = `${lines.join('\n')}\n`;
process.stdout.write(report);

const out = process.env.COPY_GUARD_OUT;

if (out) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, report);
}

if (fail.length) {
    process.exit(1);
}
