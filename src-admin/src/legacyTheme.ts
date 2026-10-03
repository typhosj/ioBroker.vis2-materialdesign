import { THEME_NAMES, defaultsKey } from './themeConfig';

export const LEGACY_INSTANCE = 'system.adapter.vis-materialdesign.0';
export const LEGACY_DARK_STATE = 'vis-materialdesign.0.colors.darkTheme';

const KEYS = THEME_NAMES.flatMap(theme => [theme, defaultsKey(theme)]);

export function legacyThemeConfig(native: unknown): Record<string, unknown> {
    if (!native || typeof native !== 'object') return {};
    const source = native as Record<string, unknown>;
    return Object.fromEntries(KEYS.filter(key => Array.isArray(source[key])).map(key => [key, source[key]]));
}

export function legacyDarkTheme(value: unknown): boolean | null {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return null;
}

/** What the old instance has to take over, or null when it holds neither a theme list nor the dark switch. */
export function legacyTakeOver(native: unknown, darkValue: unknown): { config: Record<string, unknown>; dark: boolean | null } | null {
    const config = legacyThemeConfig(native);
    const dark = legacyDarkTheme(darkValue);
    return Object.keys(config).length || dark !== null ? { config, dark } : null;
}
