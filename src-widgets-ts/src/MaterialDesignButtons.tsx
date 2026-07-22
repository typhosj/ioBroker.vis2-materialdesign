import React from 'react';

import type { RxWidgetInfo, VisRxWidgetProps } from '@iobroker/types-vis-2';

import { MAX_DYNAMIC_ITEMS, squarePreview, PressState, RenderProps, VisWidget, boundedCount, createInfo, parseActionValue, safeWidgetUrl, setStateValue, sizeCss, stateValue, sanitizeHtml, stringValue } from './widgetUtils';

type ButtonKind = 'navigation' | 'link' | 'state' | 'multiState' | 'addition' | 'toggle' | 'slider';
type ButtonLayout = 'default' | 'vertical' | 'icon';

interface ButtonData {
    oid?: string;
    nav_view?: string;
    href?: string;
    openNewWindow?: boolean;
    value?: string;
    valueOff?: string;
    valueOn?: string;
    readOnly?: boolean;
    pushButton?: boolean;
    countOids?: number;
    minmax?: string;
    buttontext?: string;
    labelTrue?: string;
    labelColorFalse?: string;
    labelColorTrue?: string;
    buttonStyle?: 'text' | 'raised' | 'unelevated' | 'outlined';
    toggleType?: 'boolean' | 'value';
    stateIfNotTrueValue?: 'on' | 'off';
    sliderOnly?: boolean;
    sliderWidth?: number;
    sliderThikness?: number;
    showInFront?: boolean;
    showAlways?: boolean;
    foregroundColor?: string;
    backgroundColor?: string;
    colorize?: boolean;
    colorizeFactor?: number;
    angleOffset?: number;
    angleArc?: number;
    debug?: boolean;
    mdwButtonPrimaryColor?: string;
    mdwButtonSecondaryColor?: string;
    mdwButtonColorPress?: string;
    colorBgFalse?: string;
    colorBgTrue?: string;
    colorPress?: string;
    image?: string;
    imageTrue?: string;
    imageColor?: string;
    imageTrueColor?: string;
    iconPosition?: 'left' | 'right' | 'top' | 'bottom';
    iconHeight?: number;
    labelWidth?: number;
    alignment?: 'flex-start' | 'center' | 'flex-end';
    distanceBetweenTextAndImage?: number;
    textFontSize?: number;
    textFontFamily?: string;
    lockEnabled?: boolean;
    autoLockAfter?: number;
    lockIcon?: string;
    lockIconTop?: number;
    lockIconLeft?: number;
    lockIconSize?: number;
    lockIconColor?: string;
    lockIconBackground?: string;
    lockBackgroundSizeFactor?: number;
    lockFilterGrayscale?: number;
    clickSoundPlay?: boolean;
    clickSoundVolume?: number;
    vibrateOnMobilDevices?: number;
    [key: string]: unknown;
}

interface ButtonDefinition {
    id: string;
    name: string;
    kind: ButtonKind;
    layout: ButtonLayout;
    label: string;
    icon: string;
}

const iconGlyphs: Record<string, string> = {
    'checkbox-marked': 'F0132',
    link: 'F0337',
    navigation: 'F0390',
    pencil: 'F03EB',
    'pencil-box-multiple': 'F1144',
    plus: 'F0415',
};

// Editor-palette preview glyph override per button kind (keeps the widget's runtime
// default icon untouched, only the palette thumbnail gets a more fitting symbol).
const previewGlyph: Partial<Record<ButtonKind, string>> = {
    toggle: 'F0521', // toggle-switch
    slider: 'F1543', // tune-vertical-variant
};

const imageIconField = (name: string, defaultValue?: string): Record<string, unknown> => ({
    name,
    label: name,
    type: 'icon',
    default: defaultValue,
});

const styleFields = [
    { name: 'buttonStyle', label: 'buttonStyle', type: 'select', options: ['text', 'raised', 'unelevated', 'outlined'], default: 'raised' },
];

const feedbackFields = [
    { name: 'vibrateOnMobilDevices', label: 'vibrateOnMobilDevices', type: 'number' },
    { name: 'clickSoundPlay', label: 'clickSoundPlay', type: 'checkbox' },
    { name: 'clickSoundVolume', label: 'clickSoundVolume', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.5 },
    { name: 'debug', label: 'debug', type: 'checkbox' },
];

const actionFields = {
    navigation: [{ name: 'nav_view', label: 'nav_view', type: 'views' }],
    link: [
        { name: 'href', label: 'href', type: 'text' },
        { name: 'openNewWindow', label: 'openNewWindow', type: 'checkbox' },
    ],
    state: [
        { name: 'oid', label: 'oid', type: 'id' },
        { name: 'value', label: 'value', type: 'text' },
    ],
    multiState: [
        { name: 'countOids', label: 'countOids', type: 'number', default: 1 },
    ],
    addition: [
        { name: 'oid', label: 'oid', type: 'id' },
        { name: 'value', label: 'value', type: 'number' },
        { name: 'minmax', label: 'minmax', type: 'text' },
    ],
    toggle: [
        { name: 'oid', label: 'oid', type: 'id' },
        { name: 'readOnly', label: 'readOnly', type: 'checkbox' },
        { name: 'toggleType', label: 'toggleType', type: 'select', options: ['boolean', 'value'], default: 'boolean' },
        { name: 'pushButton', label: 'pushButton', type: 'checkbox' },
        { name: 'valueOff', label: 'valueOff', type: 'text' },
        { name: 'valueOn', label: 'valueOn', type: 'text' },
        { name: 'stateIfNotTrueValue', label: 'stateIfNotTrueValue', type: 'select', options: ['on', 'off'], default: 'on' },
    ],
    slider: [
        { name: 'oid', label: 'oid', type: 'id' },
        { name: 'readOnly', label: 'readOnly', type: 'checkbox' },
        { name: 'sliderOnly', label: 'sliderOnly', type: 'checkbox' },
        { name: 'valueOff', label: 'valueOff', type: 'number' },
        { name: 'valueOn', label: 'valueOn', type: 'number' },
        { name: 'sliderWidth', label: 'sliderWidth', type: 'number', default: 20 },
        { name: 'sliderThikness', label: 'sliderThikness', type: 'number' },
        { name: 'showInFront', label: 'showInFront', type: 'checkbox' },
        { name: 'showAlways', label: 'showAlways', type: 'checkbox' },
        { name: 'foregroundColor', label: 'foregroundColor', type: 'color' },
        { name: 'backgroundColor', label: 'backgroundColor', type: 'color' },
        { name: 'colorize', label: 'colorize', type: 'checkbox' },
        { name: 'colorizeFactor', label: 'colorizeFactor', type: 'number', default: 0.5 },
        { name: 'angleOffset', label: 'angleOffset', type: 'number' },
        { name: 'angleArc', label: 'angleArc', type: 'number', default: 360 },
    ],
} satisfies Record<ButtonKind, Record<string, unknown>[]>;

function attrs(def: ButtonDefinition): RxWidgetInfo['visAttrs'] {
    const isIcon = def.layout === 'icon';
    const isVertical = def.layout === 'vertical';
    const labelFields = isIcon
        ? []
        : [
              { name: 'buttontext', label: 'buttontext', type: 'html', default: def.label },
              { name: 'labelTrue', label: 'labelTrue', type: 'html' },
              { name: 'labelColorFalse', label: 'labelColorFalse', type: 'color' },
              { name: 'labelColorTrue', label: 'labelColorTrue', type: 'color' },
              { name: 'textFontFamily', label: 'textFontFamily', type: 'fontname' },
              { name: 'textFontSize', label: 'textFontSize', type: 'number' },
              isVertical
                  ? { name: 'alignment', label: 'alignment', type: 'select', options: ['flex-start', 'center', 'flex-end'], default: 'center' }
                  : { name: 'labelWidth', label: 'labelWidth', type: 'slider', min: 0, max: 100, step: 1 },
              isVertical ? { name: 'distanceBetweenTextAndImage', label: 'distanceBetweenTextAndImage', type: 'slider', min: 0, max: 100, step: 1 } : null,
          ].filter(Boolean);

    const multiStateGroups =
        def.kind === 'multiState'
            ? [
                  {
                      name: 'buttonOids',
                      label: 'group.buttonOids',
                      indexFrom: 0,
                      indexTo: 'countOids',
                      fields: [
                          { name: 'oid', label: 'oid', type: 'id' },
                          { name: 'value', label: 'value', type: 'text' },
                          { name: 'delayInMs', label: 'delayInMs', type: 'number', default: 0 },
                      ],
                  },
              ]
            : [];

    return [
        {
            name: 'common',
            fields: [...(isIcon ? [] : styleFields), ...actionFields[def.kind], ...feedbackFields],
        },
        ...multiStateGroups,
        {
            name: 'label',
            fields: labelFields,
        },
        {
            name: 'color',
            fields: [
                { name: 'mdwButtonPrimaryColor', label: 'mdwButtonPrimaryColor', type: 'color' },
                { name: 'mdwButtonSecondaryColor', label: 'mdwButtonSecondaryColor', type: 'color' },
                { name: 'mdwButtonColorPress', label: 'mdwButtonColorPress', type: 'color' },
                { name: 'colorBgFalse', label: 'colorBgFalse', type: 'color' },
                { name: 'colorBgTrue', label: 'colorBgTrue', type: 'color' },
                { name: 'colorPress', label: 'colorPress', type: 'color' },
            ],
        },
        {
            name: 'icon',
            fields: [
                imageIconField('image', def.icon),
                { name: 'imageColor', label: 'imageColor', type: 'color' },
                imageIconField('imageTrue'),
                { name: 'imageTrueColor', label: 'imageTrueColor', type: 'color' },
                { name: 'iconPosition', label: 'iconPosition', type: 'select', options: isVertical ? ['top', 'bottom'] : ['left', 'right'], default: isVertical ? 'top' : 'left' },
                { name: 'iconHeight', label: 'iconHeight', type: 'slider', min: 0, max: 200, step: 1, default: isVertical ? 26 : undefined },
            ],
        },
        {
            name: 'lock',
            fields: [
                { name: 'lockEnabled', label: 'lockEnabled', type: 'checkbox' },
                { name: 'autoLockAfter', label: 'autoLockAfter', type: 'number', default: 10 },
                imageIconField('lockIcon'),
                { name: 'lockIconTop', label: 'lockIconTop', type: 'slider', min: 0, max: 100, step: 1, default: isIcon ? 45 : 5 },
                { name: 'lockIconLeft', label: 'lockIconLeft', type: 'slider', min: 0, max: 100, step: 1, default: isIcon ? 55 : 5 },
                { name: 'lockIconSize', label: 'lockIconSize', type: 'number' },
                { name: 'lockIconColor', label: 'lockIconColor', type: 'color' },
                { name: 'lockIconBackground', label: 'lockIconBackground', type: 'color' },
                { name: 'lockBackgroundSizeFactor', label: 'lockBackgroundSizeFactor', type: 'number', default: 1 },
                { name: 'lockFilterGrayscale', label: 'lockFilterGrayscale', type: 'slider', min: 0, max: 100, step: 1, default: 30 },
            ],
        },
    ] as RxWidgetInfo['visAttrs'];
}

function color(value: unknown, fallback: string): string {
    // Legacy `#mdwTheme:vis-materialdesign.0.…` tokens are not resolvable here (the vis2 widgets don't read the old
    // theme). Treat them as unset so the fallback applies — otherwise the raw token lands as an invalid CSS color
    // (e.g. the button label rendered black instead of the secondary white).
    return typeof value === 'string' && value && !value.startsWith('#mdwTheme:') ? value : fallback;
}

function numeric(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function isImageSource(value: string): boolean {
    const normalized = value.toLowerCase();
    return (
        ['.gif', '.png', '.bmp', '.jpg', '.jpeg', '.tif', '.svg', 'http://', 'https://', ';base64,', 'data:image/'].some(extension =>
            normalized.includes(extension),
        )
    );
}

function isSvgSource(value: string): boolean {
    const normalized = value.toLowerCase();
    return normalized.includes('.svg') || normalized.includes('image/svg+xml');
}

export function renderIcon(image: string, colorValue: string, size: number, recolor = true): React.JSX.Element | null {
    if (!image) {
        return null;
    }
    const style: React.CSSProperties = {
        color: colorValue,
        fontSize: size || undefined,
        height: size || undefined,
        lineHeight: 1,
        width: size || undefined,
    };

    if (isImageSource(image)) {
        if (isSvgSource(image) && recolor) {
            return (
                <span
                    style={{
                        ...style,
                        backgroundColor: colorValue,
                        display: 'inline-block',
                        maskImage: `url("${image}")`,
                        maskPosition: 'center',
                        maskRepeat: 'no-repeat',
                        maskSize: 'contain',
                        WebkitMaskImage: `url("${image}")`,
                        WebkitMaskPosition: 'center',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskSize: 'contain',
                    }}
                />
            );
        }
        return (
            <img
                alt=""
                src={image}
                style={{
                    ...style,
                    objectFit: 'contain',
                }}
            />
        );
    }

    return <span className={`mdi ${image.startsWith('mdi-') ? image : `mdi-${image}`}`} style={style} />;
}

function isOn(current: ioBroker.StateValue | undefined, data: ButtonData): boolean {
    if (data.toggleType === 'value') {
        const onValue = parseActionValue(String(data.valueOn ?? true));
        const offValue = parseActionValue(String(data.valueOff ?? false));
        const currentNumber = Number(current);
        const onNumber = Number(onValue);
        const offNumber = Number(offValue);
        const isKnownOn = Number.isFinite(currentNumber) && Number.isFinite(onNumber) ? currentNumber === onNumber : current === onValue;
        const isKnownOff = Number.isFinite(currentNumber) && Number.isFinite(offNumber) ? currentNumber === offNumber : current === offValue;
        return isKnownOn || (!isKnownOff && data.stateIfNotTrueValue === 'on');
    }
    return current === true || current === 'true' || current === 1 || current === '1';
}

function isActive(def: ButtonDefinition, current: ioBroker.StateValue | undefined, data: ButtonData): boolean {
    if (def.kind === 'state') {
        return current === parseActionValue(String(data.value ?? ''));
    }
    return isOn(current, data);
}

function clampByMinMax(value: number, minmax: unknown): number {
    if (typeof minmax !== 'string') {
        return value;
    }
    const [min, max] = minmax.split(';').map(part => Number(part.trim()));
    if (Number.isFinite(min) && value < min) {
        return min;
    }
    if (Number.isFinite(max) && value > max) {
        return max;
    }
    return value;
}

function indexedValue(data: ButtonData, name: string, index: number): unknown {
    const direct = data[`${name}${index}`];
    if (direct !== undefined) {
        return direct;
    }
    const value = data[name];
    if (Array.isArray(value)) {
        return value[index];
    }
    if (value && typeof value === 'object') {
        return (value as Record<string, unknown>)[String(index)];
    }
    return undefined;
}

function writeMultiState(props: VisRxWidgetProps, data: ButtonData, schedule: (callback: () => void, delay: number) => void): void {
    const count = boundedCount(data.countOids, 1, MAX_DYNAMIC_ITEMS - 1);
    for (let index = 0; index <= count; index++) {
        const oid = stringValue(indexedValue(data, 'oid', index));
        const value = parseActionValue(stringValue(indexedValue(data, 'value', index)));
        const delay = Math.min(2_147_483_647, Math.max(0, numeric(indexedValue(data, 'delayInMs', index), 0)));
        if (!oid) {
            continue;
        }
        if (delay) {
            schedule(() => setStateValue(props, oid, value), delay);
        } else {
            setStateValue(props, oid, value);
        }
    }
}

function feedback(data: ButtonData): void {
    const vibrate = numeric(data.vibrateOnMobilDevices, 0);
    if (vibrate > 0 && navigator.vibrate) {
        navigator.vibrate(vibrate);
    }
    if (data.clickSoundPlay) {
        const audio = new Audio('widgets/vis2-materialdesign/materialdesign-widgets-click-sound.mp3');
        audio.volume = Math.max(0, Math.min(1, numeric(data.clickSoundVolume, 0.5)));
        void audio.play().catch(() => undefined);
    }
}

function widgetLabel(def: ButtonDefinition): string {
    return def.name;
}

function preview(def: ButtonDefinition): string {
    return squarePreview(previewGlyph[def.kind] ?? iconGlyphs[def.icon] ?? iconGlyphs.plus);
}

function execute(def: ButtonDefinition, props: VisRxWidgetProps, data: ButtonData, current: ioBroker.StateValue | undefined, schedule: (callback: () => void, delay: number) => void): void {
    if (def.kind === 'navigation' && data.nav_view) {
        props.context.changeView(data.nav_view);
    } else if (def.kind === 'link' && data.href) {
        const href = safeWidgetUrl(data.href);
        if (!href) return;
        if (data.openNewWindow) {
            window.open(href, '_blank', 'noopener,noreferrer');
        } else {
            window.location.href = href;
        }
    } else if (def.kind === 'state') {
        setStateValue(props, data.oid || '', parseActionValue(String(data.value ?? '')));
    } else if (def.kind === 'multiState') {
        writeMultiState(props, data, schedule);
    } else if (def.kind === 'addition') {
        const nextValue = numeric(current, 0) + numeric(data.value, 0);
        setStateValue(props, data.oid || '', clampByMinMax(nextValue, data.minmax));
    } else if ((def.kind === 'toggle' || def.kind === 'slider') && !data.readOnly) {
        const onValue = def.kind === 'slider' ? numeric(data.valueOn, 100) : data.toggleType === 'value' ? parseActionValue(String(data.valueOn ?? true)) : true;
        const offValue = def.kind === 'slider' ? numeric(data.valueOff, 0) : data.toggleType === 'value' ? parseActionValue(String(data.valueOff ?? false)) : false;
        setStateValue(props, data.oid || '', isOn(current, data) ? offValue : onValue);
        if (data.pushButton) {
            schedule(() => setStateValue(props, data.oid || '', offValue), 250);
        }
    }
}

export function createButtonClass(def: ButtonDefinition): typeof VisWidget {
    return class MaterialDesignButtonVariant extends VisWidget {
        private lockTimer: number | undefined;
        private readonly actionTimers = new Set<number>();
        private lastTouchAt = 0;
        private lastSliderAt = 0;

        constructor(props: VisRxWidgetProps) {
            super(props);
        }

        static getWidgetInfo(): RxWidgetInfo {
            return {
                ...createInfo(def.id, def.name, attrs(def)),
                visWidgetLabel: widgetLabel(def),
                visPrev: preview(def),
                visDefaultStyle: {
                    width: def.layout === 'icon' ? 48 : 100,
                    height: def.layout === 'vertical' ? 60 : def.layout === 'icon' ? 48 : 30,
                },
                visResizeLocked: def.layout === 'icon',
            };
        }

        getWidgetInfo(): RxWidgetInfo {
            return MaterialDesignButtonVariant.getWidgetInfo();
        }

        componentWillUnmount(): void {
            if (this.lockTimer) {
                window.clearTimeout(this.lockTimer);
            }
            this.actionTimers.forEach(timer => window.clearTimeout(timer));
            this.actionTimers.clear();
            super.componentWillUnmount?.();
        }

        private readonly schedule = (callback: () => void, delay: number): void => {
            let timer = 0;
            timer = window.setTimeout(() => {
                this.actionTimers.delete(timer);
                callback();
            }, delay);
            this.actionTimers.add(timer);
        };

        isLocked(data: ButtonData): boolean {
            return Boolean(data.lockEnabled) && !(this.state as PressState & { unlocked?: boolean }).unlocked;
        }

        unlock(data: ButtonData): void {
            this.setState({ unlocked: true });
            if (this.lockTimer) {
                window.clearTimeout(this.lockTimer);
            }
            this.lockTimer = window.setTimeout(
                () => { this.lockTimer = undefined; this.setState({ unlocked: false }); },
                Math.min(86_400, Math.max(1, numeric(data.autoLockAfter, 10))) * 1000,
            );
        }

        activate(data: ButtonData, current: ioBroker.StateValue | undefined): void {
            feedback(data);
            if (this.isLocked(data)) {
                this.unlock(data);
                return;
            }
            if (def.kind === 'slider' && data.sliderOnly) {
                return;
            }
            execute(def, this.props, data, current, this.schedule);
        }

        pushDown(data: ButtonData): void {
            if (def.kind !== 'toggle' || data.readOnly || !data.pushButton) {
                return;
            }
            feedback(data);
            if (this.isLocked(data)) {
                this.unlock(data);
                return;
            }
            const onValue = data.toggleType === 'value' ? parseActionValue(String(data.valueOn ?? true)) : true;
            setStateValue(this.props, data.oid || '', onValue);
        }

        pushUp(data: ButtonData): void {
            if (this.isLocked(data) || def.kind !== 'toggle' || data.readOnly || !data.pushButton) {
                return;
            }
            const offValue = data.toggleType === 'value' ? parseActionValue(String(data.valueOff ?? false)) : false;
            setStateValue(this.props, data.oid || '', offValue);
        }

        setSliderFromPointer(event: React.PointerEvent<SVGSVGElement>, data: ButtonData): void {
            if (data.readOnly || this.isLocked(data)) {
                return;
            }
            // Mark slider interaction so the button's mouse-up does not fire the toggle
            // (execute() for kind 'slider') and clobber the dragged value.
            this.lastSliderAt = Date.now();
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;
            const min = numeric(data.valueOff, 0);
            const max = numeric(data.valueOn, 100);
            const arc = Math.max(1, Math.min(360, numeric(data.angleArc, 360)));
            const offset = numeric(data.angleOffset, 0);
            const angle = (Math.atan2(y, x) * 180) / Math.PI + 90 - offset;
            const normalized = ((angle % 360) + 360) % 360;
            const ratio = Math.max(0, Math.min(1, normalized / arc));
            setStateValue(this.props, data.oid || '', Math.round(min + (max - min) * ratio));
        }

        renderWidgetBody(props: RenderProps): React.JSX.Element {
            super.renderWidgetBody(props);
            const data = this.state.rxData as unknown as ButtonData;
            const pressState = this.state as PressState;
            const current = stateValue(this.state, data.oid || '');
            const on = isActive(def, current, data);
            const locked = this.isLocked(data);
            const primary = color(on ? data.colorBgTrue : data.mdwButtonPrimaryColor || data.colorBgFalse, def.layout === 'icon' ? 'transparent' : '#44739e');
            const secondary = color(on ? data.imageTrueColor || data.mdwButtonSecondaryColor : data.mdwButtonSecondaryColor || data.imageColor, def.layout === 'icon' ? '#44739e' : '#fff');
            const labelColor = color(on ? data.labelColorTrue : data.labelColorFalse, secondary);
            const pressed = color(data.mdwButtonColorPress || data.colorPress, '#1565c0');
            const isVertical = def.layout === 'vertical';
            const isIcon = def.layout === 'icon';
            const isSliderIcon = isIcon && def.kind === 'slider';
            const background = !isSliderIcon && (pressState.active || pressState.hovered) ? pressed : primary;
            const image = on && data.imageTrue ? data.imageTrue : data.image || def.icon;
            const imageColorSet = !!(on && data.imageTrue ? data.imageTrueColor : data.imageColor);
            const label = (on && data.labelTrue ? data.labelTrue : data.buttontext) || def.label;
            const iconFirst = isVertical ? data.iconPosition !== 'bottom' : data.iconPosition !== 'right';
            const iconSize = numeric(data.iconHeight, isVertical || isIcon ? 26 : 18);
            const lockSize = numeric(data.lockIconSize, isIcon ? 16 : 18);
            const lockElementSize = lockSize * Math.max(1, numeric(data.lockBackgroundSizeFactor, 1));
            const direction = isVertical ? 'column' : 'row';
            const gap = numeric(data.distanceBetweenTextAndImage, isVertical ? 2 : 4);
            const click = (): void => this.activate(data, current);
            const sliderMin = numeric(data.valueOff, 0);
            const sliderMax = numeric(data.valueOn, 100);
            const sliderValue = Math.min(sliderMax, Math.max(sliderMin, numeric(current, sliderMin)));
            const sliderVisible = def.kind === 'slider' && (data.showAlways || pressState.hovered || pressState.active);
            const sliderColor = color(data.foregroundColor, '#44739e');
            const sliderTrackColor = color(data.backgroundColor, '#eeeeee');
            const sliderRatio = sliderMax === sliderMin ? 0 : Math.max(0, Math.min(1, (sliderValue - sliderMin) / (sliderMax - sliderMin)));
            const sliderSize = Math.max(32, Math.min(160, Math.max(48, numeric(data.sliderWidth, 54))));
            const sliderStroke = Math.max(2, numeric(data.sliderThikness, 4));
            const sliderRadius = 22;
            const sliderCircumference = 2 * Math.PI * sliderRadius;
            const sliderArc = Math.max(1, Math.min(360, numeric(data.angleArc, 360)));
            const sliderArcLength = sliderCircumference * (sliderArc / 360);
            const sliderDash = `${sliderArcLength * sliderRatio} ${sliderCircumference}`;
            const sliderTrackDash = `${sliderArcLength} ${sliderCircumference}`;
            const sliderRotation = numeric(data.angleOffset, 0) - 90;
            const content = (
                <>
                    {renderIcon(image, secondary, iconSize, imageColorSet)}
                    {!isIcon ? (
                        <span
                            style={{
                                color: labelColor,
                                fontFamily: data.textFontFamily || undefined,
                                fontSize: data.textFontSize ? sizeCss(data.textFontSize, 14) : undefined,
                                width: !isVertical && numeric(data.labelWidth, 0) > 0 ? `${numeric(data.labelWidth)}%` : undefined,
                            }}
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(label) }}
                        />
                    ) : null}
                </>
            );

            return (
                <div style={{ boxSizing: 'border-box', width: '100%', height: '100%', padding: 0 }}>
                    <button
                        type="button"
                        aria-pressed={on}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: data.buttonStyle === 'outlined' ? `1px solid ${secondary}` : 0,
                            borderRadius: isIcon ? '50%' : 4,
                            background: data.buttonStyle === 'text' || data.buttonStyle === 'outlined' ? 'transparent' : background,
                            color: secondary,
                            cursor: data.readOnly ? 'default' : 'pointer',
                            padding: isIcon ? 0 : '0 8px',
                            display: 'flex',
                            flexDirection: direction,
                            alignItems: isVertical ? data.alignment || 'center' : 'center',
                            justifyContent: 'center',
                            gap,
                            transform: pressState.active ? 'translateY(1px)' : 'none',
                            transition: 'background 120ms ease, transform 80ms ease',
                            position: 'relative',
                        }}
                        onMouseEnter={() => this.setState({ hovered: true })}
                        onMouseLeave={() => {
                            if (data.pushButton) {
                                this.pushUp(data);
                            }
                            this.setState({ active: false, hovered: false });
                        }}
                        onMouseDown={() => {
                            if (Date.now() - this.lastTouchAt < 700 || Date.now() - this.lastSliderAt < 700) {
                                return;
                            }
                            this.setState({ active: true });
                            this.pushDown(data);
                        }}
                        onMouseUp={() => {
                            if (Date.now() - this.lastTouchAt < 700 || Date.now() - this.lastSliderAt < 700) {
                                return;
                            }
                            this.setState({ active: false });
                            if (data.pushButton) {
                                this.pushUp(data);
                            } else {
                                click();
                            }
                        }}
                        onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                this.setState({ active: true });
                                if (data.pushButton && !event.repeat) {
                                    this.pushDown(data);
                                }
                            }
                        }}
                        onKeyUp={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                this.setState({ active: false });
                                if (data.pushButton) {
                                    this.pushUp(data);
                                } else {
                                    click();
                                }
                            }
                        }}
                        onTouchStart={() => {
                            this.lastTouchAt = Date.now();
                            this.setState({ active: true });
                            this.pushDown(data);
                        }}
                        onTouchEnd={() => {
                            this.lastTouchAt = Date.now();
                            this.setState({ active: false });
                            if (data.pushButton) {
                                this.pushUp(data);
                            } else {
                                click();
                            }
                        }}
                        onTouchCancel={() => {
                            this.lastTouchAt = Date.now();
                            if (data.pushButton) {
                                this.pushUp(data);
                            }
                            this.setState({ active: false });
                        }}
                    >
                        <span
                            style={{
                                alignItems: isVertical ? data.alignment || 'center' : 'center',
                                display: 'flex',
                                flexDirection: direction,
                                filter: locked ? `grayscale(${numeric(data.lockFilterGrayscale, 30)}%)` : undefined,
                                gap,
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            {iconFirst ? content : React.Children.toArray(content.props.children).reverse()}
                        </span>
                        {locked ? (
                            <span
                                style={{
                                    position: 'absolute',
                                    left: `${numeric(data.lockIconLeft, isIcon ? 55 : 5)}%`,
                                    top: `${numeric(data.lockIconTop, isIcon ? 45 : 5)}%`,
                                    width: lockElementSize || undefined,
                                    height: lockElementSize || undefined,
                                    lineHeight: lockElementSize ? `${lockElementSize}px` : undefined,
                                    fontSize: lockSize || undefined,
                                    color: color(data.lockIconColor, '#B22222'),
                                    background: color(data.lockIconBackground, 'transparent'),
                                    borderRadius: lockElementSize || undefined,
                                    textAlign: 'center',
                                }}
                            >
                                {renderIcon(data.lockIcon || 'lock-outline', color(data.lockIconColor, '#B22222'), lockSize, !!data.lockIconColor)}
                            </span>
                        ) : null}
                        {def.kind === 'slider' ? (
                            <>
                                <svg
                                    aria-label={def.name}
                                    role="slider"
                                    aria-valuemax={sliderMax}
                                    aria-valuemin={sliderMin}
                                    aria-valuenow={sliderValue}
                                    height={sliderSize}
                                    onClick={event => event.stopPropagation()}
                                    onPointerDown={event => {
                                        event.stopPropagation();
                                        event.currentTarget.setPointerCapture(event.pointerId);
                                        feedback(data);
                                        this.setSliderFromPointer(event, data);
                                    }}
                                    onPointerMove={event => {
                                        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                            event.stopPropagation();
                                            this.setSliderFromPointer(event, data);
                                        }
                                    }}
                                    onPointerUp={event => {
                                        event.stopPropagation();
                                        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                            event.currentTarget.releasePointerCapture(event.pointerId);
                                        }
                                    }}
                                    onPointerCancel={event => {
                                        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                            event.currentTarget.releasePointerCapture(event.pointerId);
                                        }
                                    }}
                                    style={{
                                        cursor: data.readOnly || locked ? 'default' : 'pointer',
                                        display: sliderVisible ? 'block' : 'none',
                                        left: '50%',
                                        overflow: 'visible',
                                        pointerEvents: data.readOnly || locked ? 'none' : 'auto',
                                        position: 'absolute',
                                        top: '50%',
                                        touchAction: 'none',
                                        transform: 'translate(-50%, -50%)',
                                        width: sliderSize,
                                        zIndex: data.showInFront ? 2 : 0,
                                    }}
                                    viewBox="0 0 48 48"
                                    width={sliderSize}
                                >
                                    <circle
                                        cx="24"
                                        cy="24"
                                        fill="none"
                                        r={sliderRadius}
                                        stroke={sliderTrackColor}
                                        strokeDasharray={sliderTrackDash}
                                        strokeLinecap="round"
                                        strokeWidth={sliderStroke}
                                        transform={`rotate(${sliderRotation} 24 24)`}
                                    />
                                    <circle
                                        cx="24"
                                        cy="24"
                                        fill="none"
                                        r={sliderRadius}
                                        stroke={sliderColor}
                                        strokeDasharray={sliderDash}
                                        strokeLinecap="round"
                                        strokeWidth={sliderStroke}
                                        transform={`rotate(${sliderRotation} 24 24)`}
                                    />
                                </svg>
                            </>
                        ) : null}
                    </button>
                </div>
            );
        }
    };
}
