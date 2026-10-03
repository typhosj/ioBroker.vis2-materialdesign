import { cssVariable, themeEntries, themeKeyDefaults } from '../../src-widgets-ts/src/themeKeys';
import renames from './mdiLegacyRenames.json';

export type Project = Record<string, unknown>;
export type MigrationReport = {
    widgets: number;
    byView: Record<string, number>;
    unknown: string[];
    warnings: string[];
};

const OLD_PREFIX = 'tplVis-materialdesign-';
const NEW_PREFIX = 'tplVis2-materialdesign-';
const WIDGET_SET = 'vis2-materialdesign';

const WIDGET_NAMES: Record<string, string> = {
    Alerts: 'Alerts',
    Autocomplete: 'Autocomplete',
    'Button-Adition': 'Button Addition',
    'Button-Adition-vertical': 'Button Addition vertical',
    'Button-Link': 'Button Link',
    'Button-Link-vertical': 'Button Link vertical',
    'Button-Navigation': 'Button Navigation',
    'Button-Navigation-vertical': 'Button Navigation vertical',
    'Button-State': 'Button State',
    'Button-State-Multi': 'Button State Multi',
    'Button-State-Multi-vertical': 'Button State Multi vertical',
    'Button-State-vertical': 'Button State vertical',
    'Button-Toggle': 'Button Toggle',
    'Button-Toggle-vertical': 'Button Toggle vertical',
    Calendar: 'Calendar',
    Card: 'HTML Card',
    'Chart-Bar': 'Bar Chart',
    'Chart-JSON': 'JSON Chart',
    'Chart-Line-History': 'Line History Chart',
    'Chart-Pie': 'Pie Chart',
    CheckBox: 'Checkbox',
    'ColorScheme-Preview': 'Preview Color Schemes',
    'Grid-Views': 'Grid Views',
    Icon: 'Icon',
    'Icon-Button-Adition': 'Icon Button Addition',
    'Icon-Button-Link': 'Icon Button Link',
    'Icon-Button-Navigation': 'Icon Button Navigation',
    'Icon-Button-Slider': 'Icon Button Slider',
    'Icon-Button-State': 'Icon Button State',
    'Icon-Button-State-Multi': 'Icon Button State Multi',
    'Icon-Button-Toggle': 'Icon Button Toggle',
    'Icon-List': 'Icon List',
    Input: 'Input',
    'Installed-Version': 'Installed Version',
    List: 'List',
    'Masonry-Views': 'Masonry Views',
    Progress: 'Progress',
    'Progress-Circular': 'Progress Circular',
    Select: 'Select',
    'Slider-Round': 'Slider Round',
    Switch: 'Switch',
    Table: 'Table',
    'TopAppBar-Navigation': 'Top App Bar',
    'Vuetify-Dialog-View': 'Dialog',
    'Vuetify-Dialog-iFrame': 'Dialog iFrame',
    'Vuetify-Slider': 'Slider',
    value: 'Value',
    'view-in-widget': 'Advanced View in Widget',
    'view-in-widget8': 'Advanced View in Widget 8',
};
export const LEGACY_TEMPLATES: readonly string[] = Object.keys(WIDGET_NAMES);
const KNOWN = new Set(LEGACY_TEMPLATES);
const RENAMED: Record<string, string> = { 'Vuetify-Slider': 'Slider' };

const RENAMED_ICONS: Record<string, string> = renames.renamed;
const REMOVED_ICONS = new Set<string>(renames.removed);

// The old runtime looped `i <= data.<field>` and so rendered field + 1 entries; ours renders field.
const COUNT_FIELDS: Record<string, string> = {
    'Button-State-Multi': 'countOids',
    'Button-State-Multi-vertical': 'countOids',
    'Icon-Button-State-Multi': 'countOids',
    Select: 'countSelectItems',
    Autocomplete: 'countSelectItems',
    'TopAppBar-Navigation': 'navItemCount',
    List: 'countListItems',
    'Icon-List': 'countListItems',
    'Chart-Bar': 'dataCount',
    'Chart-Line-History': 'dataCount',
    'Chart-Pie': 'dataCount',
    Table: 'countCols',
    'Masonry-Views': 'countViews',
    'Grid-Views': 'countViews',
    'view-in-widget': 'countRenderViewsOnLoad',
    'view-in-widget8': 'count',
};

const OLD_NAMESPACE = /(?<![\w-])vis-materialdesign\.\d+\./g;
const LEGACY_API = ['vis.binds.materialdesign', 'myMdwHelper'];

type Widget = { tpl?: unknown; widgetSet?: unknown; data?: Record<string, unknown> };

function renameIcons(view: string, id: string, data: Record<string, unknown>, report: MigrationReport): void {
    for (const [key, value] of Object.entries(data)) {
        if (typeof value !== 'string') continue;
        const prefix = value.startsWith('mdi-') ? 'mdi-' : '';
        const name = value.slice(prefix.length);
        if (Object.hasOwn(RENAMED_ICONS, name)) data[key] = prefix + RENAMED_ICONS[name];
        else if (REMOVED_ICONS.has(name)) report.warnings.push(`${view}/${id}: icon ${name}`);
    }
}

const THEME_TOKEN = /^#mdwTheme:vis-materialdesign\.\d+\.(colors|fonts|fontSizes)\.(.+)$/;

function useTheme(widgetName: string, data: Record<string, unknown>): void {
    const variables = new Map(
        themeEntries(widgetName).map(({ type, entry }) => [
            `${type}.${entry.id.replace(/^light\.|^dark\./, '')}`,
            `var(${cssVariable(type, entry.id)})`,
        ]),
    );
    for (const [key, value] of Object.entries(data)) {
        if (typeof value !== 'string' || !value.startsWith('#mdwTheme:')) continue;
        const token = value.match(THEME_TOKEN);
        const variable = token && variables.get(`${token[1]}.${token[2]}`);
        // A token our widget has no theme entry for resolves to nothing; without it the widget
        // falls back to its own default instead of handing an invalid value to CSS.
        if (variable) data[key] = variable;
        else delete data[key];
    }
    for (const [key, value] of Object.entries(themeKeyDefaults(widgetName))) {
        if (!Object.hasOwn(data, key)) data[key] = value;
    }
}

export function rewriteNamespace(value: string, namespace: string): string {
    // MaterialDesignInput.tsx resolves `#mdwTheme:` tokens by the literal old namespace.
    return value.startsWith('#mdwTheme:') ? value : value.replace(OLD_NAMESPACE, `${namespace}.`);
}

function rewriteDeep(value: unknown, namespace: string): unknown {
    if (typeof value === 'string') return rewriteNamespace(value, namespace);
    if (Array.isArray(value)) return value.map(item => rewriteDeep(item, namespace));
    if (value && typeof value === 'object')
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewriteDeep(item, namespace)]));
    return value;
}

function bumpCount(value: unknown): unknown {
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value + 1;
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) return String(Number(value) + 1);
    return value;
}

function eachWidget(project: Project, visit: (view: string, id: string, widget: Widget) => void): void {
    for (const [view, content] of Object.entries(project)) {
        if (view === '___settings' || !content || typeof content !== 'object') continue;
        const widgets = (content as { widgets?: unknown }).widgets;
        if (!widgets || typeof widgets !== 'object') continue;
        for (const [id, widget] of Object.entries(widgets as Record<string, unknown>)) {
            if (widget && typeof widget === 'object') visit(view, id, widget);
        }
    }
}

export function countLegacyWidgets(project: Project): number {
    let count = 0;
    eachWidget(project, (_view, _id, widget) => {
        if (typeof widget.tpl === 'string' && widget.tpl.startsWith(OLD_PREFIX)) count++;
    });
    return count;
}

export function migrateProject(project: Project, namespace: string): { project: Project; report: MigrationReport } {
    const out = rewriteDeep(project, namespace) as Project;
    const report: MigrationReport = { widgets: 0, byView: {}, unknown: [], warnings: [] };
    eachWidget(out, (view, id, widget) => {
        const text = JSON.stringify(widget.data ?? {});
        LEGACY_API.filter(api => text.includes(api)).forEach(api => report.warnings.push(`${view}/${id}: ${api}`));
        if (typeof widget.tpl !== 'string' || !widget.tpl.startsWith(OLD_PREFIX)) return;
        const suffix = widget.tpl.slice(OLD_PREFIX.length);
        if (!KNOWN.has(suffix)) {
            report.unknown.push(`${view}/${id}: ${widget.tpl}`);
            return;
        }
        widget.tpl = NEW_PREFIX + (RENAMED[suffix] ?? suffix);
        widget.widgetSet = WIDGET_SET;
        if (widget.data) renameIcons(view, id, widget.data, report);
        if (widget.data && typeof widget.data === 'object' && !Array.isArray(widget.data)) useTheme(WIDGET_NAMES[suffix], widget.data);
        const field = COUNT_FIELDS[suffix];
        if (field && widget.data && field in widget.data) widget.data[field] = bumpCount(widget.data[field]);
        report.widgets++;
        report.byView[view] = (report.byView[view] ?? 0) + 1;
    });
    return { project: out, report };
}

export function legacyCssWarnings(css: string): string[] {
    return [...new Set(css.match(/\.(?:v-|mdc-|materialdesign-)[\w-]+/g) ?? [])];
}
