import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import MaterialDesignGridViews from './MaterialDesignGridViews';
import MaterialDesignMasonryViews from './MaterialDesignMasonryViews';

function fixture<T>(value: unknown): T { return value as T; }

// The widget measures itself through a ResizeObserver; the tests set the measured width directly.
function widget<T extends MaterialDesignGridViews | MaterialDesignMasonryViews>(
    Kind: new (props: never) => T,
    rxData: Record<string, unknown>,
    width: number,
    values: Record<string, unknown> = {},
): T {
    const instance = new Kind(fixture<never>({ context: {} }));
    instance.state = fixture<typeof instance.state>({ rxData, values });
    (instance as unknown as { width: number }).width = width;
    // Embedding a child view is vis-2's job; the tests only care about the box around it.
    (instance as unknown as { getWidgetView: (view: string) => React.JSX.Element }).getWidgetView = view => <span>{view}</span>;
    return instance;
}

function markup(instance: MaterialDesignGridViews | MaterialDesignMasonryViews): string {
    return renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<MaterialDesignGridViews['renderWidgetBody']>[0]>({ id: 'w1' })));
}

describe('per-view resolution bounds', () => {
    const data = {
        countViews: 1,
        View0: 'phoneOnly',
        visibleResolutionLessThan0: 800,
        visibleResolutionGreaterThan0: 400,
    };

    it('hides the view outside its width range and shows it inside', () => {
        expect(markup(widget(MaterialDesignGridViews, data, 600))).toContain('display:block');
        expect(markup(widget(MaterialDesignGridViews, data, 900))).toContain('display:none');
        expect(markup(widget(MaterialDesignGridViews, data, 300))).toContain('display:none');
    });

    it('treats an empty bound as no bound', () => {
        const openEnded = { countViews: 1, View0: 'wide', visibleResolutionGreaterThan0: 400, visibleResolutionLessThan0: '' };
        expect(markup(widget(MaterialDesignGridViews, openEnded, 4000))).toContain('display:block');
    });
});

describe('per-view visibility condition', () => {
    // The condition that holds SHOWS the view. It used to be read negated, which made every
    // "== value" configuration do the exact opposite of what the field promises.
    const data = { countViews: 1, View0: 'onlyWhenOne', visibilityOid0: 'x.0.mode', visibilityConditionValue0: '1' };

    it('shows the view while the condition holds and hides it otherwise', () => {
        expect(markup(widget(MaterialDesignGridViews, data, 1200, { 'x.0.mode.val': 1 }))).toContain('display:block');
        expect(markup(widget(MaterialDesignGridViews, data, 1200, { 'x.0.mode.val': 2 }))).toContain('display:none');
    });

    it('applies the chosen operator, not just equality', () => {
        const greater = { ...data, visibilityCondition0: '>' };
        expect(markup(widget(MaterialDesignGridViews, greater, 1200, { 'x.0.mode.val': 5 }))).toContain('display:block');
        expect(markup(widget(MaterialDesignGridViews, greater, 1200, { 'x.0.mode.val': 0 }))).toContain('display:none');
    });

    it('leaves a view without a visibility object visible', () => {
        expect(markup(widget(MaterialDesignGridViews, { countViews: 1, View0: 'always' }, 1200))).toContain('display:block');
    });
});

describe('masonry alignment', () => {
    // The four options are text-align values ('justify' is not even a justify-items one) and align
    // the content of a column. Written as justify-items they shrank every column to its content
    // width, so a masonry of empty views collapsed to a set of lines.
    it('aligns the column content and leaves the columns stretched', () => {
        expect(markup(widget(MaterialDesignMasonryViews, { countViews: 1, View0: 'a', viewAlignment: 'left' }, 1200))).toContain('text-align:left');
        expect(markup(widget(MaterialDesignMasonryViews, { countViews: 1, View0: 'a', viewAlignment: 'justify' }, 1200))).toContain('text-align:justify');
        expect(markup(widget(MaterialDesignMasonryViews, { countViews: 1, View0: 'a' }, 1200))).toContain('text-align:center');
        expect(markup(widget(MaterialDesignMasonryViews, { countViews: 1, View0: 'a' }, 1200))).not.toContain('justify-items');
    });

    it('leaves the grid widget alone, which has its own two alignment fields', () => {
        const grid = markup(widget(MaterialDesignGridViews, { countViews: 1, View0: 'a', viewAlignment: 'left' }, 1200));
        expect(grid).not.toContain('justify-items');
        expect(grid).not.toContain('text-align');
    });
});
