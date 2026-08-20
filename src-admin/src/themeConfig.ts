import colors from '../../admin/lib/colors.json';
import colorsDark from '../../admin/lib/colorsDark.json';
import defaultcolors from '../../admin/lib/defaultcolors.json';
import defaultcolorsDark from '../../admin/lib/defaultcolorsDark.json';
import defaultfontSizes from '../../admin/lib/defaultfontSizes.json';
import defaultfonts from '../../admin/lib/defaultfonts.json';
import fontSizes from '../../admin/lib/fontSizes.json';
import fonts from '../../admin/lib/fonts.json';

// Split out of main.tsx so it can be tested: main.tsx calls createRoot() at import time, so nothing
// that lives in it is reachable from a test at all. Only the pure config reading moved — the React
// tree, the socket writes and the script generator stay where they are.
export type ThemeName = 'colors' | 'colorsDark' | 'fonts' | 'fontSizes';
export type ThemeEntry = { id: string; desc: string; widget: string; defaultValue?: number; value?: string | number };
export type NativeConfig = Record<string, unknown> & { scriptName?: string; variableName?: string; javascriptInstance?: string; sentryReport?: boolean };
export type ThemeDefinition = { entries: ThemeEntry[]; defaults: Array<string | number>; title: string; widgetTitle: string };

export const THEME_NAMES: ThemeName[] = ['colors', 'colorsDark', 'fonts', 'fontSizes'];

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

// The admin writes each entry under `<namespace>.colors.<entry.id>` (both colour lists) or
// `<namespace>.<theme>.<entry.id>`, and every intermediate level needs a channel object — a missing
// one is what the community bot's live-instance dump check rejects, and nothing local sees it.
export function themeStateId(namespace: string, theme: ThemeName, id: string): string {
    return theme.startsWith('colors') ? `${namespace}.colors.${id}` : `${namespace}.${theme}.${id}`;
}

export function defaultSlotId(namespace: string, theme: ThemeName, index: number): string {
    if (theme === 'colors') return `${namespace}.colors.light.default_${index}`;
    if (theme === 'colorsDark') return `${namespace}.colors.dark.default_${index}`;
    return `${namespace}.${theme}.default_${index}`;
}

export function ancestorChannels(id: string, namespace: string): string[] {
    const parts = id.substring(namespace.length + 1).split('.');
    parts.pop(); // the leaf state itself doesn't need a channel
    const channels: string[] = [];
    let current = namespace;
    for (const part of parts) {
        current = `${current}.${part}`;
        channels.push(current);
    }
    return channels;
}

// role "value" is restricted to type "number" by the ioBroker role catalogue; colour hex codes and
// font names are strings, so they need the generic "text" role.
export function themeStateCommon(value: string | number): { type: 'number' | 'string'; role: 'value' | 'text' } {
    return typeof value === 'number' ? { type: 'number', role: 'value' } : { type: 'string', role: 'text' };
}
