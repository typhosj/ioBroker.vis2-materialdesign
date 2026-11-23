import { type Lang, loadLanguage, parseLang } from './runtime/i18n';
import type { GalleryRuntime } from './runtime/runtime';

export type Theme = 'light' | 'dark';
export type Style = 'legacy' | 'material3';
export type Viewport = 'phone' | 'tablet' | 'desktop' | 'fit';

export const VIEWPORTS: Record<Exclude<Viewport, 'fit'>, { width: number; height: number }> = {
    phone: { width: 390, height: 844 },
    tablet: { width: 1920, height: 1200 },
    desktop: { width: 1920, height: 1080 },
};

export interface GalleryQuery { theme: Theme; style: Style; lang: Lang; vp: Viewport; test: boolean; variant?: string; seed?: string }
export interface Route { path: string[]; query: GalleryQuery }

export const DEFAULT_QUERY: GalleryQuery = { theme: 'light', style: 'material3', lang: 'en', vp: 'desktop', test: false };

const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);
const SLUG = /^[\w.-]{1,64}$/;
const SEED = /^#[0-9a-f]{6}$/i;

export function parseRoute(hash: string): Route {
    const [pathPart, queryPart = ''] = hash.replace(/^#\/?/, '').split('?');
    const params = new URLSearchParams(queryPart);
    const variant = params.get('variant');
    const seed = params.get('seed');
    const query: GalleryQuery = {
        theme: pick(params.get('theme'), ['light', 'dark'] as const, DEFAULT_QUERY.theme),
        style: pick(params.get('style'), ['legacy', 'material3'] as const, DEFAULT_QUERY.style),
        lang: parseLang(params.get('lang')),
        vp: pick(params.get('vp'), ['phone', 'tablet', 'desktop', 'fit'] as const, DEFAULT_QUERY.vp),
        test: params.get('test') === '1',
    };
    if (variant && SLUG.test(variant)) query.variant = variant;
    if (seed && SEED.test(seed)) query.seed = seed.toLowerCase();
    return { path: pathPart.split('/').filter(Boolean), query };
}

export function routeHash(path: string[], query: Partial<GalleryQuery>): string {
    const params = new URLSearchParams();
    for (const key of ['theme', 'style', 'lang', 'vp'] as const) {
        if (query[key] !== undefined && query[key] !== DEFAULT_QUERY[key]) params.set(key, query[key]);
    }
    if (query.variant) params.set('variant', query.variant);
    if (query.seed) params.set('seed', query.seed);
    if (query.test) params.set('test', '1');
    const search = params.toString();
    return `#/${path.join('/')}${search ? `?${search}` : ''}`;
}

export async function applyQuery(runtime: GalleryRuntime, query: GalleryQuery, schemes: Record<string, string>): Promise<void> {
    runtime.store.setState('vis2-materialdesign.0.colors.darkTheme', query.theme, true);
    runtime.store.setState('vis2-materialdesign.0.designStyle', query.style, true);
    if (query.seed && schemes[query.seed]) runtime.store.setState('vis2-materialdesign.0.colors.md3Scheme', schemes[query.seed], true);
    const win = window as unknown as { systemLang?: string; vis?: { language?: string } };
    win.systemLang = query.lang;
    win.vis = { ...(win.vis ?? {}), language: query.lang };
    await loadLanguage(query.lang);
}
