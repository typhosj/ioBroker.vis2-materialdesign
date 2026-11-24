import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import docs from 'virtual:gallery-docs';

import { DEMO_PREFIX } from '../runtime/scenario';
import { entryByModule } from '../runtime/widgets';
import { currentLang } from '../runtime/i18n';
import { defaultData, expandFields } from '../runtime/widgetInfo';
import { DEFAULTS_ID, defaultSize, toVariant } from './example';
import { EXAMPLES } from './examples';

export type Family = 'buttons' | 'iconButtons' | 'input' | 'sliders' | 'progress' | 'values' | 'lists' | 'charts' | 'calendar' | 'views' | 'navigation';
export interface Variant { id: string; label: string; purpose?: string; data: Record<string, unknown>; size: { width: number | 'fill'; height: number }; designStyle?: 'legacy' | 'material3'; states?: Record<string, ioBroker.StateValue> }
export interface CatalogEntry { module: string; name: string; tpl: string; family: Family; doc: string; description: { en: string; de: string }; expects: Array<{ attr: string; type: string; roles: string[] }>; variants: Variant[]; excluded?: string }

const B = (doc: string) => ({ family: 'buttons' as const, doc });
const I = { family: 'iconButtons' as const, doc: 'icon-buttons' };
export const FAMILIES: Record<string, { family: Family; doc: string }> = {
    MaterialDesignButtonNavigation: B('buttons'), MaterialDesignButtonLink: B('buttons'), MaterialDesignButtonState: B('buttons'),
    MaterialDesignButtonStateMulti: B('buttons'), MaterialDesignButtonAdition: B('buttons'), MaterialDesignButtonToggle: B('buttons'),
    MaterialDesignButtonNavigationVertical: B('buttons-vertical'), MaterialDesignButtonLinkVertical: B('buttons-vertical'),
    MaterialDesignButtonStateVertical: B('buttons-vertical'), MaterialDesignButtonStateMultiVertical: B('buttons-vertical'),
    MaterialDesignButtonAditionVertical: B('buttons-vertical'), MaterialDesignButtonToggleVertical: B('buttons-vertical'),
    MaterialDesignIconButtonNavigation: I, MaterialDesignIconButtonLink: I, MaterialDesignIconButtonState: I,
    MaterialDesignIconButtonStateMulti: I, MaterialDesignIconButtonAdition: I, MaterialDesignIconButtonToggle: I, MaterialDesignIconButtonSlider: I,
    MaterialDesignCheckbox: { family: 'input', doc: 'checkbox' }, MaterialDesignSwitch: { family: 'input', doc: 'switch' },
    MaterialDesignInput: { family: 'input', doc: 'input' }, MaterialDesignSelect: { family: 'input', doc: 'select' },
    MaterialDesignAutocomplete: { family: 'input', doc: 'select' }, MaterialDesignKeyboard: { family: 'input', doc: 'keyboard' },
    MaterialDesignSlider: { family: 'sliders', doc: 'slider' }, MaterialDesignRoundSlider: { family: 'sliders', doc: 'slider-round' },
    MaterialDesignProgress: { family: 'progress', doc: 'progress' }, MaterialDesignProgressCircular: { family: 'progress', doc: 'progress-circular' },
    MaterialDesignValue: { family: 'values', doc: 'value' }, MaterialDesignIcon: { family: 'values', doc: 'material-design-icons-and-images' },
    MaterialDesignInstalledVersion: { family: 'values', doc: 'material-design-icons-and-images' },
    MaterialDesignColorScheme: { family: 'values', doc: 'material-design-icons-and-images' },
    MaterialDesignList: { family: 'lists', doc: 'list' }, MaterialDesignIconList: { family: 'lists', doc: 'iconlist' },
    MaterialDesignTable: { family: 'lists', doc: 'table' }, MaterialDesignCard: { family: 'lists', doc: 'html-card' },
    MaterialDesignAlerts: { family: 'lists', doc: 'alerts' },
    MaterialDesignChartBar: { family: 'charts', doc: 'chart-bar' }, MaterialDesignChartPie: { family: 'charts', doc: 'chart-pie' },
    MaterialDesignChartJson: { family: 'charts', doc: 'chart-json' }, MaterialDesignChartLineHistory: { family: 'charts', doc: 'chart-line-history' },
    MaterialDesignCalendar: { family: 'calendar', doc: 'calendar' },
    MaterialDesignMasonryViews: { family: 'views', doc: 'responsive-layout' }, MaterialDesignGridViews: { family: 'views', doc: 'responsive-layout' },
    MaterialDesignAdvancedViewInWidget: { family: 'views', doc: 'html-widgets' }, MaterialDesignAdvancedViewInWidget8: { family: 'views', doc: 'html-widgets' },
    MaterialDesignDialogView: { family: 'views', doc: 'dialog' }, MaterialDesignDialogIFrame: { family: 'views', doc: 'dialog' },
    MaterialDesignTopAppBar: { family: 'navigation', doc: 'top-app-bar' },
};

const D = (name: string) => `MaterialDesign${name}`;
const demo = (path: string): string => `${DEMO_PREFIX}${path}`;
const GRID_VIEWS = { View0: 'demo-lights', View1: 'demo-climate', View2: 'demo-media' };
const DIALOG_VIEW = { buttontext: 'Open media', contains_view: 'demo-media', title: 'Media' };

// Roles stay only where the plan names them (Switch, Slider, Value); no doc page or deviceFill.tsx rule lists a role for any other oid.
const T = (type: string, ...roles: string[]): CatalogEntry['expects'] => [{ attr: 'oid', type, roles }];
const ANY = 'number | string | boolean';
export const EXPECTS: Record<string, CatalogEntry['expects']> = Object.fromEntries(Object.entries({
    Switch: T('boolean', 'switch', 'switch.light'),
    Checkbox: T(ANY),
    Input: T('string | number'),
    Select: T(ANY),
    Autocomplete: T('string | number'),
    Slider: T('number', 'level', 'level.dimmer', 'level.blind'),
    RoundSlider: T('number'),
    IconButtonSlider: T('number'),
    Progress: T('number | boolean'),
    ProgressCircular: T('number | boolean'),
    Value: T(ANY, 'value', 'text'),
    IconList: T(ANY),
    List: T(ANY),
    Table: T('string (JSON array)'),
    Alerts: T('string (JSON array)'),
    Calendar: T('string (JSON array)'),
    ChartBar: [{ attr: 'oid', type: 'number', roles: [] }, { attr: 'oid', type: 'string (JSON array)', roles: [] }],
    ChartPie: [{ attr: 'oid', type: 'number', roles: [] }, { attr: 'oid', type: 'string (JSON array)', roles: [] }],
    ChartJson: T('string (JSON object)'),
    ChartLineHistory: T('number'),
    TopAppBar: T('string | number'),
    AdvancedViewInWidget: T('string (view name)'),
    AdvancedViewInWidget8: T('number | boolean (view index)'),
    ButtonAdition: T('number'),
    ButtonAditionVertical: T('number'),
    IconButtonAdition: T('number'),
    ButtonToggle: T(ANY),
    ButtonToggleVertical: T(ANY),
    IconButtonToggle: T(ANY),
    ButtonState: T(ANY),
    ButtonStateVertical: T(ANY),
    IconButtonState: T(ANY),
    ButtonStateMulti: T(ANY),
    ButtonStateMultiVertical: T(ANY),
    IconButtonStateMulti: T(ANY),
}).map(([name, expects]) => [D(name), expects]));

export const EXCLUDED: Record<string, string> = {};

const FALLBACK_ID = `${DEMO_PREFIX}general.value`;

// The fallback id would make the chart ask for a history of a plain value, so it gets the demo history instead.
const DEFAULT_PATCH: Record<string, { data: Record<string, unknown> }> = {
    // A visitor's first look at an embedding widget must show the demo views, not an empty frame.
    MaterialDesignMasonryViews: { data: { countViews: 3, countCols: 2, ...GRID_VIEWS } },
    MaterialDesignGridViews: { data: { countViews: 3, viewColSpan: 6, ...GRID_VIEWS } },
    MaterialDesignAdvancedViewInWidget: { data: { oid: demo('general.viewName'), View0: 'demo-lights' } },
    MaterialDesignAdvancedViewInWidget8: { data: { oid: demo('general.view'), count: 3, contains_view_0: 'demo-lights', contains_view_1: 'demo-climate', contains_view_2: 'demo-media' } },
    MaterialDesignButtonNavigation: { data: { nav_view: 'demo-climate' } },
    MaterialDesignButtonNavigationVertical: { data: { nav_view: 'demo-climate' } },
    MaterialDesignIconButtonNavigation: { data: { nav_view: 'demo-climate' } },
    MaterialDesignList: { data: { listTypeButtonNav0: 'demo-climate' } },
    MaterialDesignIconList: { data: { listTypeButtonNav0: 'demo-climate' } },
    MaterialDesignDialogView: { data: { ...DIALOG_VIEW } },
    MaterialDesignChartLineHistory: { data: { historyAdapterInstance: 'influxdb.0', timeIntervalToShow: '1 day', dataCount: 1, oid0: `${DEMO_PREFIX}energy.power`, time_interval_oid: '', manualRefreshTrigger: '', visibilityOid0: '', oid1: '', visibilityOid1: '' } },
};

function defaultsVariant(module: string, info: RxWidgetInfo): Variant {
    const data: Record<string, unknown> = {};
    const defaults = defaultData(info);
    for (const { key, field } of expandFields(info, defaults)) {
        if ((field as { type?: string }).type === 'id' && !key.startsWith('__mdwTheme') && !defaults[key]) data[key] = FALLBACK_ID;
    }
    return {
        id: DEFAULTS_ID,
        label: currentLang() === 'de' ? 'Standard (wie eingefügt)' : 'As inserted',
        data: { ...data, ...DEFAULT_PATCH[module]?.data },
        size: defaultSize(module),
    };
}

export function catalogEntry(module: string, info: RxWidgetInfo): CatalogEntry {
    const index = entryByModule(module);
    const meta = FAMILIES[module] ?? { family: 'values' as const, doc: '' };
    const variants = [...(EXAMPLES[module] ?? []).map(example => toVariant(example, currentLang())), defaultsVariant(module, info)];
    return {
        module,
        name: index?.name ?? info.visName ?? module,
        tpl: index?.tpl ?? info.id,
        family: meta.family,
        doc: meta.doc,
        description: docs[meta.doc] ?? { en: '', de: '' },
        expects: EXPECTS[module] ?? [],
        variants,
        excluded: EXCLUDED[module],
    };
}