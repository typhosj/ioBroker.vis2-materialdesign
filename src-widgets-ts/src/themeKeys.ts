// Imported by the admin as well (project migration), so it must stay free of React and vis-2 code.
import colors from '../../admin/lib/colors.json';
import fonts from '../../admin/lib/fonts.json';
import fontSizes from '../../admin/lib/fontSizes.json';

export type ThemeType = 'colors' | 'fonts' | 'fontSizes';
export type ThemeEntry = { id: string; desc: string; widget: string };

const themeLists: Record<ThemeType, ThemeEntry[]> = { colors, fonts, fontSizes };
// visName -> the name the theme lists file the entry under, where the two drifted apart.
export const themeNameAliases: Record<string, string> = {
    Icon: 'Material Design Icon',
};

export const DEFAULT_DARK_THEME_OID = 'vis2-materialdesign.0.colors.darkTheme';

export function themeEntries(widgetName: string): Array<{ type: ThemeType; entry: ThemeEntry }> {
    const name = themeNameAliases[widgetName] || widgetName;
    return (Object.keys(themeLists) as ThemeType[]).flatMap(type => themeLists[type]
        .filter(entry => entry.widget.split(', ').includes(name))
        .map(entry => ({ type, entry })));
}

export function cssVariable(type: ThemeType, id: string): string {
    const normalized = id.replace(/^light\.|^dark\./, '').replace(/\./g, '-').replace(/_/g, '-');
    if (type === 'colors') return `--materialdesign-widget-theme-color-${normalized}`;
    if (type === 'fonts') return `--materialdesign-widget-theme-font-${normalized}`;
    return `--materialdesign-widget-theme-font-size-${normalized}`;
}

// Instance `.0` is hard-coded because io-package sets `common.singleton: true` — there can only be
// one. If that flag ever goes, this (and the admin's namespace) has to become the real instance.
export function themeStateId(type: ThemeType, id: string, dark = false): string {
    if (type === 'colors') return `vis2-materialdesign.0.colors.${dark ? id.replace(/^light\./, 'dark.') : id}`;
    return `vis2-materialdesign.0.${type}.${id}`;
}

export function encodeThemeId(id: string): string {
    return id.replace(/_/g, '_u_').replace(/\./g, '_d_');
}

export function decodeThemeId(id: string): string {
    return id.replace(/_d_/g, '.').replace(/_u_/g, '_');
}

// The data keys of a widget's hidden theme fields with their defaults, in declaration order. The
// index in a key is the entry's position in themeEntries(), so the order is part of the key name.
export function themeKeyDefaults(widgetName: string): Record<string, string> {
    const keys: Record<string, string> = { __mdwThemeDark: DEFAULT_DARK_THEME_OID };
    themeEntries(widgetName).forEach(({ type, entry }, index) => {
        const name = `__mdwTheme_${type}_${encodeThemeId(entry.id)}_${index}`;
        keys[name] = themeStateId(type, entry.id);
        if (type === 'colors') keys[`${name}_dark`] = themeStateId(type, entry.id, true);
    });
    return keys;
}
