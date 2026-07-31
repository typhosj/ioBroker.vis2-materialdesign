// Pure config/object-tree logic of the Theme Editor, split out of main.tsx so it can be tested:
// main.tsx renders into the DOM at import time, and this is the half whose mistakes are expensive —
// a wrong role/type pairing or a missing intermediate channel only surfaces in the community bot's
// live-instance object dump, after the release.
import colors from '../../admin/lib/colors.json';
import colorsDark from '../../admin/lib/colorsDark.json';
import defaultcolors from '../../admin/lib/defaultcolors.json';
import defaultcolorsDark from '../../admin/lib/defaultcolorsDark.json';
import defaultfontSizes from '../../admin/lib/defaultfontSizes.json';
import defaultfonts from '../../admin/lib/defaultfonts.json';
import fontSizes from '../../admin/lib/fontSizes.json';
import fonts from '../../admin/lib/fonts.json';

export type ThemeName = 'colors' | 'colorsDark' | 'fonts' | 'fontSizes';
export type ThemeEntry = { id: string; desc: string; widget: string; defaultValue?: number; value?: string | number };
export type NativeConfig = Record<string, unknown> & { scriptName?: string; variableName?: string; javascriptInstance?: string; sentryReport?: boolean };
export type ThemeDefinition = { entries: ThemeEntry[]; defaults: Array<string | number>; title: string; widgetTitle: string };

export const THEME_NAMES: readonly ThemeName[] = ['colors', 'colorsDark', 'fonts', 'fontSizes'];

export const themeDefinitions: Record<ThemeName, ThemeDefinition> = {
    colors: { entries: colors, defaults: defaultcolors, title: 'default light colors', widgetTitle: 'Widget colors' },
    colorsDark: { entries: colorsDark, defaults: defaultcolorsDark, title: 'default dark colors', widgetTitle: 'Widget colors' },
    fonts: { entries: fonts, defaults: defaultfonts, title: 'config_fonts', widgetTitle: 'Widget fonts' },
    fontSizes: { entries: fontSizes, defaults: defaultfontSizes, title: 'config_fontSizes', widgetTitle: 'Widget font sizes' },
};

export function defaultsKey(theme: ThemeName): string {
    return `default${theme}`;
}

export function readDefaults(config: NativeConfig, theme: ThemeName): Array<string | number> {
    const fallback = themeDefinitions[theme].defaults;
    const saved = config[defaultsKey(theme)];
    const values = !Array.isArray(saved) ? [...fallback] : fallback.map((value, index) => saved[index] ?? value) as Array<string | number>;
    // fontSizes must stay numeric even if an older config (or state) left a numeric string behind.
    return theme === 'fontSizes' ? values.map(value => Number(value)) : values;
}

export function readEntries(config: NativeConfig, theme: ThemeName, defaults: Array<string | number>): ThemeEntry[] {
    const saved = Array.isArray(config[theme]) ? config[theme] as ThemeEntry[] : [];
    return themeDefinitions[theme].entries.map(entry => {
        const old = saved.find(candidate => candidate.id === entry.id);
        const rawDefault = old?.defaultValue as unknown;
        const savedDefault = rawDefault === '' ? Number.NaN : Number(rawDefault);
        const defaultValue = Number.isInteger(savedDefault) && savedDefault >= 0 && savedDefault < defaults.length ? savedDefault : old ? undefined : entry.defaultValue;
        const value = old?.value ?? entry.value ?? defaults[defaultValue ?? 0];
        return { ...entry, ...old, defaultValue, value: theme === 'fontSizes' ? Number(value) : value };
    });
}

/**
 * Object id of one theme state. Light and dark colors share the `colors` branch — the split is
 * carried by the entry id itself, which starts with `light.` or `dark.`. The widget runtime relies
 * on that: it only knows the light list and derives the dark id by swapping the prefix
 * (`widgetUtils.tsx` `themeStateId`), so a dark entry carrying a `light.` prefix would write its
 * value over the light state and leave the dark one missing.
 */
export function themeStateId(namespace: string, theme: ThemeName, leaf: string): string {
    return theme.startsWith('colors') ? `${namespace}.colors.${leaf}` : `${namespace}.${theme}.${leaf}`;
}

export function defaultSlotId(namespace: string, theme: ThemeName, index: number): string {
    if (theme === 'colors') return `${namespace}.colors.light.default_${index}`;
    if (theme === 'colorsDark') return `${namespace}.colors.dark.default_${index}`;
    return `${namespace}.${theme}.default_${index}`;
}

/** Every intermediate channel id between `namespace` and the leaf state, outermost first. */
export function ancestorChannels(id: string, namespace: string): string[] {
    const parts = id.substring(namespace.length + 1).split('.');
    parts.pop(); // the leaf state itself doesn't need a channel
    const out: string[] = [];
    let current = namespace;
    for (const part of parts) {
        current = `${current}.${part}`;
        out.push(current);
    }
    return out;
}

/**
 * `common.type`/`common.role` for a theme value. Role "value" is restricted to type "number" by the
 * ioBroker role catalogue; color hex codes and font names are strings and need the generic "text".
 */
export function themeStateCommon(value: string | number): { type: 'number' | 'string'; role: 'value' | 'text' } {
    return typeof value === 'number' ? { type: 'number', role: 'value' } : { type: 'string', role: 'text' };
}
