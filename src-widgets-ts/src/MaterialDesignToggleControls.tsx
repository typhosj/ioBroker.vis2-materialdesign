import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import { RenderProps, VisWidget, createInfo, parseActionValue, setStateValue, stateValue } from './widgetUtils';

export interface ToggleControlData {
    oid?: string;
    readOnly?: boolean;
    toggleType?: 'boolean' | 'value';
    valueOff?: string;
    valueOn?: string;
    stateIfNotTrueValue?: 'on' | 'off';
    vibrateOnMobilDevices?: number;
    clickSoundPlay?: boolean;
    clickSoundVolume?: number;
    labelFalse?: string;
    labelTrue?: string;
    labelPosition?: 'left' | 'right' | 'off';
    labelClickActive?: boolean;
    valueFontFamily?: string;
    valueFontSize?: number;
    labelColorFalse?: string;
    labelColorTrue?: string;
    colorCheckBox?: string;
    colorCheckBoxBorder?: string;
    colorCheckBoxHover?: string;
    colorSwitchThumb?: string;
    colorSwitchTrack?: string;
    colorSwitchTrue?: string;
    colorSwitchHover?: string;
    colorSwitchHoverTrue?: string;
    lockEnabled?: boolean;
    autoLockAfter?: number;
    lockIcon?: string;
    lockIconTop?: number;
    lockIconLeft?: number;
    lockIconSize?: number;
    lockIconColor?: string;
    lockFilterGrayscale?: number;
}

type ControlKind = 'checkbox' | 'switch';

interface ControlDefinition {
    id: string;
    name: string;
    kind: ControlKind;
}

const baseFields = [
    { name: 'oid', label: 'oid', type: 'id' },
    { name: 'readOnly', label: 'readOnly', type: 'checkbox' },
    { name: 'toggleType', label: 'toggleType', type: 'select', options: ['boolean', 'value'], default: 'boolean' },
    { name: 'valueOff', label: 'valueOff', type: 'text' },
    { name: 'valueOn', label: 'valueOn', type: 'text' },
    { name: 'stateIfNotTrueValue', label: 'stateIfNotTrueValue', type: 'select', options: ['on', 'off'], default: 'on' },
    { name: 'vibrateOnMobilDevices', label: 'vibrateOnMobilDevices', type: 'number', default: 50 },
    { name: 'clickSoundPlay', label: 'clickSoundPlay', type: 'checkbox' },
    { name: 'clickSoundVolume', label: 'clickSoundVolume', type: 'slider', min: 0, max: 1, step: 0.1, default: 0.5 },
    { name: 'debug', label: 'debug', type: 'checkbox' },
];

const labelFields = [
    { name: 'labelFalse', label: 'labelFalse', type: 'html' },
    { name: 'labelTrue', label: 'labelTrue', type: 'html' },
    { name: 'labelPosition', label: 'labelPosition', type: 'select', options: ['left', 'right', 'off'], default: 'right' },
    { name: 'labelClickActive', label: 'labelClickActive', type: 'checkbox', default: true },
    { name: 'valueFontFamily', label: 'valueFontFamily', type: 'fontname' },
    { name: 'valueFontSize', label: 'valueFontSize', type: 'number' },
];

const lockFields = [
    { name: 'lockEnabled', label: 'lockEnabled', type: 'checkbox' },
    { name: 'autoLockAfter', label: 'autoLockAfter', type: 'number', default: 10 },
    { name: 'lockIcon', label: 'lockIcon', type: 'icon', default: 'lock-outline' },
    { name: 'lockIconTop', label: 'lockIconTop', type: 'slider', min: 0, max: 100, step: 1, default: 5 },
    { name: 'lockIconLeft', label: 'lockIconLeft', type: 'slider', min: 0, max: 100, step: 1, default: 5 },
    { name: 'lockIconSize', label: 'lockIconSize', type: 'number' },
    { name: 'lockIconColor', label: 'lockIconColor', type: 'color' },
    { name: 'lockFilterGrayscale', label: 'lockFilterGrayscale', type: 'slider', min: 0, max: 100, step: 1, default: 30 },
];

function attrs(kind: ControlKind): RxWidgetInfo['visAttrs'] {
    const colorFields =
        kind === 'switch'
            ? [
                  { name: 'colorSwitchThumb', label: 'colorSwitchThumb', type: 'color' },
                  { name: 'colorSwitchTrack', label: 'colorSwitchTrack', type: 'color' },
                  { name: 'colorSwitchTrue', label: 'colorSwitchTrue', type: 'color' },
                  { name: 'colorSwitchHover', label: 'colorSwitchHover', type: 'color' },
                  { name: 'colorSwitchHoverTrue', label: 'colorSwitchHoverTrue', type: 'color' },
                  { name: 'labelColorFalse', label: 'labelColorFalse', type: 'color' },
                  { name: 'labelColorTrue', label: 'labelColorTrue', type: 'color' },
              ]
            : [
                  { name: 'colorCheckBox', label: 'colorCheckBox', type: 'color' },
                  { name: 'colorCheckBoxBorder', label: 'colorCheckBoxBorder', type: 'color' },
                  { name: 'colorCheckBoxHover', label: 'colorCheckBoxHover', type: 'color' },
                  { name: 'labelColorFalse', label: 'labelColorFalse', type: 'color' },
                  { name: 'labelColorTrue', label: 'labelColorTrue', type: 'color' },
              ];

    return [
        { name: 'common', label: 'group_common', fields: baseFields },
        { name: 'label', label: 'group_label', fields: labelFields },
        { name: 'color', label: 'group_color', fields: colorFields },
        { name: 'lock', label: 'group_lock', fields: lockFields },
    ] as RxWidgetInfo['visAttrs'];
}

function asNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function color(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value : fallback;
}

function isSameValue(a: ioBroker.StateValue | undefined, b: unknown): boolean {
    if (a !== '' && b !== '' && !Number.isNaN(Number(a)) && !Number.isNaN(Number(b))) {
        return Number(a) === Number(b);
    }
    return a === b || a === parseActionValue(String(b ?? ''));
}

function isOn(value: ioBroker.StateValue | undefined, data: ToggleControlData): boolean {
    if ((data.toggleType || 'boolean') === 'boolean') {
        return value === true;
    }
    if (isSameValue(value, data.valueOn)) {
        return true;
    }
    if (data.stateIfNotTrueValue === 'on' && !isSameValue(value, data.valueOff)) {
        return true;
    }
    return false;
}

function writeValue(props: VisRxWidgetProps, data: ToggleControlData, on: boolean): void {
    if ((data.toggleType || 'boolean') === 'boolean') {
        setStateValue(props, data.oid || '', on);
        return;
    }
    setStateValue(props, data.oid || '', parseActionValue(String(on ? data.valueOn : data.valueOff)));
}

function feedback(data: ToggleControlData): void {
    const vibrate = asNumber(data.vibrateOnMobilDevices, 0);
    if (vibrate > 0 && navigator.vibrate) {
        navigator.vibrate(vibrate);
    }
    if (data.clickSoundPlay) {
        const audio = new Audio('widgets/vis2-materialdesign/materialdesign-widgets-click-sound.mp3');
        audio.volume = Math.max(0, Math.min(1, asNumber(data.clickSoundVolume, 0.5)));
        void audio.play().catch(() => undefined);
    }
}

function preview(def: ControlDefinition): string {
    if (def.kind === 'switch') {
        return `<div id="prev_tplVis-materialdesign-Switch" style="position: relative; text-align: initial; display: flex; justify-content:center;"><div class="vis-widget_prev materialdesign-widget mdc-form-field materialdesign-switch vis-tpl-materialdesign-Switch " style="width: 80px; height: 50px; overflow: visible !important; left: 165px; top: 158px; position: absolute;" islocked="false"> <div class="mdc-switch mdc-switch--checked" style="margin-left: 10px; margin-right: 10px; --materialdesign-color-switch-on:#44739e; --materialdesign-color-switch-on-hover:#44739e; --materialdesign-color-switch-off:#FFFFFF; --materialdesign-color-switch-track:#000000; --materialdesign-color-switch-off-hover:#44739e;"> <div class="mdc-switch__track"></div> <div class="mdc-switch__thumb-underlay mdc-ripple-upgraded mdc-ripple-upgraded--unbounded" style="--mdc-ripple-fg-size:28px; --mdc-ripple-fg-scale:1.7142857142857142; --mdc-ripple-left:10px; --mdc-ripple-top:10px;"> <div class="mdc-switch__thumb"> <input class="mdc-switch__native-control" id="materialdesign-checkbox-switch-1es7mmcle" type="checkbox" role="switch"> </div> </div> </div> <label id="label" for="materialdesign-checkbox-switch-1es7mmcle" style="width: 100%; cursor: pointer; font-family: RobotoCondensed-Regular; font-size: 16px; color: rgb(68, 115, 158);">on</label> <div class="ui-resizable-handle ui-resizable-n" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-w" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-nw" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-ne" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-sw" style="z-index: 90;"></div></div></div>`;
    }
    return `<div id="prev_tplVis-materialdesign-CheckBox" style="position: relative; text-align: initial; display: flex; justify-content:center;"><div class="vis-widget_prev materialdesign-widget mdc-form-field materialdesign-checkbox vis-tpl-materialdesign-Checkbox " style="width: 76px; height: 50px; overflow: visible !important; left: 49px; top: 27px; position: absolute; z-index: 4; pointer-events: none;" islocked="false" data-tmodified="true" data-zmodified="true"> <div class="mdc-checkbox mdc-checkbox--upgraded mdc-checkbox--selected mdc-ripple-upgraded mdc-ripple-upgraded--unbounded" style="--materialdesign-color-checkbox:#44739e; --materialdesign-color-checkbox-border:rgba(0, 0, 0, 0.54); --materialdesign-color-checkbox-hover:#44739e; --mdc-ripple-fg-size:24px; --mdc-ripple-fg-scale:1.6666666666666667; --mdc-ripple-left:8px; --mdc-ripple-top:8px;"> <input type="checkbox" class="mdc-checkbox__native-control" id="materialdesign-checkbox-1es7mspuu"> <div class="mdc-checkbox__background"> <svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"> <path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59"></path> </svg> <div class="mdc-checkbox__mixedmark"></div> </div> <div class="mdc-checkbox__ripple"></div> </div> <label id="label" for="materialdesign-checkbox-1es7mspuu" style="width: 100%; cursor: pointer; font-family: RobotoCondensed-Regular; font-size: 16px; color: rgb(68, 115, 158);">on</label> <div class="ui-resizable-handle ui-resizable-n" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-w" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-nw" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-ne" style="z-index: 90;"></div><div class="ui-resizable-handle ui-resizable-sw" style="z-index: 90;"></div></div></div>`;
}

export function createToggleControlClass(def: ControlDefinition): typeof VisWidget {
    return class MaterialDesignToggleControl extends VisWidget {
        private unlocked = false;
        private lockTimer: number | undefined;

        constructor(props: VisRxWidgetProps) {
            super(props);
        }

        static getWidgetInfo(): RxWidgetInfo {
            return {
                ...createInfo(def.id, def.name, attrs(def.kind)),
                visPrev: preview(def),
                visDefaultStyle: {
                    width: def.kind === 'switch' ? 80 : 76,
                    height: 50,
                },
            };
        }

        getWidgetInfo(): RxWidgetInfo {
            return MaterialDesignToggleControl.getWidgetInfo();
        }

        componentWillUnmount(): void {
            if (this.lockTimer) {
                window.clearTimeout(this.lockTimer);
            }
            super.componentWillUnmount?.();
        }

        private unlock(data: ToggleControlData): void {
            this.unlocked = true;
            if (this.lockTimer) {
                window.clearTimeout(this.lockTimer);
            }
            this.lockTimer = window.setTimeout(() => {
                this.unlocked = false;
                this.forceUpdate();
            }, asNumber(data.autoLockAfter, 10) * 1000);
            this.forceUpdate();
        }

        renderWidgetBody(props: RenderProps): React.JSX.Element {
            super.renderWidgetBody(props);
            const data = this.state.rxData as ToggleControlData;
            const on = isOn(stateValue(this.state as VisRxWidgetState, data.oid || ''), data);
            const locked = !!data.lockEnabled && !this.unlocked;
            const label = on ? data.labelTrue || data.labelFalse || '' : data.labelFalse || '';
            const labelPosition = data.labelPosition || 'right';
            const labelElement =
                labelPosition === 'off' ? null : (
                    <span
                        style={{
                            color: color(on ? data.labelColorTrue : data.labelColorFalse, '#44739e'),
                            cursor: data.labelClickActive === false ? 'default' : 'pointer',
                            fontFamily: data.valueFontFamily || undefined,
                            fontSize: data.valueFontSize ? `${data.valueFontSize}px` : undefined,
                            width: '100%',
                        }}
                    >
                        {label}
                    </span>
                );

            const toggle = (): void => {
                feedback(data);
                if (locked) {
                    this.unlock(data);
                    return;
                }
                if (!data.readOnly) {
                    writeValue(this.props, data, !on);
                }
            };

            const controlFilter = locked ? `grayscale(${asNumber(data.lockFilterGrayscale, 0)}%)` : undefined;
            const control =
                def.kind === 'switch' ? (
                    <div
                        aria-checked={on}
                        className={`mdc-switch${on ? ' mdc-switch--checked' : ''}`}
                        role="switch"
                        style={{
                            filter: controlFilter,
                            marginLeft: 10,
                            marginRight: 10,
                            position: 'relative',
                            width: 36,
                            height: 20,
                            flex: '0 0 auto',
                            ['--materialdesign-color-switch-on' as string]: color(data.colorSwitchTrue, '#44739e'),
                            ['--materialdesign-color-switch-on-hover' as string]: color(data.colorSwitchHoverTrue, color(data.colorSwitchTrue, '#44739e')),
                            ['--materialdesign-color-switch-off' as string]: color(data.colorSwitchThumb, '#FFFFFF'),
                            ['--materialdesign-color-switch-track' as string]: color(data.colorSwitchTrack, '#000000'),
                            ['--materialdesign-color-switch-off-hover' as string]: color(data.colorSwitchHover, '#44739e'),
                        }}
                    >
                        <div
                            className="mdc-switch__track"
                            style={{
                                background: on ? color(data.colorSwitchTrue, '#44739e') : color(data.colorSwitchTrack, '#000000'),
                                borderRadius: 7,
                                height: 14,
                                left: 0,
                                opacity: on ? 0.54 : 0.38,
                                position: 'absolute',
                                top: 3,
                                width: 36,
                            }}
                        />
                        <div
                            className="mdc-switch__thumb-underlay mdc-ripple-upgraded mdc-ripple-upgraded--unbounded"
                            style={{
                                height: 28,
                                left: on ? 16 : -4,
                                position: 'absolute',
                                top: -4,
                                transition: 'left 120ms ease',
                                width: 28,
                            }}
                        >
                            <div
                                className="mdc-switch__thumb"
                                style={{
                                    background: on ? color(data.colorSwitchTrue, '#44739e') : color(data.colorSwitchThumb, '#FFFFFF'),
                                    borderRadius: '50%',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                                    height: 20,
                                    left: 4,
                                    position: 'absolute',
                                    top: 4,
                                    width: 20,
                                }}
                            >
                                <input
                                    checked={on}
                                    className="mdc-switch__native-control"
                                    disabled={!!data.readOnly}
                                    onChange={() => undefined}
                                    role="switch"
                                    style={{ opacity: 0 }}
                                    type="checkbox"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        aria-checked={on}
                        className={`mdc-checkbox mdc-checkbox--upgraded${on ? ' mdc-checkbox--selected' : ''} mdc-ripple-upgraded mdc-ripple-upgraded--unbounded`}
                        role="checkbox"
                        style={{
                            filter: controlFilter,
                            flex: '0 0 auto',
                            height: 40,
                            marginLeft: 10,
                            marginRight: 10,
                            position: 'relative',
                            width: 40,
                            ['--materialdesign-color-checkbox' as string]: color(data.colorCheckBox, '#44739e'),
                            ['--materialdesign-color-checkbox-border' as string]: color(data.colorCheckBoxBorder, 'rgba(0, 0, 0, 0.54)'),
                            ['--materialdesign-color-checkbox-hover' as string]: color(data.colorCheckBoxHover, '#44739e'),
                        }}
                    >
                        <input
                            checked={on}
                            className="mdc-checkbox__native-control"
                            disabled={!!data.readOnly}
                            onChange={() => undefined}
                            style={{ opacity: 0, position: 'absolute' }}
                            type="checkbox"
                        />
                        <div
                            className="mdc-checkbox__background"
                            style={{
                                background: on ? color(data.colorCheckBox, '#44739e') : 'transparent',
                                border: `2px solid ${on ? color(data.colorCheckBox, '#44739e') : color(data.colorCheckBoxBorder, 'rgba(0, 0, 0, 0.54)')}`,
                                borderRadius: 2,
                                boxSizing: 'border-box',
                                height: 18,
                                left: 11,
                                position: 'absolute',
                                top: 11,
                                width: 18,
                            }}
                        >
                            <svg
                                className="mdc-checkbox__checkmark"
                                style={{ height: '100%', inset: 0, opacity: on ? 1 : 0, position: 'absolute', width: '100%' }}
                                viewBox="0 0 24 24"
                            >
                                <path className="mdc-checkbox__checkmark-path" d="M1.73,12.91 8.1,19.28 22.79,4.59" fill="none" stroke="#fff" strokeWidth="3.12" />
                            </svg>
                            <div className="mdc-checkbox__mixedmark" />
                        </div>
                        <div className="mdc-checkbox__ripple" />
                    </div>
                );

            return (
                <div
                    className={`materialdesign-widget mdc-form-field materialdesign-${def.kind}${labelPosition === 'left' ? ' mdc-form-field--align-end' : ''}`}
                    onClick={toggle}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggle();
                        }
                    }}
                    role="button"
                    style={{
                        alignItems: 'center',
                        boxSizing: 'border-box',
                        cursor: data.readOnly && !locked ? 'default' : 'pointer',
                        display: 'flex',
                        flexDirection: labelPosition === 'left' ? 'row-reverse' : 'row',
                        height: '100%',
                        overflow: 'visible',
                        position: 'relative',
                        width: '100%',
                    }}
                    tabIndex={0}
                >
                    {control}
                    {labelElement}
                    {locked ? (
                        <span
                            className={`mdi mdi-${data.lockIcon || 'lock-outline'}`}
                            style={{
                                color: color(data.lockIconColor, '#B22222'),
                                fontSize: data.lockIconSize ? `${data.lockIconSize}px` : undefined,
                                left: `${asNumber(data.lockIconLeft, 5)}%`,
                                position: 'absolute',
                                top: `${asNumber(data.lockIconTop, 5)}%`,
                            }}
                        />
                    ) : null}
                </div>
            );
        }
    };
}
