import { describe, expect, it } from 'vitest';

import meta from 'virtual:gallery-meta';

import { demoObjects, templateFiles, viewTemplate } from './templates';

describe('templates', () => {
    it('writes every demo object with _id, native and the folder channels above it', () => {
        const objects = demoObjects({ objects: { '0_userdata.0.demo.living.light': { type: 'state', common: { name: 'Light', type: 'boolean', role: 'switch.light' } } } });
        expect(objects['0_userdata.0.demo.living.light']).toMatchObject({ _id: '0_userdata.0.demo.living.light', type: 'state', native: {} });
        expect(objects['0_userdata.0.demo']).toMatchObject({ type: 'folder' });
        expect(objects['0_userdata.0.demo.living']).toMatchObject({ type: 'channel' });
        expect(objects['0_userdata.0']).toBeUndefined();
    });
    it('wraps a view so the vis-2 view import accepts it and drops gallery-only keys', () => {
        const template = viewTemplate({ widgets: { w1: { tpl: 't', data: { designStyle: 'default', oid: 'x' }, style: {} } } }, 'dashboard-phone');
        expect(template).toEqual({ settings: { style: {} }, widgets: { w000001: { tpl: 't', data: { oid: 'x' }, style: {}, widgetSet: 'vis2-materialdesign' } }, activeWidgets: [], name: 'dashboard-phone' });
    });
    it('keeps other designStyle values, keeps the view settings and numbers widgets in order', () => {
        const template = viewTemplate({ settings: { style: { width: '390px' } }, widgets: { a: { tpl: 't', data: { designStyle: 'm3' }, style: {} }, b: { tpl: 'u', data: {}, style: {} } } }, 'v');
        expect(template).toMatchObject({ settings: { style: { width: '390px' } } });
        expect(Object.keys(template.widgets as object)).toEqual(['w000001', 'w000002']);
        expect((template.widgets as Record<string, { data: object }>).w000001.data).toEqual({ designStyle: 'm3' });
    });
    it('treats a widget without data as empty data', () => {
        const template = viewTemplate({ widgets: { w1: { tpl: 't', style: {} } } }, 'v');
        expect((template.widgets as Record<string, { data: object }>).w000001.data).toEqual({});
    });
    it('lists on the About page exactly the files the build emits', () => {
        expect(meta.templates.map(name => `templates/${name}.json`).sort()).toEqual(Object.keys(templateFiles()).sort());
    });
});
