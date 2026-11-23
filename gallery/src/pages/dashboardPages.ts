import { DEMO_PREFIX } from '../runtime/scenario';

// The Top App Bar of every tablet view lists these views in this order (menuId0..3) and writes the index to PAGE_OID.
export const TABLET_PAGES = ['dashboard-tablet', 'dashboard-tablet-lights', 'dashboard-tablet-climate', 'dashboard-tablet-energy'];
export const PAGE_OID = `${DEMO_PREFIX}dashboard.page`;

export function pageForIndex(value: unknown): string | undefined {
    const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
    return Number.isInteger(n) ? TABLET_PAGES[n] : undefined;
}

export function indexForPage(view: string): number {
    return TABLET_PAGES.indexOf(view);
}
