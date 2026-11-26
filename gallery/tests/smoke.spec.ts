import { expect, test, type Page } from '@playwright/test';

const ORIGIN = 'http://localhost:4173/';
// Thumbnails and clips come from gallery:media, which the smoke run does not execute; the start page carries no images.
const MEDIA = `${ORIGIN}media/`;

const watch = (page: Page): string[] => {
    const problems: string[] = [];
    page.on('console', message => { if (message.type() === 'error' && !message.location().url.startsWith(MEDIA)) problems.push(`console: ${message.text()} ${message.location().url}`); });
    page.on('pageerror', error => problems.push(`pageerror: ${error.message}`));
    page.on('requestfailed', request => problems.push(`failed: ${request.url()}`));
    page.on('request', request => { if (!request.url().startsWith(ORIGIN) && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) problems.push(`foreign: ${request.url()}`); });
    return problems;
};

// At the large window class the settings sheet is docked, so no scrim covers the stage; the data points sit on its second tab.
test.use({ viewport: { width: 1700, height: 900 } });
const openDataPoints = async (page: Page) => { const tab = page.getByRole('tab', { name: 'Data points' }); if (await tab.count()) await tab.click(); };
const frame = (page: Page) => page.frameLocator('iframe.g-frame');
const datapoint = (page: Page, id: string) => page.getByRole('textbox', { name: `0_userdata.0.demo.${id}`, exact: true });
// A hash change inside the open document keeps the gallery runtime, and with it the data point store.
const goHash = (page: Page, hash: string) => page.evaluate(h => { location.hash = h; }, hash);

const routes: string[] = [];

// A route counts as loaded once the widget (or the page chrome) is in the DOM and the network is quiet.
async function visit(page: Page, hash: string): Promise<void> {
    routes.push(hash);
    await page.goto('about:blank');
    await page.goto(`./${hash}${hash.includes('?') ? '&' : '?'}test=1`);
    if (hash.startsWith('#/widget/') || hash.startsWith('#/dashboard/')) await frame(page).locator('.vis-widget').first().waitFor({ state: 'attached' });
    else await page.locator('.g-app main > *').first().waitFor({ state: 'attached' });
    await page.waitForLoadState('networkidle');
    if (hash.startsWith('#/widget/')) await openDataPoints(page);
}

test('every route loads without errors or foreign requests', async ({ page }) => {
    test.setTimeout(20 * 60_000);
    const problems = watch(page);
    const check = async (hash: string): Promise<void> => {
        await visit(page, hash);
        if (problems.length) throw new Error(`${hash}\n${problems.join('\n')}`);
    };
    await check('#/');
    const widgetPages = await page.locator('.g-preview-card').evaluateAll(links => links.map(a => (a as HTMLAnchorElement).hash.split('?')[0]).filter(hash => hash.startsWith('#/widget/')));
    expect(widgetPages.length).toBe(50);
    for (const widgetPage of widgetPages) {
        await check(widgetPage);
        const variants = await page.locator('[role="radiogroup"] [role="radio"][data-id]').evaluateAll(chips => chips.map(chip => chip.getAttribute('data-id') ?? ''));
        for (const variant of variants.slice(1)) await check(`${widgetPage}?variant=${encodeURIComponent(variant)}`);
    }
    for (const hash of ['#/dashboard/tablet', '#/dashboard/phone', '#/about', '#/lab']) await check(hash);
    console.log(`routes visited: ${routes.length}`);
});

test('no cookies are set', async ({ page, context }) => {
    await visit(page, '#/widget/Switch');
    expect(await context.cookies()).toEqual([]);
});

// The first variant of a page is its typical example, which may bind no demo data point, so the cases below pick a variant that does.
const read = (page: Page, id: string) => datapoint(page, id).inputValue();

test('operating a widget changes its state and the data point', async ({ page }) => {
    await visit(page, '#/widget/Switch?variant=switch-off');
    const before = await read(page, 'kitchen.light');
    await frame(page).locator('.vis-widget').first().click();
    await expect(datapoint(page, 'kitchen.light')).not.toHaveValue(before);
});

test('Checkbox writes its data point', async ({ page }) => {
    await visit(page, '#/widget/Checkbox?variant=checkbox-off');
    const before = await read(page, 'kitchen.light');
    await frame(page).locator('.vis-widget').first().click();
    await expect(datapoint(page, 'kitchen.light')).not.toHaveValue(before);
});

test('Slider writes its data point on a key press', async ({ page }) => {
    await visit(page, '#/widget/Slider');
    const before = await read(page, 'living.dimmer');
    await frame(page).locator('[role="slider"]').first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(datapoint(page, 'living.dimmer')).not.toHaveValue(before);
});

test('Round Slider writes its data point on a key press', async ({ page }) => {
    await visit(page, '#/widget/Slider%20Round');
    const before = await read(page, 'climate.setpoint');
    await frame(page).locator('[role="slider"]').first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(datapoint(page, 'climate.setpoint')).not.toHaveValue(before);
});

test('Select writes the chosen option to its data point', async ({ page }) => {
    await visit(page, '#/widget/Select');
    await frame(page).locator('.vis-widget button').first().click();
    await frame(page).locator('.v-list-item', { hasText: 'Night' }).click();
    await expect(datapoint(page, 'general.scene')).toHaveValue('night');
});

test('Button State Multi writes its data point', async ({ page }) => {
    await visit(page, '#/widget/Button%20State%20Multi');
    const before = await read(page, 'living.light');
    await frame(page).locator('.vis-widget button').first().click();
    await expect(datapoint(page, 'living.light')).not.toHaveValue(before);
});

test('closing an alert removes it from the data point', async ({ page }) => {
    await visit(page, '#/widget/Alerts?variant=normal');
    const before = JSON.parse(await read(page, 'notifications.alerts')) as unknown[];
    await frame(page).getByRole('button', { name: 'Close alert' }).first().click();
    await expect.poll(async () => (JSON.parse(await read(page, 'notifications.alerts')) as unknown[]).length).toBe(before.length - 1);
});

for (const [name, query, action] of [
    ['Button Toggle', '', 'click'], ['Icon Button Toggle', '', 'click'], ['Slider Round', '', 'key'],
    ['Input', '', 'type'], ['Dialog', '', 'click'],
] as const) {
    test(`${name} reacts visibly`, async ({ page }) => {
        await visit(page, `#/widget/${encodeURIComponent(name)}${query}`);
        const widget = frame(page).locator('.vis-widget').first();
        const before = await widget.innerHTML();
        if (action === 'click') await widget.click();
        else if (action === 'type') { await widget.locator('input').fill('demo'); await widget.locator('input').press('Enter'); }
        else { await widget.locator('[role="slider"]').first().focus(); await page.keyboard.press('ArrowRight'); }
        await expect.poll(() => widget.innerHTML()).not.toBe(before);
    });
}

test('the dashboard shares the store with the gallery', async ({ page }) => {
    await visit(page, '#/widget/Checkbox?variant=checkbox-off');
    await datapoint(page, 'kitchen.light').fill('true');
    await datapoint(page, 'kitchen.light').blur();
    await goHash(page, '#/dashboard/tablet?test=1');
    await frame(page).locator('.vis-widget').first().waitFor({ state: 'attached' });
    await goHash(page, '#/widget/Checkbox?variant=checkbox-off&test=1');
    await page.getByRole('tab', { name: 'Data points' }).click();
    await expect(datapoint(page, 'kitchen.light')).toHaveValue('true');
});

for (const theme of ['light', 'dark']) {
    for (const [board, width] of [['tablet', 1920], ['phone', 390]] as const) {
        test(`overview and ${board} dashboard load in ${theme}`, async ({ page }) => {
            const problems = watch(page);
            await visit(page, `#/?theme=${theme}`);
            await visit(page, `#/dashboard/${board}?theme=${theme}`);
            expect(problems).toEqual([]);
            await expect(page.locator('iframe.g-frame')).toHaveAttribute('style', new RegExp(`width: ${width}px`));
        });
    }
}

for (const vp of ['phone', 'tablet', 'desktop']) {
    test(`a widget page frames the ${vp} viewport`, async ({ page }) => {
        await visit(page, `#/widget/Switch?vp=${vp}`);
        await expect(page.locator('iframe.g-frame')).toHaveAttribute('style', new RegExp(vp === 'phone' ? 'width: 390px' : 'width: 1920px'));
    });
}

test('a widget page without a viewport shows the widget at its example size', async ({ page }) => {
    await visit(page, '#/widget/Switch');
    await expect(page.locator('iframe.g-frame')).toHaveAttribute('style', /width: 100%/);
    const widget = await frame(page).locator('.vis-widget').first().boundingBox();
    expect(widget!.width).toBeGreaterThan(30);
    expect(widget!.width).toBeLessThan(400);
});

test('the variant chips are a radiogroup that switches the stage', async ({ page }) => {
    await visit(page, '#/widget/Switch');
    const chips = page.locator('[role="radiogroup"] [role="radio"][data-id]');
    expect(await chips.count()).toBeGreaterThan(1);
    const stage = frame(page).locator('.vis-widget').first();
    const before = await stage.innerHTML();
    const id = await chips.nth(1).getAttribute('data-id');
    await chips.nth(1).click();
    await expect.poll(() => page.url()).toContain(`variant=${id}`);
    await expect.poll(() => stage.innerHTML()).not.toBe(before);
});

test('a fixed-size widget is centred in the stage', async ({ page }) => {
    await visit(page, '#/widget/Switch?vp=desktop');
    const box = await frame(page).locator('.vis-widget').first().boundingBox();
    const body = await frame(page).locator('.g-frame-body').boundingBox();
    expect(box && body).toBeTruthy();
    expect(Math.abs(box!.x + box!.width / 2 - (body!.x + body!.width / 2))).toBeLessThan(2);
    expect(Math.abs(box!.y + box!.height / 2 - (body!.y + body!.height / 2))).toBeLessThan(2);
});

test.describe('medium window', () => {
    test.use({ viewport: { width: 1000, height: 800 } });
    test('the settings sheet is modal, closes on Escape and returns focus', async ({ page }) => {
        await visit(page, '#/widget/Switch');
        const button = page.getByRole('button', { name: 'Open settings', exact: true });
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await button.click();
        await expect(page.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(button).toBeFocused();
    });
});

const compactChecks = async (page: Page, hash: string, maxBar: number) => {
    await visit(page, hash);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${hash} overflows horizontally`).toBe(true);
    expect((await page.locator('.g-topbar').boundingBox())!.height).toBeLessThanOrEqual(maxBar);
    await expect(page.locator('h1')).toHaveCount(1);
};

test.describe('compact window', () => {
    test.use({ viewport: { width: 360, height: 740 } });
    for (const hash of ['#/', '#/widget/Switch', '#/family/charts', '#/dashboard/tablet', '#/dashboard/phone', '#/about']) {
        test(`${hash} has no horizontal scroll, a slim top bar and one h1`, async ({ page }) => { await compactChecks(page, hash, 72); });
    }
    test('the drawer holds theme, style and language, and the top bar does not', async ({ page }) => {
        await visit(page, '#/');
        await expect(page.locator('.g-topbar [role="group"]')).toHaveCount(0);
        await page.getByRole('button', { name: 'Open navigation' }).click();
        const drawer = page.getByRole('dialog', { name: 'Navigation' });
        await expect(drawer.getByRole('group')).toHaveCount(3);
        await expect(drawer.getByText('Display', { exact: true })).toBeVisible();
    });
    test('a start page preview is centred in its box and not clipped', async ({ page }) => {
        await visit(page, '#/');
        const inert = page.locator('.g-live-preview [inert]').first();
        await inert.waitFor({ state: 'attached' });
        await expect.poll(async () => (await inert.locator('.vis-widget').first().boundingBox())?.width ?? 0).toBeGreaterThan(0);
        const host = (await page.locator('.g-live-preview').first().boundingBox())!;
        const widget = (await inert.locator('.vis-widget').first().boundingBox())!;
        expect(widget.x).toBeGreaterThanOrEqual(host.x - 1);
        expect(widget.x + widget.width).toBeLessThanOrEqual(host.x + host.width + 1);
        expect(Math.abs(widget.x + widget.width / 2 - (host.x + host.width / 2))).toBeLessThan(2);
        expect(Math.abs(widget.y + widget.height / 2 - (host.y + host.height / 2))).toBeLessThan(2);
    });
});

test.describe('medium window top bar', () => {
    test.use({ viewport: { width: 1000, height: 800 } });
    test('stays one slim row', async ({ page }) => { await compactChecks(page, '#/widget/Switch', 72); });
});

test('the navigation drawer stays in view while the start page scrolls', async ({ page }) => {
    await visit(page, '#/');
    await page.mouse.move(900, 500);
    await page.mouse.wheel(0, 3000);
    const reset = page.getByRole('button', { name: 'Reset demo data' });
    await expect(reset).toBeInViewport();
});

const lastLinkClearOfFooter = async (page: Page) => {
    const link = page.locator('nav.g-drawer .g-drawer-item').last();
    // Scrolling to the nearest edge is what keyboard focus does for a link that is already partly visible.
    await link.evaluate(el => el.scrollIntoView({ block: 'nearest' }));
    await link.focus();
    await expect(link).toBeFocused();
    const linkBox = (await link.boundingBox())!;
    const footer = (await page.locator('.g-drawer-footer').boundingBox())!;
    expect(linkBox.y + linkBox.height, 'the focused link ends above the footer').toBeLessThanOrEqual(footer.y + 1);
};

test.describe('short windows', () => {
    test('the focused last link of the docked drawer is not under the sticky footer', async ({ page }) => {
        await page.setViewportSize({ width: 1300, height: 600 });
        await visit(page, '#/');
        await lastLinkClearOfFooter(page);
    });
    test('the focused last link of the modal drawer is not under the sticky footer', async ({ page }) => {
        await page.setViewportSize({ width: 360, height: 600 });
        await visit(page, '#/');
        await page.getByRole('button', { name: 'Open navigation' }).click();
        await lastLinkClearOfFooter(page);
    });
});

test('the start page transfers less than 2 MB', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    let bytes = 0;
    const pending: Promise<void>[] = [];
    page.on('response', response => { pending.push(response.body().then(body => { bytes += body.length; }, () => undefined)); });
    await page.goto('./');
    await page.waitForLoadState('networkidle');
    await Promise.all(pending);
    console.log(`start page bytes (uncompressed): ${bytes}`);
    expect(bytes).toBeLessThan(2 * 1024 * 1024);
});
