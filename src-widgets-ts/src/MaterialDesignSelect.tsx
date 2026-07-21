import React from 'react';

import type { RxWidgetInfo, VisRxWidgetState } from '@iobroker/types-vis-2';

import { renderIcon } from './MaterialDesignButtons';
import { cleanColor, num } from './MaterialDesignProgress';
import { squarePreview, RenderProps, VisWidget, createInfo, iconField, setStateValue, sizeCss, stateValue } from './widgetUtils';

interface SelectData {
    oid?: string;
    inputType?: string;
    inputLayout?: string;
    inputAlignment?: 'left' | 'center' | 'right';
    inputLayoutBackgroundColor?: string;
    inputLayoutBackgroundColorHover?: string;
    inputLayoutBorderColor?: string;
    inputLayoutBorderColorHover?: string;
    inputLayoutBorderColorSelected?: string;
    inputTextFontFamily?: string;
    inputTextFontSize?: number;
    inputTextColor?: string;
    inputLabelText?: string;
    inputLabelColor?: string;
    inputLabelColorSelected?: string;
    inputLabelFontFamily?: string;
    inputLabelFontSize?: number;
    inputTranslateX?: number;
    inputTranslateY?: number;
    inputPrefix?: string;
    inputSuffix?: string;
    inputAppendixColor?: string;
    inputAppendixFontSize?: number;
    inputAppendixFontFamily?: string;
    inputMessage?: string;
    showInputMessageAlways?: boolean;
    inputMessageFontFamily?: string;
    inputMessageFontSize?: number;
    inputMessageColor?: string;
    showInputCounter?: boolean;
    inputCounterColor?: string;
    inputCounterFontSize?: number;
    inputCounterFontFamily?: string;
    clearIconShow?: boolean;
    clearIcon?: string;
    clearIconSize?: number;
    clearIconColor?: string;
    collapseIcon?: string;
    collapseIconSize?: number;
    collapseIconColor?: string;
    prepandIcon?: string;
    prepandIconSize?: number;
    prepandIconColor?: string;
    prepandInnerIcon?: string;
    prepandInnerIconSize?: number;
    prepandInnerIconColor?: string;
    appendOuterIcon?: string;
    appendOuterIconSize?: number;
    appendOuterIconColor?: string;
    listDataMethod?: 'inputPerEditor' | 'jsonStringObject' | 'multistatesObject' | 'valueList';
    countSelectItems?: number;
    jsonStringObject?: string;
    valueList?: string;
    valueListLabels?: string;
    valueListIcons?: string;
    listPosition?: 'auto' | 'top' | 'bottom';
    listPositionOffset?: boolean;
    openOnClear?: boolean;
    listItemHeight?: number;
    listItemBackgroundColor?: string;
    listItemBackgroundHoverColor?: string;
    listItemBackgroundSelectedColor?: string;
    listItemRippleEffectColor?: string;
    showSelectedIcon?: 'no' | 'prepend' | 'prepend-inner' | 'append-outer';
    listIconSize?: number;
    listIconColor?: string;
    listIconHoverColor?: string;
    listIconSelectedColor?: string;
    listItemFontSize?: number;
    listItemFont?: string;
    listItemFontColor?: string;
    listItemFontHoverColor?: string;
    listItemFontSelectedColor?: string;
    listItemSubFontSize?: number;
    listItemSubFont?: string;
    listItemSubFontColor?: string;
    listItemSubFontHoverColor?: string;
    listItemSubFontSelectedColor?: string;
    showValue?: boolean;
    listItemValueFontSize?: number;
    listItemValueFont?: string;
    listItemValueFontColor?: string;
    listItemValueFontHoverColor?: string;
    listItemValueFontSelectedColor?: string;
    [key: string]: unknown;
}

interface SelectItem {
    value: string | number | boolean;
    text: string;
    subText?: string;
    icon?: string;
    imageColor?: string;
    selectedImageColor?: string;
}

const attrs: RxWidgetInfo['visAttrs'] = [
    {
        name: 'common',
        label: 'group_common',
        fields: [
            { name: 'oid', label: 'oid', type: 'id' },
            {
                name: 'inputType',
                label: 'inputType',
                type: 'select',
                options: ['text', 'date', 'time'],
                default: 'text',
            },
            { name: 'generateHtmlControl', label: 'generateHtmlControl', type: 'checkbox' },
            { name: 'debug', label: 'debug', type: 'checkbox' },
        ],
    },
    {
        name: 'inputLayout',
        label: 'group_inputLayout',
        fields: [
            {
                name: 'inputLayout',
                label: 'inputLayout',
                type: 'select',
                options: [
                    'regular',
                    'solo',
                    'solo-rounded',
                    'solo-shaped',
                    'filled',
                    'filled-rounded',
                    'filled-shaped',
                    'outlined',
                    'outlined-rounded',
                    'outlined-shaped',
                ],
                default: 'regular',
            },
            {
                name: 'inputAlignment',
                label: 'inputAlignment',
                type: 'select',
                options: ['left', 'center', 'right'],
                default: 'left',
            },
            { name: 'inputLayoutBackgroundColor', label: 'inputLayoutBackgroundColor', type: 'color' },
            { name: 'inputLayoutBackgroundColorHover', label: 'inputLayoutBackgroundColorHover', type: 'color' },
            { name: 'inputLayoutBackgroundColorSelected', label: 'inputLayoutBackgroundColorSelected', type: 'color' },
            { name: 'inputLayoutBorderColor', label: 'inputLayoutBorderColor', type: 'color' },
            { name: 'inputLayoutBorderColorHover', label: 'inputLayoutBorderColorHover', type: 'color' },
            { name: 'inputLayoutBorderColorSelected', label: 'inputLayoutBorderColorSelected', type: 'color' },
            { name: 'inputTextFontFamily', label: 'inputTextFontFamily', type: 'fontname' },
            { name: 'inputTextFontSize', label: 'inputTextFontSize', type: 'number', default: 16 },
            { name: 'inputTextColor', label: 'inputTextColor', type: 'color', default: '#000000' },
            { name: 'autoFocus', label: 'autoFocus', type: 'checkbox' },
        ],
    },
    {
        name: 'inputLabel',
        label: 'group_inputLabel',
        fields: [
            { name: 'inputLabelText', label: 'inputLabelText', type: 'text' },
            { name: 'inputLabelColor', label: 'inputLabelColor', type: 'color' },
            { name: 'inputLabelColorSelected', label: 'inputLabelColorSelected', type: 'color' },
            { name: 'inputLabelFontFamily', label: 'inputLabelFontFamily', type: 'fontname' },
            {
                name: 'inputLabelFontSize',
                label: 'inputLabelFontSize',
                type: 'slider',
                min: 0,
                max: 24,
                step: 1,
                default: 16,
            },
            { name: 'inputTranslateX', label: 'inputTranslateX', type: 'number' },
            { name: 'inputTranslateY', label: 'inputTranslateY', type: 'number' },
        ],
    },
    {
        name: 'inputAppendix',
        label: 'group_inputAppendix',
        fields: [
            { name: 'inputPrefix', label: 'inputPrefix', type: 'text' },
            { name: 'inputSuffix', label: 'inputSuffix', type: 'text' },
            { name: 'inputAppendixColor', label: 'inputAppendixColor', type: 'color' },
            { name: 'inputAppendixFontSize', label: 'inputAppendixFontSize', type: 'number', default: 14 },
            { name: 'inputAppendixFontFamily', label: 'inputAppendixFontFamily', type: 'fontname' },
        ],
    },
    {
        name: 'inputSubText',
        label: 'group_inputSubText',
        fields: [
            { name: 'showInputMessageAlways', label: 'showInputMessageAlways', type: 'checkbox', default: true },
            { name: 'inputMessage', label: 'inputMessage', type: 'text' },
            { name: 'inputMessageFontFamily', label: 'inputMessageFontFamily', type: 'fontname' },
            { name: 'inputMessageFontSize', label: 'inputMessageFontSize', type: 'number', default: 14 },
            { name: 'inputMessageColor', label: 'inputMessageColor', type: 'color' },
        ],
    },
    {
        name: 'counter',
        label: 'group_counter',
        fields: [
            { name: 'showInputCounter', label: 'showInputCounter', type: 'checkbox', default: true },
            { name: 'inputCounterColor', label: 'inputCounterColor', type: 'color' },
            { name: 'inputCounterFontSize', label: 'inputCounterFontSize', type: 'number', default: 14 },
            { name: 'inputCounterFontFamily', label: 'inputCounterFontFamily', type: 'fontname' },
        ],
    },
    {
        name: 'icons',
        label: 'group_icons',
        fields: [
            { name: 'clearIconShow', label: 'clearIconShow', type: 'checkbox', default: true },
            { name: 'clearIcon', label: 'clearIcon', type: 'icon', default: 'close' },
            { name: 'clearIconSize', label: 'clearIconSize', type: 'number' },
            { name: 'clearIconColor', label: 'clearIconColor', type: 'color' },
            { name: 'collapseIcon', label: 'collapseIcon', type: 'icon', default: 'menu-down' },
            { name: 'collapseIconSize', label: 'collapseIconSize', type: 'number', default: 16 },
            { name: 'collapseIconColor', label: 'collapseIconColor', type: 'color' },
            { name: 'prepandIcon', label: 'prepandIcon', type: 'icon' },
            { name: 'prepandIconSize', label: 'prepandIconSize', type: 'number' },
            { name: 'prepandIconColor', label: 'prepandIconColor', type: 'color' },
            { name: 'prepandInnerIcon', label: 'prepandInnerIcon', type: 'icon' },
            { name: 'prepandInnerIconSize', label: 'prepandInnerIconSize', type: 'number' },
            { name: 'prepandInnerIconColor', label: 'prepandInnerIconColor', type: 'color' },
            { name: 'appendOuterIcon', label: 'appendOuterIcon', type: 'icon' },
            { name: 'appendOuterIconSize', label: 'appendOuterIconSize', type: 'number' },
            { name: 'appendOuterIconColor', label: 'appendOuterIconColor', type: 'color' },
        ],
    },
    {
        name: 'listData',
        label: 'group_listData',
        fields: [
            {
                name: 'listDataMethod',
                label: 'listDataMethod',
                type: 'select',
                options: ['inputPerEditor', 'jsonStringObject', 'multistatesObject', 'valueList'],
                default: 'inputPerEditor',
            },
            { name: 'countSelectItems', label: 'countSelectItems', type: 'number', default: 1 },
            { name: 'jsonStringObject', label: 'jsonStringObject', type: 'html' },
            { name: 'valueList', label: 'valueList', type: 'html' },
            { name: 'valueListLabels', label: 'valueListLabels', type: 'html' },
            { name: 'valueListIcons', label: 'valueListIcons', type: 'html' },
        ],
    },
    {
        name: 'selectListLayout',
        label: 'group_selectListLayout',
        fields: [
            {
                name: 'listPosition',
                label: 'listPosition',
                type: 'select',
                options: ['auto', 'top', 'bottom'],
                default: 'auto',
            },
            { name: 'listPositionOffset', label: 'listPositionOffset', type: 'checkbox' },
            { name: 'openOnClear', label: 'openOnClear', type: 'checkbox' },
            { name: 'listItemHeight', label: 'listItemHeight', type: 'number' },
            { name: 'listItemBackgroundColor', label: 'listItemBackgroundColor', type: 'color' },
            { name: 'listItemBackgroundHoverColor', label: 'listItemBackgroundHoverColor', type: 'color' },
            { name: 'listItemBackgroundSelectedColor', label: 'listItemBackgroundSelectedColor', type: 'color' },
            { name: 'listItemRippleEffectColor', label: 'listItemRippleEffectColor', type: 'color' },
            {
                name: 'showSelectedIcon',
                label: 'showSelectedIcon',
                type: 'select',
                options: ['no', 'prepend', 'prepend-inner', 'append-outer'],
                default: 'prepend-inner',
            },
            { name: 'listIconSize', label: 'listIconSize', type: 'number', default: 20 },
            { name: 'listIconColor', label: 'listIconColor', type: 'color' },
            { name: 'listIconHoverColor', label: 'listIconHoverColor', type: 'color' },
            { name: 'listIconSelectedColor', label: 'listIconSelectedColor', type: 'color' },
            { name: 'listItemFontSize', label: 'listItemFontSize', type: 'number', default: 16 },
            { name: 'listItemFont', label: 'listItemFont', type: 'fontname' },
            { name: 'listItemFontColor', label: 'listItemFontColor', type: 'color' },
            { name: 'listItemFontHoverColor', label: 'listItemFontHoverColor', type: 'color' },
            { name: 'listItemFontSelectedColor', label: 'listItemFontSelectedColor', type: 'color' },
            { name: 'listItemSubFontSize', label: 'listItemSubFontSize', type: 'number', default: 14 },
            { name: 'listItemSubFont', label: 'listItemSubFont', type: 'fontname' },
            { name: 'listItemSubFontColor', label: 'listItemSubFontColor', type: 'color' },
            { name: 'listItemSubFontHoverColor', label: 'listItemSubFontHoverColor', type: 'color' },
            { name: 'listItemSubFontSelectedColor', label: 'listItemSubFontSelectedColor', type: 'color' },
            { name: 'showValue', label: 'showValue', type: 'checkbox', default: true },
            { name: 'listItemValueFontSize', label: 'listItemValueFontSize', type: 'number', default: 14 },
            { name: 'listItemValueFont', label: 'listItemValueFont', type: 'fontname' },
            { name: 'listItemValueFontColor', label: 'listItemValueFontColor', type: 'color' },
            { name: 'listItemValueFontHoverColor', label: 'listItemValueFontHoverColor', type: 'color' },
            { name: 'listItemValueFontSelectedColor', label: 'listItemValueFontSelectedColor', type: 'color' },
        ],
    },
    {
        name: 'menuItems',
        label: 'group_menuItems',
        fields: [
            { name: 'value', label: 'value', type: 'text', index: 0 },
            { name: 'label', label: 'label', type: 'text', index: 0 },
            { name: 'subLabel', label: 'subLabel', type: 'text', index: 0 },
            { ...iconField('listIcon', 'listIcon'), index: 0 },
            { name: 'listIconColor', label: 'listIconColor', type: 'color', index: 0 },
            { name: 'imageColorSelectedTextField', label: 'imageColorSelectedTextField', type: 'color', index: 0 },
        ],
    },
];

function color(value: unknown, fallback: string): string {
    return cleanColor(value, fallback);
}

function itemFromData(
    data: SelectData,
    index: number,
    value: string | number | boolean,
    fallbackText: string,
): SelectItem {
    return {
        value,
        text: String(data[`label${index}`] || fallbackText),
        subText: String(data[`subLabel${index}`] || ''),
        icon: String(data[`listIcon${index}`] || ''),
        imageColor: String(data[`listIconColor${index}`] || ''),
        selectedImageColor: String(data[`imageColorSelectedTextField${index}`] || ''),
    };
}

function items(data: SelectData, objects: Record<string, ioBroker.Object>): SelectItem[] {
    if (data.listDataMethod === 'jsonStringObject') {
        try {
            const parsed = JSON.parse(String(data.jsonStringObject || '[]')) as Array<Record<string, unknown>>;
            return parsed
                .filter(item => item.value !== undefined && item.value !== null)
                .map(item => ({
                    value: item.value as string | number | boolean,
                    text: String(item.text ?? item.value),
                    subText: item.subText ? String(item.subText) : '',
                    icon: item.icon ? String(item.icon) : '',
                    imageColor: item.iconColor ? String(item.iconColor) : '',
                    selectedImageColor: item.iconColorSelectedTextField ? String(item.iconColorSelectedTextField) : '',
                }));
        } catch {
            return [];
        }
    }
    if (data.listDataMethod === 'valueList') {
        const values = String(data.valueList || '')
            .replace(/[\r\n]/g, '')
            .split(';');
        const labels = String(data.valueListLabels || '').split(';');
        const icons = String(data.valueListIcons || '').split(';');
        return values.filter(Boolean).map((value, index) => ({
            value,
            text: labels[index] || value,
            icon: icons[index] || '',
            imageColor: String(data[`listIconColor${index}`] || ''),
            selectedImageColor: String(data[`imageColorSelectedTextField${index}`] || ''),
        }));
    }
    if (data.listDataMethod === 'multistatesObject') {
        const states = objects[data.oid || '']?.common?.states;
        if (typeof states === 'string') {
            return states
                .split(';')
                .filter(Boolean)
                .map((entry, index) => {
                    const [value, ...text] = entry.split(':');
                    return itemFromData(data, index, value, text.join(':') || value);
                });
        }
        if (states && typeof states === 'object') {
            return Object.entries(states).map(([key, value], index) =>
                itemFromData(data, index, value as string | number | boolean, key.replace(/_/g, ' ')),
            );
        }
        return [];
    }
    const count = Math.max(0, num(data.countSelectItems, 1));
    return Array.from({ length: count + 1 }, (_, index) => {
        const value = data[`value${index}`];
        return value === undefined || value === null
            ? null
            : itemFromData(data, index, value as string | number | boolean, String(value));
    }).filter((item): item is SelectItem => !!item);
}

export default class MaterialDesignSelect extends VisWidget {
    private open = false;
    private localValue: ioBroker.StateValue | undefined;
    private seenStateValue: ioBroker.StateValue | undefined;
    private hoveredValue: string | undefined;
    private readonly rootRef = React.createRef<HTMLDivElement>();
    // Autocomplete subclass sets this true to render a typeable filter input.
    protected isAutocomplete = false;
    private filterText: string | undefined;

    private commitValue(value: ioBroker.StateValue, oid: string): void {
        this.localValue = value;
        setStateValue(this.props, oid, value);
        this.filterText = undefined;
        this.open = false;
        this.forceUpdate();
    }

    private onAutocompleteKey(event: React.KeyboardEvent, list: SelectItem[], data: SelectData): void {
        if (event.key === 'Escape') {
            this.filterText = undefined;
            this.open = false;
            this.forceUpdate();
            return;
        }
        if (event.key !== 'Enter') {
            return;
        }
        const ft = this.filterText;
        if (ft === undefined || ft === '') {
            this.filterText = undefined;
            this.open = false;
            this.forceUpdate();
            return;
        }
        const match = list.find(item => item.text.toLowerCase().includes(ft.toLowerCase()));
        if (match) {
            this.commitValue(match.value, data.oid || '');
        } else if (data.inputMode === 'write' && ft !== '') {
            this.commitValue(ft, data.oid || '');
        } else {
            this.filterText = undefined;
            this.open = false;
            this.forceUpdate();
        }
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.widDiv?.style.setProperty('overflow', 'visible', 'important');
        this.rootRef.current?.parentElement?.style.setProperty('overflow', 'visible', 'important');
        this.rootRef.current?.parentElement?.parentElement?.style.setProperty('overflow', 'visible', 'important');
    }

    static getWidgetInfo(): RxWidgetInfo {
        return {
            ...createInfo('tplVis2-materialdesign-Select', 'Select', attrs),
            visPrev: squarePreview('F1400'),
            visDefaultStyle: { width: 150, height: 38 },
        };
    }

    getWidgetInfo(): RxWidgetInfo {
        return MaterialDesignSelect.getWidgetInfo();
    }

    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as SelectData;
        const list = items(data, this.props.context?.objects || {});
        const state = stateValue(this.state as VisRxWidgetState, data.oid || '');
        if (state !== this.seenStateValue) {
            this.seenStateValue = state;
            this.localValue = undefined;
        }
        const current = this.localValue ?? state;
        const selected = list.find(item => String(item.value) === String(current));
        const filter = this.isAutocomplete ? this.filterText : undefined;
        const visibleList = filter ? list.filter(item => item.text.toLowerCase().includes(filter.toLowerCase())) : list;
        const active = this.open || (current !== undefined && current !== null && current !== '');
        const border = color(
            this.open ? data.inputLayoutBorderColorSelected : data.inputLayoutBorderColor,
            this.open ? '#44739e' : 'rgba(0, 0, 0, 0.54)',
        );
        // Outlined box uses a lighter resting border to match the old widget (0.2), not the darker underline default (0.54).
        const outlinedBorder = color(
            this.open ? data.inputLayoutBorderColorSelected : data.inputLayoutBorderColor,
            this.open ? '#44739e' : 'rgba(0, 0, 0, 0.24)',
        );
        const activeLabelFontSize = Math.max(10, num(data.inputLabelFontSize, 16) * 0.75);
        const textColor = color(data.inputTextColor, '#000000');
        const isTop = data.listPosition === 'top';
        const lay = data.inputLayout || 'regular';
        const outlined = lay.includes('outlined');
        const solo = lay.includes('solo');
        const filled = lay.includes('filled');
        const rounded = lay.includes('rounded');
        const enclosed = outlined || solo;
        const selectedSlot = data.showSelectedIcon || 'prepend-inner';
        const configuredIcon =
            selectedSlot === 'prepend'
                ? data.prepandIcon
                : selectedSlot === 'prepend-inner'
                  ? data.prepandInnerIcon
                  : data.appendOuterIcon;
        const configuredColor =
            selectedSlot === 'prepend'
                ? data.prepandIconColor
                : selectedSlot === 'prepend-inner'
                  ? data.prepandInnerIconColor
                  : data.appendOuterIconColor;
        const configuredSize =
            selectedSlot === 'prepend'
                ? data.prepandIconSize
                : selectedSlot === 'prepend-inner'
                  ? data.prepandInnerIconSize
                  : data.appendOuterIconSize;
        const selectedIcon =
            selectedSlot === 'no'
                ? null
                : renderIcon(
                      configuredIcon || selected?.icon || '',
                      color(configuredColor || selected?.selectedImageColor || selected?.imageColor, '#44739e'),
                      num(configuredSize, num(data.listIconSize, 20)),
                      !!(configuredColor || selected?.selectedImageColor || selected?.imageColor),
                  );
        let openUp = isTop;
        if (this.open && data.listPosition === 'auto' && typeof window !== 'undefined' && this.rootRef.current) {
            const rect = this.rootRef.current.getBoundingClientRect();
            const itemH = num(data.listItemHeight, 40) || 40;
            const menuH = Math.min(300, list.length * itemH + 8);
            const spaceBelow = window.innerHeight - rect.bottom;
            openUp = spaceBelow < menuH && rect.top > spaceBelow;
        }
        // Autocomplete uses a plain div field so its editable filter input stays typeable (an input nested in a <button> is not).
        const FieldTag = this.isAutocomplete ? 'div' : 'button';
        return (
            <div
                className="materialdesign-widget materialdesign-select"
                ref={this.rootRef}
                style={{ height: '100%', overflow: 'visible', position: 'relative', width: '100%' }}
            >
                <div
                    className="materialdesign-vuetify-select"
                    style={{ boxSizing: 'border-box', height: '100%', position: 'relative', width: '100%' }}
                >
                    <FieldTag
                        aria-expanded={this.open}
                        className="v-input v-input--dense v-select theme--light"
                        onClick={() => {
                            this.open = !this.open;
                            this.forceUpdate();
                        }}
                        style={{
                            alignItems: 'center',
                            background: color(
                                data.inputLayoutBackgroundColor,
                                filled ? 'rgba(0, 0, 0, 0.06)' : 'transparent',
                            ),
                            border: 0,
                            borderBottom: enclosed ? 0 : `1px solid ${border}`,
                            borderRadius: rounded ? 28 : enclosed ? 4 : filled ? '4px 4px 0 0' : undefined,
                            boxShadow: solo
                                ? '0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12)'
                                : undefined,
                            boxSizing: 'border-box',
                            color: textColor,
                            cursor: 'pointer',
                            display: 'flex',
                            fontFamily: data.inputTextFontFamily || 'inherit',
                            height: '100%',
                            padding: '0 10px',
                            position: 'relative',
                            textAlign: data.inputAlignment || 'left',
                            width: '100%',
                        }}
                        {...(this.isAutocomplete ? {} : { type: 'button' as const })}
                    >
                        {outlined ? (
                            <fieldset
                                aria-hidden="true"
                                style={{
                                    backgroundColor: 'transparent',
                                    borderColor: outlinedBorder,
                                    borderRadius: rounded ? 28 : 4,
                                    borderStyle: 'solid',
                                    borderWidth: this.open ? 2 : 1,
                                    bottom: -2,
                                    left: 0,
                                    margin: 0,
                                    padding: '0 8px',
                                    pointerEvents: 'none',
                                    position: 'absolute',
                                    right: 0,
                                    top: -5,
                                }}
                            >
                                <legend
                                    style={{
                                        fontFamily: data.inputLabelFontFamily || 'inherit',
                                        fontSize: activeLabelFontSize,
                                        height: 11,
                                        lineHeight: '11px',
                                        padding: 0,
                                        width: active && data.inputLabelText ? 'auto' : 0,
                                    }}
                                >
                                    {active && data.inputLabelText ? (
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                padding: '0 4px',
                                                visibility: 'hidden',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {data.inputLabelText}
                                        </span>
                                    ) : null}
                                </legend>
                            </fieldset>
                        ) : null}
                        {data.prepandIcon && selectedSlot !== 'prepend' ? (
                            <span style={{ flex: '0 0 auto', marginRight: 4 }}>
                                {renderIcon(
                                    data.prepandIcon,
                                    color(data.prepandIconColor, '#44739e'),
                                    num(data.prepandIconSize, 16),
                                    !!data.prepandIconColor,
                                )}
                            </span>
                        ) : null}
                        {data.inputPrefix ? (
                            <span
                                style={{
                                    color: color(data.inputAppendixColor, textColor),
                                    fontFamily: data.inputAppendixFontFamily || undefined,
                                    fontSize: sizeCss(data.inputAppendixFontSize, 14),
                                    marginRight: 4,
                                }}
                            >
                                {data.inputPrefix}
                            </span>
                        ) : null}
                        {selectedIcon && selectedSlot === 'prepend' ? (
                            <span style={{ flex: '0 0 auto', marginRight: 4 }}>{selectedIcon}</span>
                        ) : null}
                        <span style={{ flex: '1 1 auto', minWidth: 0, paddingTop: active ? 11 : 0 }}>
                            {selectedIcon && selectedSlot === 'prepend-inner' ? (
                                <span style={{ display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }}>
                                    {selectedIcon}
                                </span>
                            ) : null}
                            {data.inputLabelText ? (
                                <span
                                    style={{
                                        color: color(
                                            this.open ? data.inputLabelColorSelected : data.inputLabelColor,
                                            'rgba(0, 0, 0, 0.54)',
                                        ),
                                        fontFamily: data.inputLabelFontFamily || 'inherit',
                                        fontSize: active ? activeLabelFontSize : sizeCss(data.inputLabelFontSize, 16),
                                        left: 12,
                                        position: 'absolute',
                                        top: active ? (outlined ? -4 : 1) : 9,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {data.inputLabelText}
                                </span>
                            ) : null}
                            {this.isAutocomplete ? (
                                <input
                                    onBlur={() => {
                                        window.setTimeout(() => {
                                            if (this.filterText !== undefined) {
                                                this.filterText = undefined;
                                                this.forceUpdate();
                                            }
                                        }, 150);
                                    }}
                                    onChange={event => {
                                        this.filterText = event.target.value;
                                        this.open = true;
                                        this.forceUpdate();
                                    }}
                                    onClick={event => {
                                        event.stopPropagation();
                                        if (this.filterText === undefined) {
                                            this.filterText = '';
                                        }
                                        this.open = true;
                                        this.forceUpdate();
                                    }}
                                    onFocus={() => {
                                        if (this.filterText === undefined) {
                                            this.filterText = '';
                                        }
                                        this.open = true;
                                        this.forceUpdate();
                                    }}
                                    onKeyDown={event => this.onAutocompleteKey(event, list, data)}
                                    placeholder={selected?.text || ''}
                                    style={{
                                        background: 'transparent',
                                        border: 0,
                                        color: textColor,
                                        display: 'block',
                                        fontFamily: data.inputTextFontFamily || 'inherit',
                                        fontSize: sizeCss(data.inputTextFontSize, 16),
                                        outline: 'none',
                                        padding: 0,
                                        textOverflow: 'ellipsis',
                                        width: '100%',
                                    }}
                                    type="text"
                                    value={this.filterText ?? (selected?.text || '')}
                                />
                            ) : (
                                <span
                                    style={{
                                        display: 'block',
                                        fontFamily: data.inputTextFontFamily || 'inherit',
                                        fontSize: sizeCss(data.inputTextFontSize, 16),
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {selected?.text || ''}
                                </span>
                            )}
                        </span>
                        {data.inputSuffix ? (
                            <span
                                style={{
                                    color: color(data.inputAppendixColor, textColor),
                                    fontFamily: data.inputAppendixFontFamily || undefined,
                                    fontSize: sizeCss(data.inputAppendixFontSize, 14),
                                    marginLeft: 4,
                                }}
                            >
                                {data.inputSuffix}
                            </span>
                        ) : null}
                        {data.clearIconShow && current !== undefined && current !== null && current !== '' ? (
                            <button
                                aria-label="clear"
                                onClick={event => {
                                    event.stopPropagation();
                                    this.localValue = '';
                                    setStateValue(this.props, data.oid || '', '');
                                    this.filterText = undefined;
                                    this.open = !!data.openOnClear;
                                    this.forceUpdate();
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 0,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    marginLeft: 4,
                                    padding: 2,
                                }}
                                type="button"
                            >
                                {renderIcon(
                                    data.clearIcon || 'close',
                                    color(data.clearIconColor, '#44739e'),
                                    num(data.clearIconSize, 16),
                                    !!data.clearIconColor,
                                )}
                            </button>
                        ) : null}
                        <span style={{ flex: '0 0 auto', marginLeft: 6 }}>
                            {renderIcon(
                                data.collapseIcon || 'menu-down',
                                color(data.collapseIconColor, '#44739e'),
                                num(data.collapseIconSize, 16),
                                !!data.collapseIconColor,
                            )}
                        </span>
                        {selectedIcon && selectedSlot === 'append-outer' ? (
                            <span style={{ flex: '0 0 auto', marginLeft: 4 }}>{selectedIcon}</span>
                        ) : null}
                    </FieldTag>
                    {this.open ? (
                        <div
                            className="v-menu__content v-select-list"
                            style={{
                                background: color(data.listItemBackgroundColor, '#FFFFFF'),
                                bottom: openUp ? (data.listPositionOffset ? '100%' : 'calc(100% + 4px)') : undefined,
                                boxShadow: '0 4px 6px rgba(32, 33, 36, 0.28)',
                                left: 0,
                                maxHeight: 300,
                                minWidth: '100%',
                                overflowY: 'auto',
                                position: 'absolute',
                                top: openUp ? undefined : data.listPositionOffset ? '100%' : 'calc(100% + 4px)',
                                zIndex: 1000,
                            }}
                        >
                            {visibleList.map(item => {
                                const isSelected = String(item.value) === String(current);
                                const isHovered = this.hoveredValue === String(item.value);
                                const itemColor = isSelected
                                    ? color(data.listItemFontSelectedColor, '#44739e')
                                    : color(
                                          isHovered ? data.listItemFontHoverColor : data.listItemFontColor,
                                          textColor,
                                      );
                                const background = isSelected
                                    ? color(data.listItemBackgroundSelectedColor, 'rgba(68, 115, 158, 0.12)')
                                    : isHovered
                                      ? color(data.listItemBackgroundHoverColor, 'rgba(0, 0, 0, 0.04)')
                                      : color(data.listItemBackgroundColor, '#FFFFFF');
                                return (
                                    <button
                                        key={String(item.value)}
                                        className={`v-list-item${isSelected ? ' v-list-item--active' : ''}`}
                                        onClick={() => {
                                            this.localValue = item.value;
                                            setStateValue(this.props, data.oid || '', item.value);
                                            this.filterText = undefined;
                                            this.open = false;
                                            this.forceUpdate();
                                        }}
                                        onMouseEnter={() => {
                                            this.hoveredValue = String(item.value);
                                            this.forceUpdate();
                                        }}
                                        onMouseLeave={() => {
                                            this.hoveredValue = undefined;
                                            this.forceUpdate();
                                        }}
                                        style={{
                                            alignItems: 'center',
                                            background,
                                            border: 0,
                                            boxSizing: 'border-box',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            minHeight: num(data.listItemHeight, 40) || 40,
                                            padding: '6px 12px',
                                            textAlign: 'left',
                                            width: '100%',
                                        }}
                                        type="button"
                                    >
                                        {item.icon ? (
                                            <span style={{ flex: '0 0 auto', marginRight: 12 }}>
                                                {renderIcon(
                                                    item.icon,
                                                    color(
                                                        isSelected
                                                            ? data.listIconSelectedColor
                                                            : isHovered
                                                              ? data.listIconHoverColor
                                                              : item.imageColor,
                                                        color(data.listIconColor, '#44739e'),
                                                    ),
                                                    num(data.listIconSize, 20),
                                                    !!item.imageColor,
                                                )}
                                            </span>
                                        ) : null}
                                        <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                                            <span
                                                className="materialdesign-v-list-item-title"
                                                style={{
                                                    color: itemColor,
                                                    display: 'block',
                                                    fontFamily: data.listItemFont || undefined,
                                                    fontSize: sizeCss(data.listItemFontSize, 16),
                                                }}
                                            >
                                                {item.text}
                                            </span>
                                            {item.subText ? (
                                                <span
                                                    className="materialdesign-v-list-item-subtitle"
                                                    style={{
                                                        color: color(
                                                            isSelected
                                                                ? data.listItemSubFontSelectedColor
                                                                : isHovered
                                                                  ? data.listItemSubFontHoverColor
                                                                  : data.listItemSubFontColor,
                                                            itemColor,
                                                        ),
                                                        display: 'block',
                                                        fontFamily: data.listItemSubFont || undefined,
                                                        fontSize: sizeCss(data.listItemSubFontSize, 14),
                                                    }}
                                                >
                                                    {item.subText}
                                                </span>
                                            ) : null}
                                        </span>
                                        {data.showValue ? (
                                            <span
                                                className="materialdesign-v-list-item-value"
                                                style={{
                                                    color: color(
                                                        isSelected
                                                            ? data.listItemValueFontSelectedColor
                                                            : isHovered
                                                              ? data.listItemValueFontHoverColor
                                                              : data.listItemValueFontColor,
                                                        itemColor,
                                                    ),
                                                    fontFamily: data.listItemValueFont || undefined,
                                                    fontSize: sizeCss(data.listItemValueFontSize, 14),
                                                    marginLeft: 8,
                                                }}
                                            >
                                                {String(item.value)}
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }
}
