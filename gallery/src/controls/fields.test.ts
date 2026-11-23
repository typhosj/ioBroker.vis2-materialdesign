import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import { describe, expect, it } from 'vitest';

import { coerce, controlKind, selectOptions, visibleGroups } from './fields';

const f = (type: string, extra: Record<string, unknown> = {}) => ({ name: 'x', type, ...extra }) as never;

describe('controlKind', () => {
    it('maps every field type the widgets use', () => {
        expect({
            checkbox: controlKind(f('checkbox')), number: controlKind(f('number')), slider: controlKind(f('slider')),
            select: controlKind(f('select')), color: controlKind(f('color')), text: controlKind(f('text')),
            url: controlKind(f('url')), image: controlKind(f('image')), dimension: controlKind(f('dimension')),
            fontname: controlKind(f('fontname')), custom: controlKind(f('custom')), html: controlKind(f('html')),
            id: controlKind(f('id')), views: controlKind(f('views')), history: controlKind(f('history')), help: controlKind(f('help')),
        }).toEqual({
            checkbox: 'checkbox', number: 'number', slider: 'range', select: 'select', color: 'color', text: 'text',
            url: 'text', image: 'text', dimension: 'text', fontname: 'text', custom: 'text', html: 'textarea',
            id: 'id', views: 'view', history: 'fixed', help: 'none',
        });
    });
    it('hides theme fields and unknown types become text', () => {
        expect(controlKind({ name: '__mdwTheme_colors_x_0', type: 'id' } as never)).toBe('none');
        expect(controlKind(f('somethingNew'))).toBe('text');
    });
});

describe('coerce', () => {
    it('turns number input into numbers and keeps empty as empty', () => {
        expect(coerce('number', '4.5')).toBe(4.5);
        expect(coerce('range', '10')).toBe(10);
        expect(coerce('number', '')).toBe('');
        expect(coerce('number', 'abc')).toBe('');
        expect(coerce('checkbox', true)).toBe(true);
        expect(coerce('text', 'a')).toBe('a');
    });
});

describe('selectOptions', () => {
    it('accepts plain strings and value/label objects', () => {
        expect(selectOptions(f('select', { options: ['a', 'b'] }))).toEqual([{ value: 'a', label: 'a' }, { value: 'b', label: 'b' }]);
        expect(selectOptions(f('select', { options: [{ value: 'v', label: 'legacy' }] }))).toEqual([{ value: 'v', label: 'legacy' }]);
        expect(selectOptions(f('select'))).toEqual([]);
    });
});

describe('visibleGroups', () => {
    const info = { id: 't', visSet: 's', visName: 'n', visAttrs: [
        { name: 'common', fields: [{ name: 'count', type: 'number' }, { name: 'a', type: 'text', hidden: (d: Record<string, unknown>) => d.count === 0 }] },
        { name: 'rows', label: 'group_rows', indexFrom: 0, indexTo: 'count', fields: [{ name: 'r', type: 'text' }] },
        { name: 'theme', fields: [{ name: '__mdwTheme_colors_x_0', type: 'id', hidden: () => true }] },
    ] } as unknown as RxWidgetInfo;

    it('repeats indexed groups with the count and drops empty groups', () => {
        expect(visibleGroups(info, { count: 1 }).map(g => [g.name, g.index, g.fields.map(e => e.key)])).toEqual([
            ['common', undefined, ['count', 'a']], ['rows', 0, ['r0']], ['rows', 1, ['r1']],
        ]);
    });
    it('re-evaluates hidden with the current data', () => {
        expect(visibleGroups(info, { count: 0 })[0].fields.map(e => e.key)).toEqual(['count']);
    });
});
