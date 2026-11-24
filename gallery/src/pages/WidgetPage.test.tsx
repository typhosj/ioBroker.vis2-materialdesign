import { describe, expect, it } from 'vitest';

import { variantData } from './WidgetPage';

const info = { id: 'tplX', visSet: 'x', visName: 'X', visAttrs: [{ name: 'common', fields: [{ name: 'image', default: 'pencil' }, { name: 'buttontext', default: 'State' }] }] } as never;
const entry = (variants: unknown[]) => ({ module: 'M', name: 'X', tpl: 'tplX', family: 'buttons', doc: '', description: { en: '', de: '' }, expects: [], variants }) as never;

describe('variantData', () => {
    it('lets an empty string in the variant override a default', () => {
        const data = variantData(info, entry([{ id: 'a', label: 'A', data: { image: '' }, size: { width: 160, height: 48 } }]), 'a');
        expect(data.image).toBe('');
        expect(data.buttontext).toBe('State');
    });
    it('follows the global style unless the variant is bound to one', () => {
        const e = entry([{ id: 'a', label: 'A', data: {}, size: { width: 1, height: 1 } }, { id: 'b', label: 'B', data: {}, size: { width: 1, height: 1 }, designStyle: 'legacy' }]);
        expect(variantData(info, e, 'a').designStyle).toBe('default');
        expect(variantData(info, e, 'b').designStyle).toBe('legacy');
    });
});
