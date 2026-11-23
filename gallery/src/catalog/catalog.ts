import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import docs from 'virtual:gallery-docs';

import { DEMO_PREFIX } from '../runtime/scenario';
import { entryByModule } from '../runtime/widgets';
import { defaultData, expandFields } from '../runtime/widgetInfo';
import generated from './variants.generated.json';

export type Family = 'buttons' | 'iconButtons' | 'input' | 'sliders' | 'progress' | 'values' | 'lists' | 'charts' | 'calendar' | 'views' | 'navigation';
export interface Variant { id: string; label: string; data: Record<string, unknown>; size: { width: number; height: number } }
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

// Hand-written additions for widgets the doc views do not cover; Task 15 fills it.
export const HAND_VARIANTS: Record<string, Variant[]> = {};
export const EXPECTS: Record<string, CatalogEntry['expects']> = {};
export const EXCLUDED: Record<string, string> = {};

const FALLBACK_ID = `${DEMO_PREFIX}general.value`;

function defaultVariant(info: RxWidgetInfo): Variant {
    const data: Record<string, unknown> = { ...defaultData(info) };
    for (const { key, field } of expandFields(info, data)) {
        if ((field as { type?: string }).type === 'id' && !key.startsWith('__mdwTheme') && !data[key]) data[key] = FALLBACK_ID;
    }
    return { id: 'default', label: 'Default', data, size: { width: 300, height: 60 } };
}

export function catalogEntry(module: string, info: RxWidgetInfo): CatalogEntry {
    const index = entryByModule(module);
    const meta = FAMILIES[module] ?? { family: 'values' as const, doc: '' };
    const imported = (generated as Array<Variant & { module: string }>).filter(v => v.module === module).map(({ module: _m, ...v }) => v);
    const variants = [...imported, ...(HAND_VARIANTS[module] ?? [])];
    if (!variants.some(v => v.id === 'default')) variants.unshift(defaultVariant(info));
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