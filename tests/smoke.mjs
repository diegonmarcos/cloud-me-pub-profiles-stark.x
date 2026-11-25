// Smoke test (#1919): page loads, no console errors, a mouse drag and a touch drag rotate the 3D service cube.
// Usage: node tests/smoke.mjs <base-url>   (e.g. http://127.0.0.1:8080/ or https://diegonmarcos.github.io/leafy/)
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://127.0.0.1:8080/';
// Third-party analytics is not part of the page contract (CORS/blocked in CI): ignore it, nothing else.
const IGNORE = /analytics\.diegonmarcos\.com|cdn\.tailwindcss|fonts\.(googleapis|gstatic)|net::ERR_(NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|FAILED)/;
const fails = [];
const fail = (m) => { fails.push(m); console.error('FAIL', m); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1, hasTouch: true });
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text() + (m.location().url || ''))) errs.push('console: ' + m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('response', (r) => { if (r.status() >= 400 && !IGNORE.test(r.url())) errs.push('http ' + r.status() + ' ' + r.url()); });

await page.goto(base, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
const cube = page.locator('#services-cube');
if (await cube.count() !== 1) fail('#services-cube missing');
else {
  await cube.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const box = await cube.boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const hit = await page.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return !!e && !!e.closest('#services-cube'); }, [cx, cy]);
  if (!hit) fail('cube centre is covered by another element (drag cannot reach it)');
  const tf = () => cube.evaluate((e) => e.style.transform || getComputedStyle(e).transform);

  // mouse drag
  let before = await tf();
  await page.mouse.move(cx, cy); await page.mouse.down();
  await page.mouse.move(cx + 120, cy + 30, { steps: 8 });
  const dragging = await cube.evaluate((e) => e.classList.contains('dragging'));
  const during = await tf();
  await page.mouse.up();
  if (!dragging) fail('mouse: .dragging class never set (no drag handler bound)');
  if (during === before) fail('mouse drag did not change the cube rotation');

  // touch drag (CDP)
  const cdp = await ctx.newCDPSession(page);
  before = await tf();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
  for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + i * 15, y: cy + i * 4 }] });
  const tDragging = await cube.evaluate((e) => e.classList.contains('dragging'));
  const tDuring = await tf();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  if (!tDragging) fail('touch: .dragging class never set (no touch handler bound)');
  if (tDuring === before) fail('touch drag did not change the cube rotation');
}
for (const e of errs) fail(e);
await browser.close();
if (fails.length) { console.error(fails.length + ' smoke failure(s)'); process.exit(1); }
console.log('smoke OK: loads, no console errors, mouse+touch drag rotate the cube');
