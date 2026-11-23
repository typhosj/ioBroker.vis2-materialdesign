import type { RxWidgetInfo } from '@iobroker/types-vis-2';
import { describe, expect, it } from 'vitest';

import { MAX_GROUP_ENTRIES, defaultData, expandFields, groupIndices, isHidden, subscribedIds } from './widgetInfo';

const info = {
    id: 'tplProbe', visSet: 'x', visName: 'Probe',
    visAttrs: [
        { name: 'common', fields: [
            { name: 'oid', type: 'id', default: 'a.0.x' },
            { name: 'count', type: 'number', default: 1 },
            { name: 'label', type: 'text', hidden: (data: Record<string, unknown>) => !data.oid },
            { name: '__mdwThemeDark', type: 'id', default: 'vis2-materialdesign.0.colors.darkTheme', hidden: () => true },
            { name: 'legacyHidden', type: 'text', hidden: 'data.count > 1' },
        ] },
        { name: 'entries', indexFrom: 0, indexTo: 'count', fields: [
            { name: 'entryOid', type: 'id', default: 'a.0.entry' },
            { name: 'entryLabel', type: 'text', hidden: (_d: unknown, index?: number) => index === 1 },
        ] },
    ],
} as unknown as RxWidgetInfo;

describe('widgetInfo', () => {
    it('expands an indexed group from indexFrom to the count field inclusive, like the vis-2 editor', () => {
        expect(groupIndices(info.visAttrs[1], { count: 2 })).toEqual([0, 1, 2]);
        expect(expandFields(info, { count: 1 }).map(e => e.key)).toEqual(['oid', 'count', 'label', '__mdwThemeDark', 'legacyHidden', 'entryOid0', 'entryLabel0', 'entryOid1', 'entryLabel1']);
    });

    it('treats a missing or broken count as indexFrom only and caps a huge one', () => {
        expect(groupIndices(info.visAttrs[1], {})).toEqual([0]);
        expect(groupIndices(info.visAttrs[1], { count: 'x' })).toEqual([0]);
        expect(groupIndices(info.visAttrs[1], { count: -3 })).toEqual([]);
        expect(groupIndices(info.visAttrs[1], { count: 1e6 })).toHaveLength(MAX_GROUP_ENTRIES + 1);
        expect(groupIndices(info.visAttrs[0], { count: 5 })).toEqual([undefined]);
    });

    it('materialises defaults like the editor does on insert, including indexed entries', () => {
        expect(defaultData(info)).toEqual({
            oid: 'a.0.x', count: 1, __mdwThemeDark: 'vis2-materialdesign.0.colors.darkTheme',
            entryOid0: 'a.0.entry', entryOid1: 'a.0.entry',
        });
    });

    it('subscribes every non-empty id field once, hidden theme fields included', () => {
        expect(subscribedIds(info, { oid: 'a.0.x', count: 1, __mdwThemeDark: 't', entryOid0: 'a.0.x', entryOid1: ' ', label: 'a.0.label' }))
            .toEqual(['a.0.x', 't']);
    });

    it('evaluates group and field hidden functions with the index and ignores the string form', () => {
        const fields = expandFields(info, { count: 1, oid: '' });
        const byKey = (key: string) => fields.find(e => e.key === key)!;
        expect(isHidden(byKey('label'), { oid: '' })).toBe(true);
        expect(isHidden(byKey('label'), { oid: 'x' })).toBe(false);
        expect(isHidden(byKey('entryLabel1'), {})).toBe(true);
        expect(isHidden(byKey('entryLabel0'), {})).toBe(false);
        expect(isHidden(byKey('legacyHidden'), { count: 5 })).toBe(false);
    });

    it('treats a hidden function that throws as visible', () => {
        const throwing = { key: 'x', field: { name: 'x', type: 'text', hidden: () => { throw new Error('boom'); } }, group: { name: 'g', fields: [] } };
        expect(isHidden(throwing as never, {})).toBe(false);
    });
});
