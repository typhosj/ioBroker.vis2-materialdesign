import { expect, test, type Page } from '@playwright/test';

import { PENDING_FAMILIES, VARIANT_EXCEPTIONS } from './variantExceptions';

const ORIGIN = 'http://localhost:4173/';
const FAMILIES = ['buttons', 'iconButtons', 'input', 'sliders', 'progress', 'values', 'lists', 'charts', 'calendar', 'views', 'navigation'];

// A fresh document per route, so the runtime starts from the scenario values every time.
async function open(page: Page, hash: string): Promise<void> {
    await page.goto('about:blank');
    await page.goto(`${ORIGIN}${hash}${hash.includes('?') ? '&' : '?'}test=1`);
}

test('every variant looks different from the first example in the same style', async ({ page }) => {
    test.setTimeout(30 * 60_000);
    await page.setViewportSize({ width: 1700, height: 900 });
    // Not setFixedTime: a frozen Date.now holds every chart animation at its first frame, where all
    // variants of a chart look alike.
    await page.clock.install({ time: new Date('2026-01-15T10:00:00+01:00') });
    const widgets: Array<{ name: string; family: string }> = [];
    for (const family of FAMILIES) {
        await open(page, `#/family/${family}`);
        await page.locator('.g-preview-card').first().waitFor();
        const names = await page.locator('.g-preview-card').evaluateAll(links => links.map(a => decodeURIComponent((a as HTMLAnchorElement).hash.split('?')[0].replace('#/widget/', ''))));
        widgets.push(...names.map(name => ({ name, family })));
    }
    expect(widgets.length).toBe(50);
    const problems: string[] = [];
    const pending: string[] = [];
    for (const { name, family } of widgets) {
        const route = `#/widget/${encodeURIComponent(name)}`;
        for (const style of ['legacy', 'material3'] as const) {
            await open(page, `${route}?style=${style}`);
            await page.locator('[role="radio"][data-id]').first().waitFor();
            const ids = await page.locator('[role="radio"][data-id]').evaluateAll(chips => chips.map(c => (c as HTMLElement).dataset.id!));
            const shot = async (id: string): Promise<Buffer> => {
                await open(page, `${route}?style=${style}&variant=${id}`);
                const frame = page.frameLocator('iframe.g-frame');
                await frame.locator('.vis-widget').first().waitFor({ state: 'attached' });
                await page.waitForLoadState('networkidle');
                await page.clock.runFor(3000);
                return frame.locator('.g-frame-body').screenshot({ animations: 'disabled' });
            };
            const first = await shot(ids[0]);
            for (const id of ids.slice(1)) {
                if (VARIANT_EXCEPTIONS[`${name}/${id}`]) continue;
                if (!(await shot(id)).equals(first)) continue;
                (PENDING_FAMILIES.has(family) ? pending : problems).push(`${family}: ${name}/${id} (${style}) looks like ${ids[0]}`);
            }
        }
    }
    if (pending.length) console.log(`known findings in families not yet reviewed (${pending.length}):\n${pending.join('\n')}`);
    expect(problems).toEqual([]);
});
