import { describe, expect, it } from 'vitest';

import { importDocVariants } from './docVariants';

const index = [{ module: 'MaterialDesignSwitch', tpl: 'tplVis2-materialdesign-Switch', name: 'Switch' }];
const label = (top: number, text: string) => ({ tpl: 'tplHtml', data: { html: `<b>${text}</b>` }, style: { left: '16px', top: `${top}px`, width: '200px', height: '30px' } });
const sw = (top: number, style: string, oid: string, extra: Record<string, unknown> = {}) => ({
    tpl: 'tplVis2-materialdesign-Switch',
    data: { oid, designStyle: style, __mdwTheme_colors_x_0: 'vis2-materialdesign.0.colors.light.x', ...extra },
    style: { left: style === 'legacy' ? '230px' : '600px', top: `${top}px`, width: '260px', height: '48px' },
});

describe('importDocVariants', () => {
    const project = {
        'm3-32-toggles': { widgets: { w1: label(68, 'Default'), w2: sw(68, 'legacy', 'host.0.light'), w3: sw(68, 'material3', 'host.0.light'), w4: label(140, 'With lock'), w5: sw(140, 'material3', 'host.0.light', { lockEnabled: true }) } },
        'm3-32-toggles-dark': { widgets: { w9: sw(68, 'material3', 'host.0.light') } },
        '01-checkbox': { widgets: { w8: sw(68, 'material3', 'host.0.light') } },
    };

    it('takes the Material 3 column of the light doc views, labelled by the row text', () => {
        const { variants, unmapped } = importDocVariants(project, index, { 'host.0.light': '0_userdata.0.demo.living.light' });
        expect(unmapped).toEqual([]);
        expect(variants).toEqual([
            { module: 'MaterialDesignSwitch', id: 'default', label: 'Default', data: { oid: '0_userdata.0.demo.living.light' }, size: { width: 260, height: 48 } },
            { module: 'MaterialDesignSwitch', id: 'with-lock', label: 'With lock', data: { oid: '0_userdata.0.demo.living.light', lockEnabled: true }, size: { width: 260, height: 48 } },
        ]);
    });

    it('reports every host id, URL and IP address that has no mapping', () => {
        const withHost = { 'm3-32-toggles': { widgets: { w1: sw(68, 'material3', 'deyeidc.0.power', { image: 'http://192.168.1.5/x.png' }) } } };
        expect(importDocVariants(withHost, index, {}).unmapped).toEqual(['deyeidc.0.power', 'http://192.168.1.5/x.png']);
    });

    it('applies the text map to labels and data values, and id rules after the literal map', () => {
        const rows = { 'm3-32-toggles': { widgets: { l: label(68, 'Aus'), a: sw(68, 'material3', 'dev.0.12345.DP1', { placeholder: 'Raum' }) } } };
        const { variants, unmapped } = importDocVariants(rows, index, {}, [{ pattern: '^dev\\.0\\.\\d+\\.DP1$', replace: '0_userdata.0.demo.energy.power' }], { Aus: 'Off', Raum: 'Room' });
        expect(unmapped).toEqual([]);
        expect(variants.map(v => [v.id, v.label, v.data])).toEqual([['off', 'Off', { oid: '0_userdata.0.demo.energy.power', placeholder: 'Room' }]]);
    });

    it('derives a label from the data name when the row has no label widget', () => {
        const rows = { 'm3-32-toggles': { widgets: { a: sw(68, 'material3', 'x.0.a', { name: 'm3-32-toggles-switch-aus-m3' }) } } };
        expect(importDocVariants(rows, index, { 'x.0.a': '0_userdata.0.demo.general.flag' }, [], { 'Switch aus': 'Switch off' }).variants[0].label).toBe('Switch off');
    });

    it('numbers unlabelled rows and keeps ids unique per module', () => {
        const rows = { 'm3-32-toggles': { widgets: { a: sw(10, 'material3', 'x.0.a'), b: sw(80, 'material3', 'x.0.a') } } };
        const { variants } = importDocVariants(rows, index, { 'x.0.a': '0_userdata.0.demo.general.flag' });
        expect(variants.map(v => [v.id, v.label])).toEqual([['switch-1', 'Switch 1'], ['switch-2', 'Switch 2']]);
    });
});
