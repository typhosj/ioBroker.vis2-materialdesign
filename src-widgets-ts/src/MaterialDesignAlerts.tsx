import React from 'react';
import type { RxWidgetInfo, VisRxWidgetState } from '@iobroker/types-vis-2';
import { renderIcon } from './MaterialDesignButtons';
import { RenderProps, VisWidget, createInfo, setStateValue, sizeCss, stateValue } from './widgetUtils';

type Alert = { text?: string; icon?: string; backgroundColor?: string; borderColor?: string; iconColor?: string; fontColor?: string };
type Data = Record<string, unknown> & { oid?: string };
const s = (value: unknown, fallback = ''): string => value === undefined || value === null || value === '' || value === 'null' ? fallback : String(value);
const n = (value: unknown, fallback = 0): number => value === undefined || value === null || value === '' || !Number.isFinite(Number(value)) ? fallback : Number(value);
const b = (value: unknown, fallback = false): boolean => value === undefined || value === null || value === '' ? fallback : value === true || value === 'true' || value === 1 || value === '1';
function parse(value: unknown): Alert[] | null { try { const result: unknown = JSON.parse(s(value)); return Array.isArray(result) ? result as Alert[] : null; } catch { return null; } }
// Material Design elevation shadows (dp 0..24), matching Vuetify v-alert elevation
const U = 'rgba(0,0,0,.2)', P = 'rgba(0,0,0,.14)', A = 'rgba(0,0,0,.12)';
const ELEV = ['none',
    `0 2px 1px -1px ${U},0 1px 1px 0 ${P},0 1px 3px 0 ${A}`,
    `0 3px 1px -2px ${U},0 2px 2px 0 ${P},0 1px 5px 0 ${A}`,
    `0 3px 3px -2px ${U},0 3px 4px 0 ${P},0 1px 8px 0 ${A}`,
    `0 2px 4px -1px ${U},0 4px 5px 0 ${P},0 1px 10px 0 ${A}`,
    `0 3px 5px -1px ${U},0 5px 8px 0 ${P},0 1px 14px 0 ${A}`,
    `0 3px 5px -1px ${U},0 6px 10px 0 ${P},0 1px 18px 0 ${A}`,
    `0 4px 5px -2px ${U},0 7px 10px 1px ${P},0 2px 16px 1px ${A}`,
    `0 5px 5px -3px ${U},0 8px 10px 1px ${P},0 3px 14px 2px ${A}`,
    `0 5px 6px -3px ${U},0 9px 12px 1px ${P},0 3px 16px 2px ${A}`,
    `0 6px 6px -3px ${U},0 10px 14px 1px ${P},0 4px 18px 3px ${A}`,
    `0 6px 7px -4px ${U},0 11px 15px 1px ${P},0 4px 20px 3px ${A}`,
    `0 7px 8px -4px ${U},0 12px 17px 2px ${P},0 5px 22px 4px ${A}`,
    `0 7px 8px -4px ${U},0 13px 19px 2px ${P},0 5px 24px 4px ${A}`,
    `0 7px 9px -4px ${U},0 14px 21px 2px ${P},0 5px 26px 4px ${A}`,
    `0 8px 9px -5px ${U},0 15px 22px 2px ${P},0 6px 28px 5px ${A}`,
    `0 8px 10px -5px ${U},0 16px 24px 2px ${P},0 6px 30px 5px ${A}`,
    `0 8px 11px -5px ${U},0 17px 26px 2px ${P},0 6px 32px 5px ${A}`,
    `0 9px 11px -5px ${U},0 18px 28px 2px ${P},0 7px 34px 6px ${A}`,
    `0 9px 12px -6px ${U},0 19px 29px 2px ${P},0 7px 36px 6px ${A}`,
    `0 10px 13px -6px ${U},0 20px 31px 3px ${P},0 8px 38px 7px ${A}`,
    `0 10px 13px -6px ${U},0 21px 33px 3px ${P},0 8px 40px 7px ${A}`,
    `0 10px 14px -6px ${U},0 22px 35px 3px ${P},0 8px 42px 7px ${A}`,
    `0 11px 14px -7px ${U},0 23px 36px 3px ${P},0 9px 44px 8px ${A}`,
    `0 11px 15px -7px ${U},0 24px 38px 3px ${P},0 9px 46px 8px ${A}`];
const elevation = (value: unknown): string | undefined => { const level = Math.max(0, Math.min(24, Math.round(Number(value) || 0))); return level ? ELEV[level] : undefined; };
const attrs: RxWidgetInfo['visAttrs'] = [
    { name: 'common', fields: [{ name: 'oid', label: 'oid', type: 'id' }, { name: 'showMaxAlerts', label: 'showMaxAlerts', type: 'number', default: 3 }, { name: 'minScreenResolution', label: 'minScreenResolution', type: 'number' }, { name: 'debug', label: 'debug', type: 'checkbox' }] },
    { name: 'alertLayout', label: 'group_alertLayout', fields: [{ name: 'alertLayouts', label: 'alertLayouts', type: 'select', options: ['normal', 'outlined', 'tile'], default: 'normal' }, { name: 'alertDense', label: 'alertDense', type: 'checkbox', default: true }, { name: 'alertElevation', label: 'alertElevation', type: 'slider', min: 0, max: 24, step: 1, default: 1 }, { name: 'alertMarginBottom', label: 'alertMarginBottom', type: 'number', default: 16 }, { name: 'alertBorderLayout', label: 'alertBorderLayout', type: 'select', options: ['none', 'top', 'right', 'left', 'bottom'], default: 'none' }, { name: 'alertFontSize', label: 'alertFontSize', type: 'number' }, { name: 'alertFontFamily', label: 'alertFontFamily', type: 'fontname' }, { name: 'alertIconSize', label: 'alertIconSize', type: 'number' }, { name: 'closeIcon', label: 'closeIcon', type: 'icon', default: 'close-circle-outline' }, { name: 'closeIconColor', label: 'closeIconColor', type: 'color' }, { name: 'closeIconPressColor', label: 'closeIconPressColor', type: 'color' }] },
];
export default class MaterialDesignAlerts extends VisWidget {
    static getWidgetInfo(): RxWidgetInfo { return { ...createInfo('tplVis2-materialdesign-Alerts', 'Alerts', attrs), visPrev: '<img src="widgets/vis2-materialdesign/img/prev_alerts.png"></img>', visDefaultStyle: { width: 150, height: 38 } }; }
    getWidgetInfo(): RxWidgetInfo { return MaterialDesignAlerts.getWidgetInfo(); }
    renderWidgetBody(props: RenderProps): React.JSX.Element {
        super.renderWidgetBody(props);
        const data = this.state.rxData as unknown as Data;
        const raw = stateValue(this.state as VisRxWidgetState, s(data.oid));
        const parsed = parse(raw);
        const alerts = parsed ?? (raw === undefined || raw === null || raw === '' ? [] : [{ text: 'Error in JSON string', borderColor: 'red', icon: 'alert-box', iconColor: 'red' }]);
        const shown = n(data.showMaxAlerts) > 0 ? alerts.slice(0, n(data.showMaxAlerts)) : alerts;
        const close = (index: number): void => { if (!parsed) return; parsed.splice(index, 1); setStateValue(this.props, s(data.oid), JSON.stringify(parsed)); };
        const border = s(data.alertBorderLayout);
        const dense = b(data.alertDense, true);
        const stripe = 6; const padV = dense ? 8 : 16; const padH = 16;
        return <div className="materialdesign-widget materialdesign-alerts" style={{ height: '100%', overflow: 'visible', pointerEvents: 'none', width: '100%' }}><style>{`@media (max-width:${Math.max(0, n(data.minScreenResolution) - 1)}px){.materialdesign-alerts{display:none!important}}`}</style><div className="materialdesign-vuetify-alerts" style={{ pointerEvents: 'auto', width: '100%' }}>{shown.map((alert, index) => <div className={`v-alert ${s(data.alertLayouts, 'normal') === 'outlined' ? 'v-alert--outlined' : ''} ${s(data.alertLayouts) === 'tile' ? 'v-alert--tile' : ''}`} key={index} style={{ alignItems: 'center', background: s(alert.backgroundColor), borderBottom: border === 'bottom' ? `${stripe}px solid ${s(alert.borderColor)}` : undefined, borderLeft: border === 'left' ? `${stripe}px solid ${s(alert.borderColor)}` : undefined, borderRight: border === 'right' ? `${stripe}px solid ${s(alert.borderColor)}` : undefined, borderTop: border === 'top' ? `${stripe}px solid ${s(alert.borderColor)}` : undefined, boxShadow: elevation(data.alertElevation), display: 'flex', fontFamily: s(data.alertFontFamily, 'inherit'), fontSize: sizeCss(data.alertFontSize, 16), marginBottom: n(data.alertMarginBottom, 16), minHeight: dense ? undefined : 48, paddingBottom: padV - (border === 'bottom' ? stripe : 0), paddingLeft: padH - (border === 'left' ? stripe : 0), paddingRight: padH - (border === 'right' ? stripe : 0), paddingTop: padV - (border === 'top' ? stripe : 0) }}><span className="materialdesign-v-alerts-prepend" style={{ display: 'inline-flex', marginRight: 12 }}>{alert.icon ? renderIcon(alert.icon, s(alert.iconColor), n(data.alertIconSize, 24), !!alert.iconColor) : null}</span><label className="materialdesign-v-alert-text" style={{ color: s(alert.fontColor), flex: 1 }} dangerouslySetInnerHTML={{ __html: s(alert.text) }} /><button className="materialdesign-icon-button v-alert-materialdesign-icon-button" onClick={() => close(index)} style={{ background: 'transparent', border: 0, cursor: 'pointer', height: 30, width: 30 }}>{renderIcon(s(data.closeIcon, 'close-circle-outline'), s(data.closeIconColor, '#44739e'), 20, true)}</button></div>)}</div></div>;
    }
}
