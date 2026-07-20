import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps, VisRxWidgetState } from '@iobroker/types-vis-2';

import { squarePreview, RenderProps, VisWidget, createInfo, parseActionValue, setStateValue, sizeCss, stateValue } from './widgetUtils';

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
    { name: 'labelFalse', label: 'labelFalse', type: 'text' },
    { name: 'labelTrue', label: 'labelTrue', type: 'text' },
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
    return squarePreview(def.kind === 'switch' ? 'F0A1A' : 'F0135');
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
            // The switch keeps a small gap between control and label like VIS1 (margin 0 10px).
            const switchMargin = labelPosition === 'off' ? 0 : 10;
            const labelElement =
                labelPosition === 'off' ? null : (
                    <span
                        style={{
                            alignItems: 'center',
                            color: color(on ? data.labelColorTrue : data.labelColorFalse, '#44739e'),
                            cursor: data.labelClickActive === false ? 'default' : 'pointer',
                            display: 'inline-flex',
                            // Grow to fill: VIS1 spreads label and control apart in a wide widget (label at the far
                            // edge, control at the other). `1 1 auto` replicates that spread; a content-sized label
                            // would hug the control and MISMATCH old. Both old and new hug at content width anyway.
                            flex: '1 1 auto',
                            fontFamily: data.valueFontFamily || undefined,
                            fontSize: data.valueFontSize ? sizeCss(data.valueFontSize, 16) : undefined,
                            minWidth: 0,
                            overflow: 'visible',
                            whiteSpace: 'nowrap',
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
                            marginLeft: switchMargin,
                            marginRight: switchMargin,
                            overflow: 'visible',
                            position: 'relative',
                            width: 32,
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
                                width: 32,
                            }}
                        />
                        <div
                            className="mdc-switch__thumb-underlay mdc-ripple-upgraded mdc-ripple-upgraded--unbounded"
                            style={{
                                height: 28,
                                left: on ? 12 : -8,
                                position: 'absolute',
                                top: -4,
                                // Neutralize the ambient VIS1 `.mdc-switch--checked` translateX(20px); we drive the
                                // thumb travel via `left` so it works with or without the legacy stylesheet loaded.
                                transform: 'none',
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
                            boxSizing: 'border-box',
                            filter: controlFilter,
                            flex: '0 0 auto',
                            height: 40,
                            padding: 0,
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
                        <div className="mdc-checkbox__ripple" style={{ borderRadius: '50%', inset: 0, overflow: 'visible', position: 'absolute' }} />
                    </div>
                );

            return (
                <div
                    className={`materialdesign-widget mdc-form-field materialdesign-${def.kind}${labelPosition === 'left' ? ' mdc-form-field--align-end' : ''}`}
                    ref={element => {
                        // VIS2 wraps every widget in an overflow-hidden element; labels and MDC ripples may extend
                        // beyond it. Only lift the clipping — do NOT touch the wrapper width. Writing
                        // `max(clientWidth, scrollWidth)` back on every render is a ratchet: the unbounded MDC ripple
                        // always makes scrollWidth exceed clientWidth, so the widget grew wider on each re-render
                        // (visible in the editor as the control widening with every selection). Old sets no width.
                        if (element?.parentElement) {
                            const wrapper = element.parentElement;
                            window.requestAnimationFrame(() => {
                                wrapper.style.setProperty('overflow', 'visible', 'important');
                            });
                        }
                    }}
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
