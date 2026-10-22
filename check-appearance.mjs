import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ colorScheme: 'light', serviceWorkers: 'block' });
// Serve the compiled files through interception for offline visual verification.
await context.route('http://voxtexto.test/**', async route => {
  const url = new URL(route.request().url());
  let name = decodeURIComponent(url.pathname);
  if (name.endsWith('/')) name += 'index.html';
  const ext = path.extname(name);
  const mime = {'.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.woff':'font/woff', '.png':'image/png', '.webmanifest':'application/manifest+json'}[ext] || 'application/octet-stream';
  try { await route.fulfill({ body: await readFile(path.join(root, 'build', name)), contentType: mime }); }
  catch { await route.fulfill({ status:404, body:'Missing resource' }); }
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto('http://voxtexto.test/');
await page.evaluate(() => document.fonts.ready);
assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
for (const width of [320,360,390,768,1053,1440]) {
  await page.setViewportSize({ width, height:1000 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Public overflow at ${width}`);
}
await page.setViewportSize({width:1440,height:1050});
const before = await page.locator('.hero').boundingBox();
await page.getByRole('button', {name:'Cambiar modo claro u oscuro'}).click();
assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
assert.deepEqual(await page.locator('.hero').boundingBox(), before);
await mkdir(path.join(root,'docs'), {recursive:true});
await page.screenshot({path:path.join(root,'docs/portada-modo-oscuro.png')});
await page.reload();
assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
await page.goto('http://voxtexto.test/como-funciona/');
assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
await page.goto('http://voxtexto.test/app/');
await page.getByRole('button', {name:'Cambiar modo claro u oscuro'}).waitFor();
assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
await page.screenshot({path:path.join(root,'docs/editor-modo-oscuro.png')});
for (const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:1000});
  if (!await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)) console.log(await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => [e.outerHTML.slice(0,450), e.getBoundingClientRect().right]).slice(0,25)));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `App overflow at ${width}`);
  assert.ok(await page.getByRole('button', {name:'Cambiar modo claro u oscuro'}).isVisible());
}
await page.getByRole('button', {name:'Cambiar modo claro u oscuro'}).click();
assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
await page.goto('http://voxtexto.test/');
await page.setViewportSize({width:1440,height:1050});
await page.screenshot({path:path.join(root,'docs/portada-hostinger.png')});
await page.evaluate(() => localStorage.removeItem('voxtexto-theme'));
await page.emulateMedia({colorScheme:'dark'});
await page.reload();
assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
await page.emulateMedia({colorScheme:'light'});
await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
await page.setViewportSize({width:390,height:844});
await page.getByRole('button', {name:'Cambiar modo claro u oscuro'}).click();
await page.screenshot({path:path.join(root,'docs/portada-movil-oscuro.png'),fullPage:true});
await page.getByRole('button', {name:'Cambiar modo claro u oscuro'}).click();
await page.screenshot({path:path.join(root,'docs/portada-movil.png'),fullPage:true});
await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('Storage blocked'); }; Storage.prototype.setItem = () => { throw new Error('Storage blocked'); }; });
await page.reload();
await page.getByRole('button', {name:'Cambiar modo claro u oscuro'}).click();
assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
assert.deepEqual(errors, []);
await browser.close();
console.log('Verified: theme toggle, persistence, system preference, storage unavailable, shared public/editor preference, unchanged geometry and widths 320–1440.');


