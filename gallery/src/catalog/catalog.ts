import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import docs from 'virtual:gallery-docs';

import { DEMO_PREFIX } from '../runtime/scenario';
import { entryByModule } from '../runtime/widgets';
import { defaultData, expandFields } from '../runtime/widgetInfo';
import generated from './variants.generated.json';

export type Family = 'buttons' | 'iconButtons' | 'input' | 'sliders' | 'progress' | 'values' | 'lists' | 'charts' | 'calendar' | 'views' | 'navigation';
export interface Variant { id: string; label: string; purpose?: string; data: Record<string, unknown>; size: { width: number | 'fill'; height: number }; designStyle?: 'legacy' | 'material3' }
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

const V = (id: string, label: string, data: Record<string, unknown>, width: number, height: number): Variant => ({ id, label, data, size: { width, height } });
const D = (name: string) => `MaterialDesign${name}`;
const demo = (path: string): string => `${DEMO_PREFIX}${path}`;

const BUTTON = { w: 170, h: 44 };
const VERTICAL = { w: 120, h: 96 };
const ICON = { w: 48, h: 48 };
const LOCKED = { lockEnabled: true, lockPin: '1234' };
const SCENE_TARGETS = [['general.scene', 'night'], ['living.light', 'false'], ['kitchen.light', 'false'], ['hall.light', 'false']] as const;
const multi = (count: number): Record<string, unknown> => ({
    countOids: count,
    ...Object.fromEntries(SCENE_TARGETS.slice(0, count).flatMap(([path, value], i) => [[`oid${i}`, demo(path)], [`value${i}`, value]])),
});
const GRID_VIEWS = { View0: 'demo-lights', View1: 'demo-climate', View2: 'demo-media' };
const DIALOG_VIEW = { buttontext: 'Open media', contains_view: 'demo-media', title: 'Media' };

function buttonFamily(vertical: boolean): Record<string, Variant[]> {
    const { w, h } = vertical ? VERTICAL : BUTTON;
    const suffix = vertical ? 'Vertical' : '';
    const nav = { nav_view: 'demo-climate' };
    const link = { href: '#/widget/Switch' };
    const counter = { oid: demo('general.counter') };
    const light = { oid: demo('living.light') };
    const sets: Array<[string, Variant[]]> = [
        ['ButtonNavigation', [
            V('text-only', 'Text only', { buttontext: 'Climate', image: '', ...nav }, w, h),
            V('with-icon', 'With icon', { buttontext: 'Climate', image: 'thermometer', ...nav }, w, h),
            V('outlined', 'Outlined', { buttontext: 'Climate', image: 'thermometer', buttonStyle: 'outlined', ...nav }, w, h),
        ]],
        ['ButtonLink', [
            V('text-only', 'Text only', { buttontext: 'Switch widget', image: '', ...link }, w, h),
            V('with-icon', 'With icon', { buttontext: 'Switch widget', image: 'link-variant', ...link }, w, h),
            V('outlined', 'Outlined', { buttontext: 'Switch widget', image: 'link-variant', buttonStyle: 'outlined', ...link }, w, h),
        ]],
        ['ButtonStateMulti', [
            V('two-targets', 'Scene with two targets', { buttontext: 'Night', ...multi(2) }, w, h),
            V('four-targets', 'Scene with four targets', { buttontext: 'All off', ...multi(4) }, w, h),
        ]],
        ['ButtonAdition', [
            V('step-plus-1', 'Step +1', { buttontext: '+1', ...counter, value: 1 }, w, h),
            V('step-minus-5', 'Step -5', { buttontext: '-5', image: 'minus', ...counter, value: -5 }, w, h),
            V('with-lock', 'With lock', { buttontext: '+1', ...counter, value: 1, lockEnabled: true }, w, h),
        ]],
        ['ButtonToggle', [
            V('text', 'Text', { buttontext: 'Light', image: '', ...light }, w, h),
            V('icon', 'Icon', { buttontext: 'Light', image: 'lightbulb', ...light }, w, h),
            V('lock-pin', 'With lock and PIN 1234', { buttontext: 'Light', image: 'lightbulb', ...light, ...LOCKED }, w, h),
        ]],
    ];
    // The vertical toggle already has two imported variants; only its lock variant is missing.
    return Object.fromEntries(sets.map(([name, variants]) => [D(name + suffix), vertical && name === 'ButtonToggle' ? variants.slice(2) : variants]));
}

const ICON_BUTTONS: Record<string, Variant[]> = {
    [D('IconButtonNavigation')]: [
        V('thermometer', 'Climate icon', { image: 'thermometer', nav_view: 'demo-climate' }, ICON.w, ICON.h),
        V('home', 'Home icon', { image: 'home', nav_view: 'demo-lights' }, ICON.w, ICON.h),
        V('lock-pin', 'With lock and PIN 1234', { image: 'thermometer', nav_view: 'demo-climate', ...LOCKED }, ICON.w, ICON.h),
    ],
    [D('IconButtonLink')]: [
        V('link', 'Link icon', { image: 'link-variant', href: '#/widget/Switch' }, ICON.w, ICON.h),
        V('open', 'Open icon', { image: 'open-in-new', href: '#/widget/Switch' }, ICON.w, ICON.h),
        V('lock-pin', 'With lock and PIN 1234', { image: 'link-variant', href: '#/widget/Switch', ...LOCKED }, ICON.w, ICON.h),
    ],
    [D('IconButtonStateMulti')]: [
        V('two-targets', 'Scene with two targets', { image: 'weather-night', ...multi(2) }, ICON.w, ICON.h),
        V('four-targets', 'Scene with four targets', { image: 'power', ...multi(4) }, ICON.w, ICON.h),
    ],
    [D('IconButtonAdition')]: [
        V('step-plus-1', 'Step +1', { image: 'plus', oid: demo('general.counter'), value: 1 }, ICON.w, ICON.h),
        V('step-minus-5', 'Step -5', { image: 'minus', oid: demo('general.counter'), value: -5 }, ICON.w, ICON.h),
        V('with-lock', 'With lock', { image: 'plus', oid: demo('general.counter'), value: 1, lockEnabled: true }, ICON.w, ICON.h),
    ],
    [D('IconButtonToggle')]: [
        V('bulb', 'Light bulb', { image: 'lightbulb-outline', imageTrue: 'lightbulb', oid: demo('living.light') }, ICON.w, ICON.h),
        V('power', 'Power icon', { image: 'power', oid: demo('living.light') }, ICON.w, ICON.h),
        V('lock-pin', 'With lock and PIN 1234', { image: 'lightbulb', oid: demo('living.light'), ...LOCKED }, ICON.w, ICON.h),
    ],
    [D('IconButtonSlider')]: [
        V('full-circle', 'Full circle', { oid: demo('living.dimmer'), image: 'lightbulb', angleArc: 360 }, 120, 120),
        V('half-circle', 'Half circle', { oid: demo('living.dimmer'), image: 'lightbulb', angleArc: 180, angleOffset: 270 }, 120, 120),
        V('slider-only', 'Slider only', { oid: demo('living.dimmer'), image: 'lightbulb', sliderOnly: true }, 120, 120),
    ],
};

const VIEWS: Record<string, Variant[]> = {
    [D('MasonryViews')]: [
        V('two-columns', 'Two columns', { countViews: 3, countCols: 2, ...GRID_VIEWS }, 900, 520),
        V('three-columns', 'Three columns', { countViews: 3, countCols: 3, ...GRID_VIEWS }, 1200, 520),
    ],
    [D('GridViews')]: [
        V('two-columns', 'Two columns', { countViews: 3, viewColSpan: 6, ...GRID_VIEWS }, 900, 520),
        V('three-columns', 'Three columns', { countViews: 3, viewColSpan: 4, ...GRID_VIEWS }, 1200, 520),
    ],
    [D('AdvancedViewInWidget')]: [
        V('by-name', 'View chosen by a state', { oid: demo('general.viewName') }, 400, 300),
        V('pre-rendered', 'Views rendered in advance', { oid: demo('general.viewName'), renderAlways: true, countRenderViewsOnLoad: 3, ...GRID_VIEWS }, 400, 300),
        V('quiet', 'Without error message', { oid: demo('general.viewName'), hideErrorMessage: true, fadeInDuration: 300, fadeOutDuration: 300 }, 400, 300),
    ],
    [D('AdvancedViewInWidget8')]: [
        V('three-views', 'Three views by index', { oid: demo('general.view'), count: 3, contains_view_0: 'demo-lights', contains_view_1: 'demo-climate', contains_view_2: 'demo-media' }, 400, 300),
        V('two-views', 'Two views', { oid: demo('general.view'), count: 2, contains_view_0: 'demo-lights', contains_view_1: 'demo-climate' }, 400, 300),
        V('slow-fade', 'Slow fade', { oid: demo('general.view'), count: 3, contains_view_0: 'demo-lights', contains_view_1: 'demo-climate', contains_view_2: 'demo-media', fadeInDuration: 400, fadeOutDuration: 400 }, 400, 300),
    ],
    [D('DialogView')]: [
        V('open-button', 'Open button', { ...DIALOG_VIEW }, BUTTON.w, BUTTON.h),
        V('outlined', 'Outlined button', { ...DIALOG_VIEW, buttonStyle: 'outlined' }, BUTTON.w, BUTTON.h),
        V('data-point', 'Opened by a data point', { ...DIALOG_VIEW, showDialogMethod: 'datapoint', showDialogOid: demo('general.flag') }, BUTTON.w, BUTTON.h),
    ],
    [D('DialogIFrame')]: [
        V('window', 'In a window', { buttontext: 'Open page', src: './iframe-demo.html', title: 'iFrame demo' }, BUTTON.w, BUTTON.h),
        V('fullscreen', 'Fullscreen', { buttontext: 'Open page', src: './iframe-demo.html', title: 'iFrame demo', fullscreenResolutionLower: 100000 }, BUTTON.w, BUTTON.h),
    ],
    // These two have no settings besides the style, so only the stage size differs.
    [D('ColorScheme')]: [V('compact', 'Compact', {}, 420, 240), V('wide', 'Wide', {}, 800, 360)],
    [D('InstalledVersion')]: [V('small', 'Small', {}, 90, 20), V('wide', 'Wide', {}, 200, 40)],
};

const INPUTS: Record<string, Variant[]> = {
    [D('Autocomplete')]: [
        V('scene-list', 'Scene list', { oid: demo('general.scene'), inputLayout: 'solo', inputLabelText: 'Scene', listDataMethod: 'valueList', valueList: 'morning;day;evening;night', valueListLabels: 'Morning;Day;Evening;Night' }, 300, 76),
    ],
    [D('Keyboard')]: [
        V('english-text', 'English text keys', { keyboardLayout: 'text', keyboardLanguage: 'en', keyboardShowOn: 'always' }, 640, 280),
        V('numbers', 'Number pad', { keyboardLayout: 'number', keyboardShowOn: 'always' }, 320, 280),
    ],
    [D('IconList')]: [
        V('light-switches', 'Light switches', { listItemDataMethod: 'inputPerEditor', countListItems: 2, listType0: 'buttonToggle', oid0: demo('living.light'), label0: 'Living room', listImage0: 'lightbulb', listType1: 'buttonToggle', oid1: demo('kitchen.light'), label1: 'Kitchen', listImage1: 'lightbulb' }, 300, 120),
    ],
};

export const HAND_VARIANTS: Record<string, Variant[]> = { ...buttonFamily(false), ...buttonFamily(true), ...ICON_BUTTONS, ...VIEWS, ...INPUTS };

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
const DEFAULT_PATCH: Record<string, { data: Record<string, unknown>; size?: Variant['size'] }> = {
    // A visitor's first look at an embedding widget must show the demo views, not an empty frame.
    MaterialDesignMasonryViews: { data: { countViews: 3, countCols: 2, ...GRID_VIEWS }, size: { width: 900, height: 520 } },
    MaterialDesignGridViews: { data: { countViews: 3, viewColSpan: 6, ...GRID_VIEWS }, size: { width: 900, height: 520 } },
    MaterialDesignAdvancedViewInWidget: { data: { oid: demo('general.viewName'), View0: 'demo-lights' }, size: { width: 400, height: 300 } },
    MaterialDesignAdvancedViewInWidget8: { data: { oid: demo('general.view'), count: 3, contains_view_0: 'demo-lights', contains_view_1: 'demo-climate', contains_view_2: 'demo-media' }, size: { width: 400, height: 300 } },
    MaterialDesignButtonNavigation: { data: { nav_view: 'demo-climate' } },
    MaterialDesignButtonNavigationVertical: { data: { nav_view: 'demo-climate' } },
    MaterialDesignIconButtonNavigation: { data: { nav_view: 'demo-climate' } },
    MaterialDesignList: { data: { listTypeButtonNav0: 'demo-climate' } },
    MaterialDesignIconList: { data: { listTypeButtonNav0: 'demo-climate' } },
    MaterialDesignDialogView: { data: { ...DIALOG_VIEW }, size: { width: BUTTON.w, height: BUTTON.h } },
    MaterialDesignChartLineHistory: {
        data: { historyAdapterInstance: 'influxdb.0', timeIntervalToShow: '1 day', dataCount: 1, oid0: `${DEMO_PREFIX}energy.power`, time_interval_oid: '', manualRefreshTrigger: '', visibilityOid0: '', oid1: '', visibilityOid1: '' },
        size: { width: 600, height: 340 },
    },
};

function defaultVariant(module: string, info: RxWidgetInfo): Variant {
    const data: Record<string, unknown> = { ...defaultData(info) };
    for (const { key, field } of expandFields(info, data)) {
        if ((field as { type?: string }).type === 'id' && !key.startsWith('__mdwTheme') && !data[key]) data[key] = FALLBACK_ID;
    }
    const patch = DEFAULT_PATCH[module];
    return { id: 'default', label: 'Default', data: { ...data, ...patch?.data }, size: patch?.size ?? { width: 300, height: 60 } };
}

export function catalogEntry(module: string, info: RxWidgetInfo): CatalogEntry {
    const index = entryByModule(module);
    const meta = FAMILIES[module] ?? { family: 'values' as const, doc: '' };
    const imported = (generated as Array<Variant & { module: string }>).filter(v => v.module === module).map(({ module: _m, ...v }) => v);
    const variants = [...imported, ...(HAND_VARIANTS[module] ?? [])];
    if (!variants.some(v => v.id === 'default')) variants.unshift(defaultVariant(module, info));
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