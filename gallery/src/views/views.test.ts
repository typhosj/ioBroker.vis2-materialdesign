import { describe, expect, it } from 'vitest';

import { VIEWS, viewProblems } from './views';

describe('gallery views', () => {
    it('only use known widgets, demo data points and views that exist', () => {
        expect(viewProblems(VIEWS)).toEqual([]);
    });
    it('reports unknown templates, foreign ids and missing views', () => {
        const style = { left: 0, top: 0, width: 1, height: 1 };
        const bad = { v: { widgets: {
            w1: { tpl: 'tplNope', data: {}, style },
            w2: { tpl: 'tplVis2-materialdesign-Switch', data: { oid: 'javascript.0.x' }, style },
            w3: { tpl: 'tplVis2-materialdesign-Grid-Views', data: { countViews: 1, View0: 'missing' }, style },
            w4: { tpl: 'tplVis2-materialdesign-Vuetify-Dialog-View', data: { contains_view: 'gone' }, style },
        } } };
        expect(viewProblems(bad)).toEqual(['v/w1: unknown tpl tplNope', 'v/w2: javascript.0.x is not a demo data point', 'v/w3: unknown view missing', 'v/w4: unknown view gone']);
    });
});
