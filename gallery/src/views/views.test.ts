import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeAll, describe, expect, it } from 'vitest';

import scenarioJson from '../../scenario/scenario.json';
import { installShim } from '../runtime/GalleryRxWidget';
import { createRuntime } from '../runtime/runtime';
import { validateScenario } from '../runtime/scenario';
import { DEFAULT_QUERY } from '../state';
import { GalleryView, MAX_VIEW_LEVELS } from './GalleryView';
import { VIEWS, type ViewFile, viewProblems } from './views';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
beforeAll(() => installShim());

const stateIds = new Set(Object.keys(validateScenario(scenarioJson).states));
const style = { left: 0, top: 0, width: 1, height: 1 };

describe('gallery views', () => {
    it('only use known widgets, demo data points and views that exist', () => {
        expect(viewProblems(VIEWS, stateIds)).toEqual([]);
    });
    it('reports unknown templates, foreign ids, unknown demo ids and missing views', () => {
        const bad = { v: { widgets: {
            w1: { tpl: 'tplNope', data: {}, style },
            w2: { tpl: 'tplVis2-materialdesign-Switch', data: { oid: 'javascript.0.x' }, style },
            w3: { tpl: 'tplVis2-materialdesign-Grid-Views', data: { countViews: 1, View0: 'missing' }, style },
            w4: { tpl: 'tplVis2-materialdesign-Vuetify-Dialog-View', data: { contains_view: 'gone' }, style },
            w5: { tpl: 'tplVis2-materialdesign-Switch', data: { oid: '0_userdata.0.demo.living.lihgt' }, style },
        } } };
        expect(viewProblems(bad, stateIds)).toEqual(['v/w1: unknown tpl tplNope', 'v/w2: javascript.0.x is not a demo data point', 'v/w3: unknown view missing', 'v/w4: unknown view gone', 'v/w5: 0_userdata.0.demo.living.lihgt is not a demo data point']);
    });
    it('stops a view that embeds itself at the level limit and shows the placeholder', async () => {
        const selfEmbedding: ViewFile = { widgets: { w: { tpl: 'tplVis2-materialdesign-view-in-widget', data: { oid: '0_userdata.0.demo.general.viewName' }, style: { left: 0, top: 0, width: 100, height: 100 } } } };
        VIEWS.loop = selfEmbedding;
        const runtime = createRuntime({ test: true, now: new Date('2026-06-15T10:00:00') });
        runtime.store.setState('0_userdata.0.demo.general.viewName', 'loop', true);
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        act(() => { root.render(React.createElement(GalleryView, { name: 'loop', runtime, query: DEFAULT_QUERY })); });
        // Widget modules load lazily; under a loaded machine 20 ticks were not always enough.
        for (let i = 0; i < 200 && host.querySelectorAll('.g-missing-view').length === 0; i++) await act(async () => { await new Promise(resolve => window.setTimeout(resolve, 20)); });
        expect(host.querySelectorAll('[data-view="loop"]').length).toBe(MAX_VIEW_LEVELS);
        expect(host.querySelectorAll('.g-missing-view').length).toBeGreaterThan(0);
        act(() => root.unmount());
        runtime.stop();
        delete VIEWS.loop;
        host.remove();
    });
});
