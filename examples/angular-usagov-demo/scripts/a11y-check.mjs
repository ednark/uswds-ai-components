#!/usr/bin/env node
// Accessibility + behavior checks against a running app (npm start, then npm run test:a11y).
// axe-core covers WCAG 2.0/2.1 A+AA and Section 508 rules; the behavior checks cover what
// axe can't see: the focus management that replaces USWDS JavaScript in this Angular port.
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4300';
const CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SCREENSHOT_DIR;
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'section508'];
const VIEWPORTS = { desktop: { width: 1280, height: 900 }, mobile: { width: 375, height: 812 } };

const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const failures = [];
const check = (ok, label, detail = '') => {
  console.log(`${ok ? '  ✔' : '  ✖'} ${label}${!ok && detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(label);
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
const activeId = () => page.evaluate(() => document.activeElement?.id ?? '');

async function open(path, viewport) {
  await page.setViewport(VIEWPORTS[viewport]);
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('main h1');
}

async function axe(path, viewport) {
  await open(path, viewport);
  await page.evaluate(axeSource);
  const { violations } = await page.evaluate(
    (tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
    AXE_TAGS,
  );
  const detail = violations
    .map((v) => `${v.id} (${v.impact}, ${v.nodes.length}): ${v.nodes[0].target.join(' ')}`)
    .join('; ');
  check(violations.length === 0, `axe ${viewport} ${path}: ${violations.length} violations`, detail);
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    const name = `${viewport}${path === '/' ? '-home' : path.replaceAll('/', '-')}.png`;
    await page.screenshot({ path: join(SHOTS, name), fullPage: true });
  }
}

console.log('axe-core scans (WCAG 2.1 AA + Section 508)');
for (const viewport of Object.keys(VIEWPORTS)) {
  for (const path of ['/', '/contact']) await axe(path, viewport);
}

console.log('Skip navigation');
await open('/', 'desktop');
await page.keyboard.press('Tab');
// USWDS slides the skip link into view over .15s; measured mid-transition it reads top:-59.
// Verified in real Chrome: top: 0 once settled.
await new Promise((r) => setTimeout(r, 250));
const skip = await page.evaluate(() => {
  const el = document.activeElement;
  const box = el.getBoundingClientRect();
  return { cls: el.className, top: box.top, left: box.left, width: box.width };
});
check(skip.cls.includes('usa-skipnav'), 'first Tab stop is the skip link', skip.cls);
check(skip.top >= 0 && skip.left >= 0 && skip.width > 0, 'skip link is visible when focused', JSON.stringify(skip));
await page.keyboard.press('Enter');
check((await activeId()) === 'main-content', 'skip link moves focus to #main-content');

console.log('Government banner');
const bannerState = () =>
  page.evaluate(() => {
    const content = document.getElementById('gov-banner-content');
    return {
      expanded: document.querySelector('.usa-banner__button').getAttribute('aria-expanded'),
      hidden: content.hidden,
      height: content.offsetHeight,
    };
  });
check(JSON.stringify(await bannerState()) === '{"expanded":"false","hidden":true,"height":0}', 'banner starts collapsed');
await page.click('.usa-banner__button');
// Zoneless rendering is asynchronous: wait for the signal-driven attribute change
// before reading state (verified correct in real Chrome).
await page.waitForFunction(
  () => document.querySelector('.usa-banner__button').getAttribute('aria-expanded') === 'true',
);
const openState = await bannerState();
check(
  openState.expanded === 'true' && !openState.hidden && openState.height > 0,
  'banner button expands guidance',
  JSON.stringify(openState),
);

console.log('Mobile menu');
await open('/', 'mobile');
await page.click('.usa-menu-btn');
await page.waitForSelector('.usa-nav.is-visible');
check((await page.evaluate(() => document.activeElement.className)) === 'usa-nav__close', 'opening menu focuses Close');
const tabs = await page.evaluate(
  () => document.querySelectorAll('.usa-nav a[href], .usa-nav button, .usa-nav input:not([type=hidden])').length,
);
for (let i = 0; i < tabs; i++) await page.keyboard.press('Tab');
check(
  await page.evaluate(() => document.querySelector('.usa-nav').contains(document.activeElement)),
  'Tab focus stays inside the open menu',
);
await page.keyboard.press('Escape');
await page.waitForSelector('.usa-nav:not(.is-visible)');
check((await page.evaluate(() => document.activeElement.className)) === 'usa-menu-btn', 'Escape closes menu and returns focus to Menu');

console.log('Route change focus');
await open('/', 'desktop');
await page.click('.usa-nav__secondary-links a[href="/contact"]');
await page.waitForSelector('#full-name');
await new Promise((r) => setTimeout(r, 100));
check((await activeId()) === 'main-content', 'client-side navigation focuses #main-content');
check((await page.title()).startsWith('Contact USAGov'), 'route sets the document title');

console.log('Contact form');
await open('/contact', 'desktop');
check(!(await page.$('.usa-error-message')), 'no errors before the first submit');
// Scoped: `button[type=submit]` also matches the header search button (test bug that
// navigated away to search.usa.gov and hung the run).
await page.click('form.usa-form button[type=submit]');
await page.waitForSelector('.usa-alert--error');
await new Promise((r) => setTimeout(r, 100)); // focus moves in afterNextRender, a tick after the element exists
check((await page.evaluate(() => document.activeElement.classList.contains('usa-alert--error'))), 'failed submit focuses the error summary');
check((await page.$$eval('.usa-alert--error li a', (a) => a.length)) === 4, 'summary lists 4 errors');
check((await page.$$eval('[aria-invalid="true"]', (els) => els.length)) === 4, '4 fields marked aria-invalid');
const described = await page.$eval('#email', (el) => el.getAttribute('aria-describedby'));
check(described === 'email-error email-hint', 'email aria-describedby links error + hint', described);
await page.click('.usa-alert--error li a[href="#email"]');
check((await activeId()) === 'email', 'summary link moves focus to its field');

await page.type('#full-name', 'Pat Example');
await page.type('#email', 'pat@example.com');
await page.select('#topic', 'website');
await page.$eval('#message', (el) => {
  el.value = 'x'.repeat(501);
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
// Signals update synchronously but the zoneless template renders a tick later.
const status = async () => {
  await new Promise((r) => setTimeout(r, 150));
  return page.$eval('.usa-character-count__status', (el) => ({ text: el.textContent.trim(), invalid: el.classList.contains('usa-character-count__status--invalid') }));
};
check(JSON.stringify(await status()) === '{"text":"1 character over limit","invalid":true}', 'character count shows over-limit state');
await new Promise((r) => setTimeout(r, 1300)); // 1s screen-reader debounce + render
check((await page.$eval('.usa-character-count__sr-status', (el) => el.textContent.trim())) === '1 character over limit', 'screen reader status updates after debounce');
check((await page.$$eval('.usa-alert--error li a', (a) => a.length)) === 1, 'summary updates to the remaining error');
await page.focus('#message');
await page.keyboard.press('End');
await page.keyboard.press('Backspace');
check((await status()).text === '0 characters left', 'character count clears the over-limit state at the limit');
await page.click('form.usa-form button[type=submit]');
await page.waitForSelector('.usa-alert--success');
await new Promise((r) => setTimeout(r, 100));
check((await page.evaluate(() => document.activeElement.classList.contains('usa-alert--success'))), 'valid submit focuses the success alert');
check((await page.$eval('#full-name', (el) => el.value)) === '', 'form is cleared (nothing retained)');
check(!(await page.$('.usa-alert--error')), 'error summary removed after success');

await browser.close();
console.log(failures.length ? `\n✖ ${failures.length} check(s) failed` : '\n✔ all checks passed');
process.exit(failures.length ? 1 : 0);
