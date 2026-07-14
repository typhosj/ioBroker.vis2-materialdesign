import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import '@fontsource/jura/files/jura-latin-400-normal.woff2';
import '@fontsource/roboto-condensed/files/roboto-condensed-latin-400-normal.woff2';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';
import colors from '../../admin/lib/colors.json';
import fonts from '../../admin/lib/fonts.json';
import fontSizes from '../../admin/lib/fontSizes.json';
import translations from './translations';
import '../../fonts.css';

// VIS 2 resolves widget-attribute GROUP headers via the legacy `window.vis._` / `window.systemDictionary`,
// which the component i18n does NOT populate — so custom groups (e.g. `group_theme`) render as raw keys.
// Bridge our `group_*` labels into that legacy dictionary once on load.
(function registerGroupLabels(): void {
    const win = window as unknown as { systemDictionary?: Record<string, Record<string, string>> };
    const sd = (win.systemDictionary ||= {});
    (Object.keys(translations) as Array<keyof typeof translations>).forEach(lang => {
        const words = translations[lang] as Record<string, string>;
        Object.keys(words).forEach(key => {
            if (!key.startsWith('group_')) return;
            (sd[key] ||= {})[lang as string] = words[key];
        });
    });
})();

export interface BaseRxData {
    oid: string;
    label: string;
    prefix: string;
    suffix: string;
    color: string;
    size: string;
    icon: string;
    value: string;
}

export interface PressState {
    active?: boolean;
    hovered?: boolean;
}

export const setColor = '#ffc107';

export const commonAttrs = [
    {
        name: 'common',
        label: 'group_common',
        fields: [
            {
                name: 'oid',
                label: 'oid',
                type: 'id',
            },
            {
                name: 'label',
                label: 'label',
                type: 'text',
                default: '',
            },
        ],
    },
];

export const valueTextAttrs = [
    ...commonAttrs,
    {
        name: 'text',
        fields: [
            {
                name: 'prefix',
                label: 'prefix',
                type: 'text',
                default: '',
            },
            {
                name: 'suffix',
                label: 'suffix',
                type: 'text',
                default: '',
            },
        ],
    },
];

export function stateValue(state: VisRxWidgetState, oid: string): ioBroker.StateValue | undefined {
    return oid ? state.values?.[`${oid}.val`] : undefined;
}

export function setStateValue(props: VisRxWidgetProps, oid: string, value: ioBroker.StateValue): void {
    const context = (props as unknown as { context?: { setValue?: (id: string, value: ioBroker.StateValue) => void } }).context;
    if (oid && context?.setValue) {
        context.setValue(oid, value);
    }
}

export function parseActionValue(value: string): ioBroker.StateValue {
    if (value === 'true') {
        return true;
    }
    if (value === 'false') {
        return false;
    }
    if (value !== '' && !Number.isNaN(Number(value))) {
        return Number(value);
    }
    return value;
}

export function card(children: React.ReactNode): React.JSX.Element {
    return <div style={{ boxSizing: 'border-box', width: '100%', height: '100%', padding: 8 }}>{children}</div>;
}

export function createInfo(id: string, name: string, attrs: RxWidgetInfo['visAttrs']): RxWidgetInfo {
    return {
        id,
        visSet: 'vis2-materialdesign',
        visSetLabel: 'Material Design',
        visSetColor: setColor,
        visName: name,
        visAttrs: [
            {
                name: 'theme',
                fields: themeFields(name),
            },
            ...attrs,
        ],
    };
}

type ThemeEntry = { id: string; desc: string; widget: string };
type ThemeType = 'colors' | 'fonts' | 'fontSizes';

const themeLists: Record<ThemeType, ThemeEntry[]> = { colors, fonts, fontSizes };
const themeNameAliases: Record<string, string> = {
    Button: 'Buttons',
    'HTML Card': 'HTML Card',
    'Preview Color Schemes': 'Color Scheme Preview',
};

function themeEntries(widgetName: string): Array<{ type: ThemeType; entry: ThemeEntry }> {
    const name = themeNameAliases[widgetName] || widgetName;
    return (Object.keys(themeLists) as ThemeType[]).flatMap(type => themeLists[type]
        .filter(entry => entry.widget.split(', ').includes(name))
        .map(entry => ({ type, entry })));
}

function cssVariable(type: ThemeType, id: string): string {
    const normalized = id.replace(/^light\.|^dark\./, '').replace(/\./g, '-').replace(/_/g, '-');
    if (type === 'colors') return `--materialdesign-widget-theme-color-${normalized}`;
    if (type === 'fonts') return `--materialdesign-widget-theme-font-${normalized}`;
    return `--materialdesign-widget-theme-font-size-${normalized}`;
}

function themeStateId(type: ThemeType, id: string, dark = false): string {
    if (type === 'colors') return `vis2-materialdesign.0.colors.${dark ? id.replace(/^light\./, 'dark.') : id}`;
    return `vis2-materialdesign.0.${type}.${id}`;
}

function UseThemeButton(props: { entries: Array<{ type: ThemeType; entry: ThemeEntry }>; data: Record<string, unknown>; onDataChange: (data: Record<string, unknown>) => void }): React.JSX.Element {
    const [open, setOpen] = React.useState(false);
    const apply = (): void => {
        const next = { ...props.data };
        props.entries.forEach(({ type, entry }) => {
            const value = `var(${cssVariable(type, entry.id)})`;
            next[entry.desc] = value;
            Object.keys(next).filter(key => new RegExp(`^${entry.desc}\\d+$`).test(key)).forEach(key => { next[key] = value; });
        });
        props.onDataChange(next);
        setOpen(false);
    };
    return <><Button size="small" variant="outlined" onClick={() => setOpen(true)}>{VisWidget.t('useTheme')}</Button><Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth><DialogTitle>{VisWidget.t('useTheme')}</DialogTitle><DialogContent><DialogContentText>{VisWidget.t('all colors, fonts and font sizes of the widget will be overridden - do you want to continue?')}</DialogContentText></DialogContent><DialogActions><Button onClick={() => setOpen(false)}>{VisWidget.t('cancel')}</Button><Button variant="contained" onClick={apply} autoFocus>{VisWidget.t('ok')}</Button></DialogActions></Dialog></>;
}

function encodeThemeId(id: string): string {
    return id.replace(/_/g, '_u_').replace(/\./g, '_d_');
}

function decodeThemeId(id: string): string {
    return id.replace(/_d_/g, '.').replace(/_u_/g, '_');
}

function themeFields(widgetName: string): RxWidgetInfo['visAttrs'][number]['fields'] {
    const entries = themeEntries(widgetName);
    return [
        {
            type: 'custom',
            name: 'useTheme',
            label: 'useTheme',
            component: (_field, data, onDataChange) => <UseThemeButton entries={entries} data={data as Record<string, unknown>} onDataChange={onDataChange as (data: Record<string, unknown>) => void} />,
        },
        {
            name: '__mdwThemeDark',
            type: 'id',
            default: 'vis2-materialdesign.0.colors.darkTheme',
            hidden: () => true,
        },
        ...entries.flatMap(({ type, entry }, index) => {
            const name = `__mdwTheme_${type}_${encodeThemeId(entry.id)}_${index}`;
            return type === 'colors'
                ? [{ name, type: 'id' as const, default: themeStateId(type, entry.id), hidden: () => true }, { name: `${name}_dark`, type: 'id' as const, default: themeStateId(type, entry.id, true), hidden: () => true }]
                : [{ name, type: 'id' as const, default: themeStateId(type, entry.id), hidden: () => true }];
        }),
    ];
}

export function applyThemeVariables(data: Record<string, unknown>, values: Record<string, ioBroker.StateValue> | undefined): void {
    if (!values) return;
    const dark = data.__mdwThemeDark;
    const isDark = values[`${dark}.val`] === true || values[`${dark}.val`] === 'true';
    Object.keys(data).filter(key => key.startsWith('__mdwTheme_') && !key.endsWith('_dark')).forEach(key => {
        const stateId = data[isDark && data[`${key}_dark`] ? `${key}_dark` : key];
        const value = typeof stateId === 'string' ? values[`${stateId}.val`] : undefined;
        const parts = key.match(/^__mdwTheme_(colors|fonts|fontSizes)_(.+)_\d+$/);
        if (!parts) return;
        const variable = cssVariable(parts[1] as ThemeType, decodeThemeId(parts[2]));
        if (value !== undefined && value !== null) document.documentElement.style.setProperty(variable, String(value));
    });
}

const BaseVisWidget = window.visRxWidget as typeof VisRxWidget<BaseRxData, VisRxWidgetState>;

export class VisWidget extends BaseVisWidget {
    render(): React.JSX.Element | null {
        applyThemeVariables(this.state.rxData as unknown as Record<string, unknown>, this.state.values);
        return super.render();
    }
}

export type RenderProps = RxRenderWidgetProps;
