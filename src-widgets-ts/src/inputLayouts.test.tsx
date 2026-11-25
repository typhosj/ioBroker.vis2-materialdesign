import React from 'react';
import { describe, expect, it } from 'vitest';

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
const style = (el: El | undefined): React.CSSProperties => (el?.props.style ?? {}) as React.CSSProperties;

function inputParts(inputLayout: unknown): { slot: React.CSSProperties; outline: React.CSSProperties | undefined } {
    const input = new MaterialDesignInput(fixture<ConstructorParameters<typeof MaterialDesignInput>[0]>({ context: {} }));
    input.state = fixture<typeof input.state>({ rxData: { oid: 'test.0.text', inputLayout, inputLabelText: 'Note' }, values: {} });
    const tree = input.renderWidgetBody(fixture<Parameters<typeof input.renderWidgetBody>[0]>({}));
    const slot = findAll(tree, el => el.props.className === 'v-input__slot')[0];
    const fieldset = findAll(tree, el => el.type === 'fieldset')[0];
    return { slot: style(slot), outline: fieldset ? style(fieldset) : undefined };
}

function selectParts(inputLayout: unknown): { field: React.CSSProperties; outline: React.CSSProperties | undefined } {
    const select = new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({ context: {} }));
    select.state = fixture<typeof select.state>({ rxData: { oid: 'test.0.scene', inputLayout, inputLabelText: 'Scene', listDataMethod: 'valueList', valueList: 'a;b' }, values: {} });
    const tree = select.renderWidgetBody(fixture<Parameters<typeof select.renderWidgetBody>[0]>({}));
    const field = findAll(tree, el => el.type === 'button')[0];
    const fieldset = findAll(tree, el => el.type === 'fieldset')[0];
    return { field: style(field), outline: fieldset ? style(fieldset) : undefined };
}

const SHAPED = '16px 16px 0 0';

describe('Input layouts', () => {
    it('lifts a solo field with a shadow, as the Select already does', () => {
        for (const layout of ['solo', 'solo-rounded', 'solo-shaped']) expect(inputParts(layout).slot.boxShadow).toBeTruthy();
        for (const layout of ['regular', 'outlined', 'filled', '', undefined, 'banana']) expect(inputParts(layout).slot.boxShadow).toBeUndefined();
    });

    it('rounds only the top corners of a shaped field', () => {
        expect(inputParts('solo-shaped').slot.borderRadius).toBe(SHAPED);
        expect(inputParts('filled-shaped').slot.borderRadius).toBe(SHAPED);
        expect(inputParts('outlined-shaped').outline?.borderRadius).toBe(SHAPED);
    });

    it('keeps the other shapes', () => {
        expect(inputParts('outlined-rounded').outline?.borderRadius).toBe(28);
        expect(inputParts('solo-rounded').slot.borderRadius).toBe(28);
        expect(inputParts('outlined').outline?.borderRadius).toBe(4);
        expect(inputParts('regular').slot.borderRadius).toBeUndefined();
    });
});

describe('Select layouts', () => {
    it('rounds only the top corners of a shaped field', () => {
        expect(selectParts('solo-shaped').field.borderRadius).toBe(SHAPED);
        expect(selectParts('filled-shaped').field.borderRadius).toBe(SHAPED);
        expect(selectParts('outlined-shaped').outline?.borderRadius).toBe(SHAPED);
    });

    it('keeps the other shapes', () => {
        expect(selectParts('outlined-rounded').outline?.borderRadius).toBe(28);
        expect(selectParts('outlined').outline?.borderRadius).toBe(4);
        expect(selectParts('filled').field.borderRadius).toBe('4px 4px 0 0');
        expect(selectParts('banana').field.borderRadius).toBeUndefined();
        expect(selectParts(undefined).field.borderRadius).toBeUndefined();
    });
});
