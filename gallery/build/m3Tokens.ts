import type { Plugin } from 'vite';

import { M3_BASELINE_SEED, m3SchemeFromSeed } from '../../src-admin/src/m3scheme';

const HEX = /^#[0-9a-f]{6}$/i;

const block = (selector: string, roles: Record<string, string>): string => {
    const body = Object.entries(roles).map(([role, value]) => {
        if (!HEX.test(value)) throw new Error(`invalid color for ${role}: ${value}`);
        return `--md-sys-color-${role}:${value}`;
    }).join(';');
    return `${selector}{${body}}`;
};

export function m3CssVariables(scheme: { light: Record<string, string>; dark: Record<string, string> }): string {
    return block(':root', scheme.light) + block("[data-theme='dark']", scheme.dark);
}

export function m3TokensPlugin(): Plugin {
    return {
        name: 'gallery-m3-tokens',
        transformIndexHtml: () => [{ tag: 'style', attrs: { id: 'm3-tokens' }, children: m3CssVariables(m3SchemeFromSeed(M3_BASELINE_SEED)!), injectTo: 'head-prepend' }],
    };
}
