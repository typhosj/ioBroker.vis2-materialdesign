import React from 'react';

import type { RxWidgetInfo, VisRxWidgetState, WidgetData } from '@iobroker/types-vis-2';

import { renderIcon } from './MaterialDesignButtons';
import { RenderProps, VisWidget, createInfo, iconField, parseActionValue, setStateValue, sizeCss, stateValue } from './widgetUtils';

type Data = Record<string, unknown> & { listItemDataMethod?: string; countListItems?: number; json_string_oid?: string };
type Item = { objectId: string; text: string; subText: string; rightText: string; rightSubText: string; image: string; imageColor: string; imageActive: string; imageActiveColor: string; header: string; divider: boolean; buttonStateValue: unknown; buttonNavView: string; buttonLink: string; overflow: boolean };

const n = (v: unknown, d = 0): number => v === '' || v === undefined || v === null || !Number.isFinite(Number(v)) ? d : Number(v);
const s = (v: unknown, d = ''): string => v === '' || v === undefined || v === null || v === 'null' ? d : String(v);
const b = (v: unknown, d = false): boolean => v === undefined || v === null || v === '' ? d : v === true || v === 'true' || v === 1 || v === '1';
// Mirror legacy myMdwHelper.getFontSize: MDC typography name -> class, numeric -> Npx, anything else (keyword like
// 'x-large', 'auto', empty) -> inherit (no font-size). The old widget renders these keyword sizes as `inherit` (=16px);
// applying them as literal CSS font-size (as before) blew the text up to 24px and overlapped the subtitle.
const fontSizeStyle = (v: unknown): { className: string; fontSize: string | undefined } => {
    const t = s(v);
    if (t === '') return { className: '', fontSize: undefined };
    if (/headline|subtitle|body|caption|button|overline/.test(t)) return { className: `mdc-typography--${t}`, fontSize: undefined };
    // Numeric -> Npx; keyword ('x-large', 'medium', 'auto', …) -> explicit `inherit` so it overrides the MDC
    // `__secondary-text`(14px)/`__meta`(12px) defaults and inherits the item's 16px, exactly like legacy getFontSize.
    return { className: '', fontSize: Number.isFinite(Number(t)) ? `${Number(t)}px` : 'inherit' };
};

const fonts = ['auto', 'headline1', 'headline2', 'headline3', 'headline4', 'headline5', 'headline6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'button', 'overline', 'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'smaller', 'larger'];
const attrs: RxWidgetInfo['visAttrs'] = [
    { name: 'listLayout', label: 'group_listLayout', fields: [
        { name: 'listType', label: 'listType', type: 'select', options: ['text', 'buttonState', 'buttonToggle', 'buttonToggle_readonly', 'buttonNav', 'buttonLink', 'switch', 'switch_readonly', 'checkbox', 'checkbox_readonly'], default: 'text' },
        { name: 'listItemDividerStyle', label: 'listItemDividerStyle', type: 'select', options: ['standard', 'padded', 'inset'], default: 'standard' }, { name: 'listLayout', label: 'listLayout', type: 'select', options: ['standard', 'card', 'cardOutlined'], default: 'standard' },
        { name: 'showScrollbar', label: 'showScrollbar', type: 'checkbox', default: true }, { name: 'scrollToTopOnChanges', label: 'scrollToTopOnChanges', type: 'checkbox' }, { name: 'vibrateOnMobilDevices', label: 'vibrateOnMobilDevices', type: 'number', default: 50 }, { name: 'clickSoundPlay', label: 'clickSoundPlay', type: 'checkbox' }, { name: 'clickSoundVolume', label: 'clickSoundVolume', type: 'slider', min: 0, max: 1, step: .1, default: .5 },
    ] },
    { name: 'listHeader', label: 'group_listHeader', fields: [{ name: 'headers', label: 'headers', type: 'html' }, { name: 'alignment', label: 'alignment', type: 'select', options: ['flex-start', 'center', 'flex-end'], default: 'flex-start' }, { name: 'header_height', label: 'header_height', type: 'number', default: 60 }, { name: 'header_padding_left', label: 'header_padding_left', type: 'number', default: 16 }, { name: 'header_padding_right', label: 'header_padding_right', type: 'number', default: 16 }, { name: 'header_padding_top', label: 'header_padding_top', type: 'number', default: 6 }, { name: 'header_padding_bottom', label: 'header_padding_bottom', type: 'number', default: 20 }, { name: 'headerTextColor', label: 'headerTextColor', type: 'color' }, { name: 'headerTextSize', label: 'headerTextSize', type: 'number' }, { name: 'headerFontFamily', label: 'headerFontFamily', type: 'fontname' }, iconField('headerImage', 'headerImage', 'head'), { name: 'headerImageColor', label: 'headerImageColor', type: 'color' }, { name: 'headerImageHeight', label: 'headerImageHeight', type: 'slider', min: 0, max: 200, step: 1 }] },
    { name: 'listItemData', label: 'group_listItemData', fields: [{ name: 'listItemDataMethod', label: 'listItemDataMethod', type: 'select', options: ['inputPerEditor', 'jsonStringObject'], default: 'inputPerEditor' }, { name: 'countListItems', label: 'countListItems', type: 'number', default: 1, onChange: (_f, data, change) => change({ ...data, lastListItemIndex: Math.max(0, Math.floor(n(data.countListItems, 1)) - 1) }) }, { name: 'lastListItemIndex', type: 'number', default: 0, hidden: () => true }, { name: 'json_string_oid', label: 'json_string_oid', type: 'id' }] },
    { name: 'listItemLayout', label: 'group_listItemLayout', fields: [{ name: 'listItemHeight', label: 'listItemHeight', type: 'number' }, { name: 'listImageHeight', label: 'listImageHeight', type: 'number' }, { name: 'listItemAlignment', label: 'listItemAlignment', type: 'select', options: ['left', 'center', 'right'], default: 'left' }, { name: 'distanceBetweenTextAndImage', label: 'distanceBetweenTextAndImage', type: 'number' }, { name: 'rightTextWidth', label: 'rightTextWidth', type: 'number' }] },
    { name: 'color', label: 'group_color', fields: ['listBackground','listItemBackground','listItemBackgroundActive','colorSwitchThumb','colorSwitchTrack','colorSwitchTrue','colorSwitchHover','colorCheckBox','colorListItemHover','colorListItemSelected','colorListItemText','colorListItemTextSecondary','colorListItemTextRight','colorListItemTextSecondaryRight','colorListItemHeaders','colorListItemDivider'].map(name => ({ name, label: name, type: 'color' as const })) },
    { name: 'font', label: 'group_font', fields: ['headerFontFamily','listItemFont','listItemSubFont','listItemRightFont','listItemSubRightFont'].map(name => ({ name, label: name, type: 'fontname' as const })) },
    { name: 'fontSize', label: 'group_fontSize', fields: ['listItemTextSize','listItemSubTextSize','listItemTextRightSize','listItemSubTextRightSize','listItemHeaderTextSize'].map(name => ({ name, label: name, type: 'select' as const, options: fonts })) },
    { name: 'rows', label: 'group_rows', indexFrom: 0, indexTo: 'lastListItemIndex', hidden: (data: WidgetData) => !!data.listItemDataMethod && data.listItemDataMethod !== 'inputPerEditor', fields: [
        { name: 'oid', label: 'oid', type: 'id' }, { name: 'groupHeader', label: 'groupHeader', type: 'html' }, iconField('listImage', 'listImage'), { name: 'listImageColor', label: 'listImageColor', type: 'color' }, iconField('listImageActive', 'listImageActive'), { name: 'listImageActiveColor', label: 'listImageActiveColor', type: 'color' }, { name: 'label', label: 'label', type: 'html' }, { name: 'subLabel', label: 'subLabel', type: 'html' }, { name: 'rightLabel', label: 'rightLabel', type: 'html' }, { name: 'rightSubLabel', label: 'rightSubLabel', type: 'html' }, { name: 'dividers', label: 'dividers', type: 'checkbox' }, { name: 'listTypeButtonStateValue', label: 'listTypeButtonStateValue', type: 'text' }, { name: 'listTypeButtonNav', label: 'listTypeButtonNav', type: 'views' }, { name: 'listTypeButtonLink', label: 'listTypeButtonLink', type: 'url' }, { name: 'listOverflow', label: 'listOverflow', type: 'checkbox' },
    ] },
];

function item(data: Data, index: number, json?: Record<string, unknown>): Item {
    const get = (name: string, jsonName = name): unknown => json ? json[jsonName] : data[`${name}${index}`];
    const image = s(get('listImage', 'image'));
    const imageColor = s(get('listImageColor', 'imageColor'), '#44739e');
    return { objectId: s(get('oid', 'objectId')), text: s(get('label', 'text'), `Item ${index}`), subText: s(get('subLabel', 'subText')), rightText: s(get('rightLabel', 'rightText')), rightSubText: s(get('rightSubLabel', 'rightSubText')), image, imageColor, imageActive: s(get('listImageActive', 'imageActive'), image), imageActiveColor: s(get('listImageActiveColor', 'imageActiveColor'), imageColor), header: s(get('groupHeader', 'header')), divider: b(get('dividers', 'showDivider')), buttonStateValue: get('listTypeButtonStateValue', 'buttonStateValue'), buttonNavView: s(get('listTypeButtonNav', 'buttonNavView')), buttonLink: s(get('listTypeButtonLink', 'buttonLink')), overflow: b(get('listOverflow', 'listOverflow')) };
}

// Render a fully inline-styled MDC switch/checkbox so the control stays visible even when the
// legacy MDC stylesheet is absent (VIS2 does not load it). Mirrors MaterialDesignToggleControls.
function listToggle(kind: 'switch' | 'checkbox', on: boolean, readonly: boolean, data: Data, onChange: (checked: boolean) => void): React.JSX.Element {
    const input = (
        <input
            checked={on}
            className={kind === 'switch' ? 'mdc-switch__native-control' : 'mdc-checkbox__native-control'}
            disabled={readonly}
            onChange={e => onChange(e.target.checked)}
            style={{ cursor: readonly ? 'default' : 'pointer', margin: 0, opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            type="checkbox"
            {...(kind === 'switch' ? { role: 'switch' } : {})}
        />
    );
    if (kind === 'switch') {
        const onColor = s(data.colorSwitchTrue, '#44739e');
        return (
            <span className="mdc-switch" style={{ flex: '0 0 auto', height: 20, overflow: 'visible', position: 'relative', width: 32 }}>
                <span className="mdc-switch__track" style={{ background: on ? onColor : s(data.colorSwitchTrack, '#000000'), border: 'none', borderRadius: 7, height: 14, left: 0, opacity: on ? 0.54 : 0.38, position: 'absolute', top: 3, width: 32 }} />
                <span className="mdc-switch__thumb-underlay" style={{ border: 'none', height: 28, left: on ? 12 : -8, position: 'absolute', top: -4, transform: 'none', transition: 'left 120ms ease', width: 28 }}>
                    <span className="mdc-switch__thumb" style={{ background: on ? onColor : s(data.colorSwitchThumb, '#FFFFFF'), border: 'none', borderRadius: '50%', boxShadow: '0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12)', height: 20, left: 4, position: 'absolute', top: 4, width: 20 }} />
                </span>
                {input}
            </span>
        );
    }
    const cbColor = s(data.colorCheckBox, '#44739e');
    return (
        <span className="mdc-checkbox" style={{ boxSizing: 'border-box', flex: '0 0 auto', height: 40, position: 'relative', width: 40 }}>
            {input}
            <span className="mdc-checkbox__background" style={{ background: on ? cbColor : 'transparent', border: `2px solid ${on ? cbColor : 'rgba(0, 0, 0, 0.54)'}`, borderRadius: 2, boxSizing: 'border-box', height: 18, left: 11, position: 'absolute', top: 11, width: 18 }}>
                <svg className="mdc-checkbox__checkmark" style={{ height: '100%', inset: 0, opacity: on ? 1 : 0, position: 'absolute', width: '100%' }} viewBox="0 0 24 24">
                    <path className="mdc-checkbox__checkmark-path" d="M1.73,12.91 8.1,19.28 22.79,4.59" fill="none" stroke="#fff" strokeWidth="3.12" />
                </svg>
            </span>
        </span>
    );
}

// MDC list base layout — previously supplied ambiently by the legacy materialdesign bundle. Vendored
// here (scoped) so the list stays intact once that legacy CSS is gone: without display:flex the item
// stacks the icon above the text, and without the list reset the <ul> gets browser indent/bullets.
const listCss = '.materialdesign-list .mdc-list{list-style:none;margin:0;padding:0}'
    + '.materialdesign-list .mdc-list-item{display:flex;align-items:center;position:relative}'
    + '.materialdesign-list .mdc-list-item__text{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;justify-content:center}'
    + '.materialdesign-list .mdc-list-item__primary-text,.materialdesign-list .mdc-list-item__secondary-text{display:block}'
    + '.materialdesign-list .mdc-list-item__meta{margin-left:auto}'
    + '.materialdesign-list .mdc-list-group__subheader{display:block;margin:0;list-style:none}'
    // Counter the legacy `min-height:40px!important` (if still present) with a CSS-var-driven row height,
    // and let the graphic size itself (legacy forced 24x24, clamping larger listImageHeight SVGs).
    + '.materialdesign-list.materialdesign-widget .mdc-list-item{min-height:var(--materialdesign-list-item-height,48px)!important;height:auto!important}'
    + '.materialdesign-list .mdc-list-item__graphic{flex-shrink:0;display:inline-flex;align-items:center;width:auto!important;height:auto!important;overflow:visible}';

export default class MaterialDesignList extends VisWidget {
    static getWidgetInfo(): RxWidgetInfo { return { ...createInfo('tplVis2-materialdesign-List', 'List', attrs), visPrev: '<img src="widgets/vis2-materialdesign/img/prev_list.png"></img>', visDefaultStyle: { width: 400, height: 270 } }; }
    getWidgetInfo(): RxWidgetInfo { return MaterialDesignList.getWidgetInfo(); }
    private feedback(data: Data): void { if (n(data.vibrateOnMobilDevices) > 0) navigator.vibrate?.(n(data.vibrateOnMobilDevices)); if (b(data.clickSoundPlay)) { const audio = new Audio('widgets/vis2-materialdesign/materialdesign-widgets-click-sound.mp3'); audio.volume = Math.max(0, Math.min(1, n(data.clickSoundVolume, .5))); void audio.play().catch(() => undefined); } }
    private activate(data: Data, value: unknown, current: unknown, row: Item): void { const type = s(data.listType); if (type.endsWith('_readonly') || type === 'text') return; this.feedback(data); if (type === 'checkbox' || type === 'switch') setStateValue(this.props, row.objectId, value); else if (type === 'buttonToggle') setStateValue(this.props, row.objectId, !current); else if (type === 'buttonState') setStateValue(this.props, row.objectId, parseActionValue(s(row.buttonStateValue))); else if (type === 'buttonNav') this.props.context?.changeView?.(row.buttonNavView); else if (type === 'buttonLink') window.open(row.buttonLink); }
    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props); const data = this.state.rxData as unknown as Data; let json: Record<string, unknown>[] | undefined;
        if (data.listItemDataMethod === 'jsonStringObject') { try { const value = JSON.parse(s(stateValue(this.state as VisRxWidgetState, s(data.json_string_oid)), '[]')); json = Array.isArray(value) ? value : []; } catch (e) { json = [{ text: `<font color="red"><b>Error in JSON string</b></font>`, subText: String(e) }]; } }
        const rows = json ? json.map((row, index) => item(data, index, row)) : Array.from({ length: Math.max(0, n(data.countListItems, 1)) }, (_, index) => item(data, index)); const type = s(data.listType, 'text');
        const vars = { '--materialdesign-color-list-background': s(data.listBackground, 'transparent'), '--materialdesign-color-card-background': s(data.listBackground, '#fff'), '--materialdesign-color-list-item-hover': s(data.colorListItemHover), '--materialdesign-color-list-item-text': s(data.colorListItemText), '--materialdesign-color-list-item-text-secondary': s(data.colorListItemTextSecondary), '--materialdesign-color-list-item-text-right': s(data.colorListItemTextRight), '--materialdesign-color-list-item-text-secondary-right': s(data.colorListItemTextSecondaryRight), '--materialdesign-color-list-item-header': s(data.colorListItemHeaders), '--materialdesign-color-list-item-divider': s(data.colorListItemDivider), '--materialdesign-font-list-item-text': s(data.listItemFont), '--materialdesign-font-list-item-text-secondary': s(data.listItemSubFont), '--materialdesign-font-list-item-text-right': s(data.listItemRightFont), '--materialdesign-font-list-item-text-secondary-right': s(data.listItemSubRightFont), '--materialdesign-font-list-item-header': s(data.headerFontFamily) } as React.CSSProperties;
        const content = <ul className={`mdc-list materialdesign-list-container${type === 'text' ? ' mdc-list--non-interactive' : ''}`} style={{ maxHeight: '100%', overflowX: 'hidden', overflowY: b(data.showScrollbar, true) ? 'auto' : undefined }}>{rows.map((row, index) => { const current = stateValue(this.state as VisRxWidgetState, row.objectId); const active = current === true || current === 'true' || current === 1 || current === '1'; const readonly = type.endsWith('_readonly'); const image = active ? row.imageActive : row.image; const color = active ? row.imageActiveColor : row.imageColor; const control = type.startsWith('checkbox') ? listToggle('checkbox', active, readonly, data, checked => this.activate(data, checked, current, row)) : type.startsWith('switch') ? listToggle('switch', active, readonly, data, checked => this.activate(data, checked, current, row)) : null; const pSz = fontSizeStyle(data.listItemTextSize), sSz = fontSizeStyle(data.listItemSubTextSize), rSz = fontSizeStyle(data.listItemTextRightSize), rsSz = fontSizeStyle(data.listItemSubTextRightSize), hSz = fontSizeStyle(data.listItemHeaderTextSize); return <React.Fragment key={index}>{row.header ? <li className={`mdc-list-group__subheader ${hSz.className}`} dangerouslySetInnerHTML={{ __html: row.header }} style={{ color: s(data.colorListItemHeaders) || undefined, fontSize: hSz.fontSize, fontFamily: s(data.headerFontFamily) }} /> : null}<li className={`mdc-list-item${readonly ? ' mdc-list-item--disabled' : ''}`} data-oid={row.objectId} onClick={() => !control && this.activate(data, undefined, current, row)} style={{ alignItems: 'center', background: active ? s(data.listItemBackgroundActive) : s(data.listItemBackground), cursor: readonly || type === 'text' ? 'default' : 'pointer', height: n(data.listItemHeight) || undefined, overflow: row.overflow ? 'visible' : undefined, textAlign: s(data.listItemAlignment, 'left') as React.CSSProperties['textAlign'] }}>{image ? <span className="mdc-list-item__graphic materialdesign-icon-image" style={{ color, fontSize: n(data.listImageHeight, 24), marginRight: n(data.distanceBetweenTextAndImage) || undefined }}>{renderIcon(image, color, n(data.listImageHeight, 24), !!color)}</span> : null}<span className="mdc-list-item__text"><span className={`mdc-list-item__primary-text ${pSz.className}`} dangerouslySetInnerHTML={{ __html: row.text }} style={{ color: s(data.colorListItemText) || undefined, fontFamily: s(data.listItemFont), fontSize: pSz.fontSize }} />{row.subText ? <span className={`mdc-list-item__secondary-text ${sSz.className}`} dangerouslySetInnerHTML={{ __html: row.subText }} style={{ color: s(data.colorListItemTextSecondary) || undefined, fontFamily: s(data.listItemSubFont), fontSize: sSz.fontSize }} /> : null}</span>{control ? <span className="mdc-list-item__meta" style={{ alignItems: 'center', display: 'flex', marginLeft: 'auto' }}>{control}</span> : null}{row.rightText ? <span className="mdc-list-item__meta materialdesign-list-item-text-right" style={{ fontSize: 'inherit', marginLeft: 'auto', textAlign: 'right', width: n(data.rightTextWidth) || undefined }}><span className={`materialdesign-list-item-text-right-primary ${rSz.className}`} dangerouslySetInnerHTML={{ __html: row.rightText }} style={{ display: 'block', fontSize: rSz.fontSize, color: s(data.colorListItemTextRight) || undefined }} />{row.rightSubText ? <span className={`materialdesign-list-item-text-right-secondary ${rsSz.className}`} dangerouslySetInnerHTML={{ __html: row.rightSubText }} style={{ display: 'block', fontSize: rsSz.fontSize, color: s(data.colorListItemTextSecondaryRight) || undefined }} /> : null}</span> : null}</li>{row.divider ? <li className={`mdc-list-divider${s(data.listItemDividerStyle) === 'padded' ? ' mdc-list-divider--padded' : s(data.listItemDividerStyle) === 'inset' ? ' mdc-list-divider--inset' : ''}`} style={{ borderBottom: `1px solid ${s(data.colorListItemDivider, 'rgba(0,0,0,.12)')}`, listStyle: 'none' }} /> : null}</React.Fragment>; })}</ul>;
        const headerHeight = n(data.header_height, 60); const header = s(data.headers) ? <div className="materialdesign-list-header-container" style={{ height: headerHeight, marginBottom: -5, overflow: 'hidden', position: 'relative' }}><div className="materialdesign-html-card-container mdc-card" style={{ alignItems: 'center', background: 'transparent', display: 'flex', height: headerHeight + 5, margin: '8px 3px 3px', padding: `${n(data.header_padding_top, 6)}px ${n(data.header_padding_right, 16)}px ${n(data.header_padding_bottom, 20)}px ${n(data.header_padding_left, 16)}px`, textAlign: s(data.alignment, 'flex-start').replace('flex-', '') as React.CSSProperties['textAlign'] }}>{renderIcon(s(data.headerImage), s(data.headerImageColor), n(data.headerImageHeight, 24), !!data.headerImageColor)}<div className="materialdesign-list-header" dangerouslySetInnerHTML={{ __html: s(data.headers) }} style={{ color: s(data.headerTextColor, '#44739e'), fontFamily: s(data.headerFontFamily), fontSize: sizeCss(data.headerTextSize, 24) }} /></div></div> : null;
        const list = s(data.listLayout, 'standard') === 'standard' ? content : <div className={`materialdesign-list-card${s(data.listLayout) === 'cardOutlined' ? ' materialdesign-list-card--outlined' : ''}`}>{content}</div>; return <div className="materialdesign-widget materialdesign-list" style={{ ...vars, ['--materialdesign-list-item-height' as string]: n(data.listItemHeight) ? `${n(data.listItemHeight)}px` : undefined, height: '100%', width: '100%' }}><style>{listCss}</style>{header}{list}</div>;
    }
}
