#!/usr/bin/env node
/**
 * Compose W02-CONTACT-SHEET.png from real before/after captures.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');
const WAVE = resolve(REPO_ROOT, 'artifacts/product-rebuild/02-wave');
const OUT = join(WAVE, 'W02-CONTACT-SHEET.png');
const HTML = join(WAVE, 'W02-CONTACT-SHEET.html');

const pairs = [
    ['Deals board FR 1440', 'before/deals/deals-board__1440x1000__fr__light.png', 'after/deals/deals-board__1440x1000__fr__light.png'],
    ['Deals board filtered FR 1440', 'before/deals/deals-board__1440x1000__fr__light.png', 'after/deals/deals-board-filtered__1440x1000__fr__light.png'],
    ['Deals list FR 1440', 'before/deals/deals-list__1440x1000__fr__light.png', 'after/deals/deals-list__1440x1000__fr__light.png'],
    ['Deals board AR RTL 1440', 'before/deals/deals-board__1440x1000__ar__light.png', 'after/deals/deals-board__1440x1000__ar__light.png'],
    ['Deals board FR dark 1440', 'before/deals/deals-board__1440x1000__fr__dark.png', 'after/deals/deals-board__1440x1000__fr__dark.png'],
    ['Deals board mobile 390', 'before/deals/deals-board__390x844__fr__light.png', 'after/deals/deals-board__390x844__fr__light.png'],
    ['Deals list mobile 390', 'before/deals/deals-list__390x844__fr__light.png', 'after/deals/deals-list__390x844__fr__light.png'],
    ['Deals QuickRecord FR 1440', 'before/deals/deals-board__1440x1000__fr__light.png', 'after/deals/deals-quickrecord__1440x1000__fr__light.png'],
    ['Inbox list FR 1440', 'before/inbox/list__1440x1000__fr__light.png', 'after/inbox/list__1440x1000__fr__light.png'],
    ['Inbox selected / thread FR 1440', 'before/inbox/selected__1440x1000__fr__light.png', 'after/inbox/selected__1440x1000__fr__light.png'],
    ['Inbox composer FR 1440', 'before/inbox/composer__1440x1000__fr__light.png', 'after/inbox/composer__1440x1000__fr__light.png'],
    ['Inbox internal note FR 1440', 'before/inbox/internal-note__1440x1000__fr__light.png', 'after/inbox/internal-note__1440x1000__fr__light.png'],
    ['Inbox context open FR 1440', 'before/inbox/context-open__1440x1000__fr__light.png', 'after/inbox/context-open__1440x1000__fr__light.png'],
    ['Inbox context closed FR 1440', 'before/inbox/context-closed__1440x1000__fr__light.png', 'after/inbox/context-closed__1440x1000__fr__light.png'],
    ['Inbox selected AR RTL 1440', 'before/inbox/selected__1440x1000__ar__light.png', 'after/inbox/selected__1440x1000__ar__light.png'],
    ['Inbox selected FR dark 1440', 'before/inbox/selected__1440x1000__fr__dark.png', 'after/inbox/selected__1440x1000__fr__dark.png'],
    ['Inbox mobile list 390', 'before/inbox/list__390x844__fr__light.png', 'after/inbox/mobile-list__390x844__fr__light.png'],
    ['Inbox mobile thread 390', 'before/inbox/selected__390x844__fr__light.png', 'after/inbox/mobile-thread__390x844__fr__light.png'],
];

const cells = pairs
    .map(([label, before, after]) => {
        const b = join(WAVE, before);
        const a = join(WAVE, after);
        return {
            label,
            before: existsSync(b) ? b : null,
            after: existsSync(a) ? a : null,
        };
    })
    .filter((row) => row.before || row.after);

const figures = cells
    .map(
        (row) => `
    <section>
      <h2>${row.label}</h2>
      <div class="pair">
        <figure>
          ${row.before ? `<img src="file://${row.before}" alt="before ${row.label}" />` : '<div class="miss">no before</div>'}
          <figcaption>Before</figcaption>
        </figure>
        <figure>
          ${row.after ? `<img src="file://${row.after}" alt="after ${row.label}" />` : '<div class="miss">no after</div>'}
          <figcaption>After</figcaption>
        </figure>
      </div>
    </section>`,
    )
    .join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>W02 contact sheet</title>
<style>
  html, body { margin: 0; background: #161615; color: #f4f1ea; font: 12px/1.35 ui-sans-serif, system-ui, sans-serif; }
  header { padding: 18px 20px 8px; }
  h1 { margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
  p { margin: 6px 0 0; color: #b9b4a8; }
  main { display: grid; grid-template-columns: 1fr; gap: 14px; padding: 8px 16px 24px; }
  section { background: #1c1c1a; border: 1px solid #2c2c28; padding: 8px 10px 10px; }
  h2 { margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #ece7db; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  figure { margin: 0; }
  img { display: block; width: 100%; height: auto; background: #000; border: 1px solid #2c2c28; }
  figcaption { margin-top: 4px; color: #9a9588; font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase; }
  .miss { min-height: 80px; display: grid; place-items: center; color: #6b665c; border: 1px dashed #3a3934; }
</style></head>
<body>
<header>
  <h1>W02 Deals + Inbox · before / after</h1>
  <p>Independent certification · FR + AR RTL + mobile + dark · seeded Evotechly only · localhost</p>
</header>
<main>${figures}</main>
</body></html>`;

writeFileSync(HTML, html);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
await page.goto(`file://${HTML}`, { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.screenshot({ path: OUT, fullPage: true });
await browser.close();
console.log(`Wrote ${OUT} (${cells.length} pairs)`);
