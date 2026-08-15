import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import MaterialDesignAdvancedViewInWidget from './MaterialDesignAdvancedViewInWidget';
import MaterialDesignAdvancedViewInWidget8 from './MaterialDesignAdvancedViewInWidget8';

type AnyAdvancedView = MaterialDesignAdvancedViewInWidget | MaterialDesignAdvancedViewInWidget8;

function fixture<T>(value: unknown): T { return value as T; }

function widget(rxData: Record<string, unknown>, value: unknown, kind = MaterialDesignAdvancedViewInWidget): AnyAdvancedView {
    const instance = new kind(fixture<ConstructorParameters<typeof kind>[0]>({ context: {} }));
    instance.state = fixture<typeof instance.state>({ rxData: { oid: 'view.oid', ...rxData }, values: { 'view.oid.val': value }, visible: true });
    (instance as unknown as { getWidgetView: (name: string) => React.JSX.Element }).getWidgetView = name => <div>{name}</div>;
    return instance;
}

function render(instance: AnyAdvancedView): string {
    return renderToStaticMarkup(instance.renderWidgetBody(fixture<Parameters<AnyAdvancedView['renderWidgetBody']>[0]>({})));
}

describe('advanced view fading', () => {
    it('animates with the configured duration and a CSS-valid easing', () => {
        const html = render(widget({ fadeInDuration: 5000, fadeEffect: 'swing' }, 'child-a'));
        expect(html).toContain('mdw-view-fade-in 5000ms ease-in-out');
        // `swing` is a jQuery easing; as a CSS timing function it kills the whole animation.
        expect(html).not.toContain('swing');
        expect(html).not.toContain('display:none');
    });

    it('keeps the previous view mounted for the fade-out', () => {
        vi.useFakeTimers();
        const instance = widget({ fadeOutDuration: 800 }, 'child-a');
        render(instance);
        instance.state = fixture<typeof instance.state>({ ...instance.state, values: { 'view.oid.val': 'child-b' } });
        const html = render(instance);
        expect(html).toContain('mdw-view-fade-out 800ms');
        expect(html).toContain('child-a');
        expect(html).toContain('child-b');

        vi.advanceTimersByTime(800);
        const after = render(instance);
        expect(after).not.toContain('child-a');
        vi.useRealTimers();
    });
});

describe('advanced view 8 options', () => {
    const views = { count: 2, contains_view_0: 'child-a', contains_view_1: 'child-b' };

    it('mounts every configured view only when it should stay loaded', () => {
        const lean = render(widget(views, 0, MaterialDesignAdvancedViewInWidget8));
        expect(lean).toContain('child-a');
        expect(lean).not.toContain('child-b');

        const kept = render(widget({ ...views, persistent: true }, 0, MaterialDesignAdvancedViewInWidget8));
        expect(kept).toContain('child-a');
        expect(kept).toContain('child-b');
    });

    it('drops the views while the widget is invisible', () => {
        const instance = widget({ ...views, persistent: true, notIfInvisible: true }, 0, MaterialDesignAdvancedViewInWidget8);
        instance.state = fixture<typeof instance.state>({ ...instance.state, visible: false });
        const html = render(instance);
        expect(html).not.toContain('child-a');
        expect(html).not.toContain('child-b');
    });
});
