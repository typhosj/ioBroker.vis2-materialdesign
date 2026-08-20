import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import MaterialDesignProgressCircular from './MaterialDesignProgressCircular';

function fixture<T>(value: unknown): T { return value as T; }

function render(rxData: Record<string, unknown>, values: Record<string, unknown> = {}, style?: Record<string, number>): string {
    const widget = new MaterialDesignProgressCircular(fixture<ConstructorParameters<typeof MaterialDesignProgressCircular>[0]>({ context: {}, style }));
    widget.state = fixture<typeof widget.state>({ rxData, values });
    return renderToStaticMarkup(widget.renderWidgetBody(fixture<Parameters<MaterialDesignProgressCircular['renderWidgetBody']>[0]>({})));
}

const attr = (html: string, name: string): string => html.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? '';
const circumference = (size: number, stroke: number): number => 2 * Math.PI * Math.max(1, size / 2 - stroke / 2);

describe('circular progress geometry', () => {
    it('takes the size from the widget box when no explicit size is set', () => {
        expect(render({ oid: 'a.0.v' }, {}, { width: 120, height: 90 })).toContain('height:90px');
    });

    it('lets an explicit size win over the widget box', () => {
        expect(render({ oid: 'a.0.v', progressCircularSize: 40 }, {}, { width: 120, height: 90 })).toContain('height:40px');
    });

    it('derives the radius from size and stroke width', () => {
        const html = render({ oid: 'a.0.v', progressCircularSize: 100, progressCircularWidth: 10 });
        expect(attr(html, 'r')).toBe('45'); // 100/2 - 10/2
    });

    // A stroke wider than the circle would give a negative radius, which is an invalid SVG attribute
    // and renders nothing at all rather than a thin ring.
    it('never lets the radius drop to zero', () => {
        expect(attr(render({ oid: 'a.0.v', progressCircularSize: 2, progressCircularWidth: 10 }), 'r')).toBe('1');
    });
});

describe('circular progress value', () => {
    const size = 100;
    const stroke = 4;
    const base = { oid: 'a.0.v', progressCircularSize: size, progressCircularWidth: stroke, min: 0, max: 100 };

    it('empties the ring at the minimum and fills it at the maximum', () => {
        const full = render(base, { 'a.0.v.val': 100 });
        expect(Number(attr(full, 'stroke-dashoffset'))).toBeCloseTo(0, 6);
        const empty = render(base, { 'a.0.v.val': 0 });
        expect(Number(attr(empty, 'stroke-dashoffset'))).toBeCloseTo(circumference(size, stroke), 6);
    });

    it('puts a half-way value at half the circumference', () => {
        const html = render(base, { 'a.0.v.val': 50 });
        expect(Number(attr(html, 'stroke-dashoffset'))).toBeCloseTo(circumference(size, stroke) / 2, 6);
    });

    it('clamps a value outside the configured range', () => {
        expect(render(base, { 'a.0.v.val': 500 })).toContain('aria-valuenow="100"');
        expect(render(base, { 'a.0.v.val': -20 })).toContain('aria-valuenow="0"');
    });

    // Indeterminate means "no value to show", so the arc has to stay a fixed quarter turn whatever
    // the state happens to say — otherwise the spinner length jitters with incoming values.
    it('ignores the value entirely when indeterminate', () => {
        const quarter = circumference(size, stroke) * 0.25;
        for (const value of [0, 42, 90]) {
            const html = render({ ...base, progressIndeterminate: true }, { 'a.0.v.val': value });
            expect(Number(attr(html, 'stroke-dashoffset'))).toBeCloseTo(quarter, 6);
        }
    });
});
