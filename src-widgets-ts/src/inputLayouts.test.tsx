import React from 'react';
import { describe, expect, it } from 'vitest';

import MaterialDesignAutocomplete from './MaterialDesignAutocomplete';
import MaterialDesignInput from './MaterialDesignInput';
import MaterialDesignSelect from './MaterialDesignSelect';

function fixture<T>(value: unknown): T { return value as T; }

type El = React.ReactElement<Record<string, unknown>>;
function findAll(node: React.ReactNode, predicate: (el: El) => boolean, out: El[] = []): El[] {
    if (Array.isArray(node)) { node.forEach(child => findAll(child, predicate, out)); return out; }
    if (!React.isValidElement(node)) return out;
    const el = node as El;
    if (predicate(el)) out.push(el);
    findAll(el.props.children as React.ReactNode, predicate, out);
    return out;
}
// Throws on a missing element, so a negative assertion cannot pass on a lookup that found nothing.
function style(el: El | undefined, what: string): React.CSSProperties {
    if (!el) throw new Error(`${what} not rendered`);
    return (el.props.style ?? {});
}

function inputParts(inputLayout: unknown, designStyle?: string): { slot: React.CSSProperties; outline: () => React.CSSProperties } {
    const input = new MaterialDesignInput(fixture<ConstructorParameters<typeof MaterialDesignInput>[0]>({ context: {} }));
    input.state = fixture<typeof input.state>({ rxData: { oid: 'test.0.text', inputLayout, inputLabelText: 'Note', designStyle }, values: {} });
    const tree = input.renderWidgetBody(fixture<Parameters<typeof input.renderWidgetBody>[0]>({}));
    return {
        slot: style(findAll(tree, el => el.props.className === 'v-input__slot')[0], 'slot'),
        outline: () => style(findAll(tree, el => el.type === 'fieldset')[0], 'fieldset'),
    };
}

function selectParts(inputLayout: unknown, Widget: typeof MaterialDesignSelect = MaterialDesignSelect, designStyle?: string): { field: React.CSSProperties; outline: () => React.CSSProperties } {
    const select = new Widget(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({ context: {} }));
    select.state = fixture<typeof select.state>({ rxData: { oid: 'test.0.scene', inputLayout, inputLabelText: 'Scene', listDataMethod: 'valueList', valueList: 'a;b', designStyle }, values: {} });
    const tree = select.renderWidgetBody(fixture<Parameters<typeof select.renderWidgetBody>[0]>({}));
    // The field is a <button> on the Select and a <div> on the Autocomplete; both carry the v-select class.
    return {
        field: style(findAll(tree, el => typeof el.props.className === 'string' && el.props.className.startsWith('v-input v-input--dense v-select'))[0], 'field'),
        outline: () => style(findAll(tree, el => el.type === 'fieldset')[0], 'fieldset'),
    };
}

const SHAPED = '16px 16px 0 0';
const LEGACY_SHADOW = '0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12)';

describe('Input layouts', () => {
    it('lifts a solo field with a shadow, as the Select already does', () => {
        for (const layout of ['solo', 'solo-rounded', 'solo-shaped']) expect(inputParts(layout).slot.boxShadow).toBe(LEGACY_SHADOW);
        for (const layout of ['regular', 'outlined', 'filled', '', undefined, 'banana']) expect(inputParts(layout).slot.boxShadow).toBeUndefined();
    });

    it('uses the M3 elevation token in the M3 style', () => {
        expect(inputParts('solo', 'material3').slot.boxShadow).toBe('var(--md-sys-elevation-level1)');
        expect(inputParts('outlined', 'material3').slot.boxShadow).toBeUndefined();
    });

    it('rounds only the top corners of a shaped field', () => {
        expect(inputParts('solo-shaped').slot.borderRadius).toBe(SHAPED);
        expect(inputParts('filled-shaped').slot.borderRadius).toBe(SHAPED);
        expect(inputParts('outlined-shaped').outline().borderRadius).toBe(SHAPED);
        expect(inputParts('outlined-shaped', 'material3').outline().borderRadius).toBe(SHAPED);
    });

    it('keeps the other shapes', () => {
        expect(inputParts('outlined-rounded').outline().borderRadius).toBe(28);
        expect(inputParts('solo-rounded').slot.borderRadius).toBe(28);
        expect(inputParts('filled-rounded').slot.borderRadius).toBe(28);
        expect(inputParts('outlined').outline().borderRadius).toBe(4);
        expect(inputParts('regular').slot.borderRadius).toBeUndefined();
        expect(() => inputParts('regular').outline()).toThrow('fieldset not rendered');
    });
});

describe('Select and Autocomplete layouts', () => {
    for (const Widget of [MaterialDesignSelect, MaterialDesignAutocomplete]) {
        const name = Widget === MaterialDesignSelect ? 'Select' : 'Autocomplete';

        it(`${name}: rounds only the top corners of a shaped field`, () => {
            expect(selectParts('solo-shaped', Widget).field.borderRadius).toBe(SHAPED);
            expect(selectParts('filled-shaped', Widget).field.borderRadius).toBe(SHAPED);
            expect(selectParts('outlined-shaped', Widget).outline().borderRadius).toBe(SHAPED);
        });

        it(`${name}: keeps the solo shadow, with the M3 token in the M3 style`, () => {
            expect(selectParts('solo', Widget).field.boxShadow).toBe(LEGACY_SHADOW);
            expect(selectParts('solo-rounded', Widget, 'material3').field.boxShadow).toBe('var(--md-sys-elevation-level1)');
            expect(selectParts('outlined', Widget).field.boxShadow).toBeUndefined();
        });

        it(`${name}: keeps the other shapes`, () => {
            expect(selectParts('outlined-rounded', Widget).outline().borderRadius).toBe(28);
            expect(selectParts('solo-rounded', Widget).field.borderRadius).toBe(28);
            expect(selectParts('outlined', Widget).outline().borderRadius).toBe(4);
            expect(selectParts('filled', Widget).field.borderRadius).toBe('4px 4px 0 0');
            expect(selectParts('banana', Widget).field.borderRadius).toBeUndefined();
            expect(selectParts(undefined, Widget).field.borderRadius).toBeUndefined();
        });
    }
});
