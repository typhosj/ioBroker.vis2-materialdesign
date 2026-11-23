import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

import meta from 'virtual:gallery-meta';

import { repoRoot } from './paths';
import { VIEWS } from '../src/views/views';
import { installShim } from '../src/runtime/GalleryRxWidget';
import { defaultData, expandFields } from '../src/runtime/widgetInfo';
import { entryByTpl, loadWidget } from '../src/runtime/widgets';
import { TEMPLATE_VIEWS, demoObjects, missingViewReferences, templateFiles, viewTemplate } from './templates';

beforeAll(() => installShim());

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

    it('sets no colour or background on any exported or source view, so vis-2 and the gallery theme colour them', () => {
        const colourKeys = ['color', 'background-color', 'background'];
        const styleOf = (view: { settings?: { style?: Record<string, unknown> } }) => view.settings?.style ?? {};
        for (const name of TEMPLATE_VIEWS) {
            const exported = JSON.parse(templateFiles()[`templates/${name}.json`]) as { settings?: { style?: Record<string, unknown> } };
            for (const key of colourKeys) expect(styleOf(exported), `${name} export`).not.toHaveProperty(key);
        }
        for (const [name, view] of Object.entries(VIEWS)) {
            for (const key of colourKeys) expect(styleOf(view), `${name} source`).not.toHaveProperty(key);
        }
    });
    it('tells the download notes to import dashboard-phone-lights before dashboard-phone, in both languages', () => {
        for (const lang of ['en', 'de']) {
            const text = (JSON.parse(readFileSync(join(repoRoot, `gallery/src/i18n/${lang}.json`), 'utf8')) as Record<string, string>).gallery_downloads_text;
            expect(text.indexOf('dashboard-phone-lights'), lang).toBeGreaterThan(-1);
            expect(text.indexOf('dashboard-phone-lights'), lang).toBeLessThan(text.search(/dashboard-phone(?![-a-z])/));
        }
    });
    it('keeps the size keys of the view', () => {
        expect(viewTemplate({ settings: { style: { width: '1px' } }, widgets: {} }, 'v').settings).toEqual({ style: { width: '1px' } });
    });
});

describe('view references', () => {
    const keys = (tpl: string, data: Record<string, unknown>): string[] => Object.keys(data).filter(key => /^(nav_view|contains_view(_[0-9]+)?)$/.test(key) && tpl === 'x');
    const view = (data: Record<string, unknown>) => ({ widgets: { a: { tpl: 'x', data } } });
    it('accepts a reference to an exported view, an empty one and an indexed one', () => {
        const views = { main: view({ nav_view: 'child', contains_view_1: 'child', contains_view: '' }), child: { widgets: {} } };
        expect(missingViewReferences(views, keys)).toEqual([]);
    });
    it('reports a reference to a view that is not exported, plain or indexed', () => {
        expect(missingViewReferences({ main: view({ contains_view: 'gone' }) }, keys)).toEqual(['main.a.contains_view -> gone']);
        expect(missingViewReferences({ main: view({ contains_view_0: 'gone' }) }, keys)).toEqual(['main.a.contains_view_0 -> gone']);
    });
    it('skips a non-string views value and treats a reference that differs only in case as missing', () => {
        expect(missingViewReferences({ main: view({ contains_view: 5, nav_view: null }) }, keys)).toEqual([]);
        expect(missingViewReferences({ main: view({ nav_view: 'Child' }), child: { widgets: {} } }, keys)).toEqual(['main.a.nav_view -> Child']);
    });
    it('ignores keys the widget does not declare as views', () => {
        expect(missingViewReferences({ main: view({ title: 'gone' }) }, () => [])).toEqual([]);
    });
    it('exports every view the exported widgets reference, judged by the attributes the widgets declare as type views', async () => {
        const views = Object.fromEntries(TEMPLATE_VIEWS.map(name => [name, JSON.parse(templateFiles()[`templates/${name}.json`])]));
        const infos = new Map<string, ReturnType<Awaited<ReturnType<typeof loadWidget>>['getWidgetInfo']>>();
        for (const { widgets } of Object.values(views) as Array<{ widgets: Record<string, { tpl: string }> }>) {
            for (const { tpl } of Object.values(widgets)) {
                const entry = entryByTpl(tpl);
                if (!entry) throw new Error(`unknown widget ${tpl}`);
                if (!infos.has(tpl)) infos.set(tpl, (await loadWidget(entry.module)).getWidgetInfo());
            }
        }
        const viewKeys = (tpl: string, data: Record<string, unknown>): string[] => {
            const info = infos.get(tpl)!;
            return expandFields(info, { ...defaultData(info), ...data }).filter(entry => (entry.field as { type?: string }).type === 'views').map(entry => entry.key);
        };
        expect(missingViewReferences(views, viewKeys)).toEqual([]);
        // The phone dialog must really be covered by the check above, not skipped by an unknown attribute name.
        expect(viewKeys('tplVis2-materialdesign-Vuetify-Dialog-View', {})).toContain('contains_view');
    }, 120_000);
});
