import type { Variant } from './catalog';

export interface Example {
    id: string;
    label: { en: string; de: string };
    purpose: { en: string; de: string };
    size: { width: number | 'fill'; height: number };
    data: Record<string, unknown>;
    designStyle?: 'legacy' | 'material3';
    states?: Record<string, ioBroker.StateValue>;
}
export type FamilyExamples = Record<string, Example[]>;

export const DEFAULTS_ID = 'as-inserted';

export function toVariant(example: Example, lang: 'en' | 'de'): Variant {
    const { label, purpose, ...rest } = example;
    return { ...rest, label: label[lang], purpose: purpose[lang] || undefined };
}

type Size = Example['size'];
const BUTTON: Size = { width: 160, height: 48 };
const ICON_BUTTON: Size = { width: 48, height: 48 };
const INPUT: Size = { width: 280, height: 56 };
const SWITCH: Size = { width: 220, height: 48 };
const CHART: Size = { width: 480, height: 300 };
const VIEWS: Size = { width: 'fill', height: 400 };

// Recommended sizes for a wall tablet dashboard, one row per widget kind.
const SIZES: Record<string, Size> = {
    MaterialDesignButtonNavigation: BUTTON, MaterialDesignButtonLink: BUTTON, MaterialDesignButtonState: BUTTON,
    MaterialDesignButtonStateMulti: BUTTON, MaterialDesignButtonAdition: BUTTON, MaterialDesignButtonToggle: BUTTON,
    MaterialDesignButtonNavigationVertical: { width: 96, height: 96 }, MaterialDesignButtonLinkVertical: { width: 96, height: 96 },
    MaterialDesignButtonStateVertical: { width: 96, height: 96 }, MaterialDesignButtonStateMultiVertical: { width: 96, height: 96 },
    MaterialDesignButtonAditionVertical: { width: 96, height: 96 }, MaterialDesignButtonToggleVertical: { width: 96, height: 96 },
    MaterialDesignIconButtonNavigation: ICON_BUTTON, MaterialDesignIconButtonLink: ICON_BUTTON, MaterialDesignIconButtonState: ICON_BUTTON,
    MaterialDesignIconButtonStateMulti: ICON_BUTTON, MaterialDesignIconButtonAdition: ICON_BUTTON, MaterialDesignIconButtonToggle: ICON_BUTTON,
    MaterialDesignIconButtonSlider: { width: 56, height: 200 },
    MaterialDesignSwitch: SWITCH, MaterialDesignCheckbox: SWITCH,
    MaterialDesignInput: INPUT, MaterialDesignSelect: INPUT, MaterialDesignAutocomplete: INPUT,
    MaterialDesignKeyboard: { width: 'fill', height: 280 },
    MaterialDesignSlider: { width: 280, height: 48 },
    MaterialDesignRoundSlider: { width: 200, height: 200 },
    MaterialDesignProgress: { width: 280, height: 24 },
    MaterialDesignProgressCircular: { width: 96, height: 96 },
    MaterialDesignValue: { width: 200, height: 40 },
    MaterialDesignIcon: { width: 48, height: 48 },
    MaterialDesignInstalledVersion: { width: 200, height: 32 },
    MaterialDesignColorScheme: { width: 280, height: 160 },
    // The list widget starts with two rows of 48 px.
    MaterialDesignList: { width: 320, height: 96 },
    MaterialDesignIconList: { width: 360, height: 240 },
    MaterialDesignTable: { width: 480, height: 280 },
    MaterialDesignCard: { width: 320, height: 200 },
    MaterialDesignAlerts: { width: 360, height: 240 },
    MaterialDesignChartBar: CHART, MaterialDesignChartJson: CHART, MaterialDesignChartLineHistory: CHART,
    MaterialDesignChartPie: { width: 320, height: 300 },
    MaterialDesignCalendar: { width: 420, height: 440 },
    MaterialDesignTopAppBar: { width: 'fill', height: 64 },
    MaterialDesignMasonryViews: VIEWS, MaterialDesignGridViews: VIEWS,
    MaterialDesignAdvancedViewInWidget: VIEWS, MaterialDesignAdvancedViewInWidget8: VIEWS,
    MaterialDesignDialogView: BUTTON, MaterialDesignDialogIFrame: BUTTON,
};

export const defaultSize = (module: string): Size => SIZES[module] ?? { width: 300, height: 60 };
