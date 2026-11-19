import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import MaterialDesignAutocomplete from './MaterialDesignAutocomplete';
import MaterialDesignInput from './MaterialDesignInput';
import MaterialDesignSelect from './MaterialDesignSelect';

function fixture<T>(value: unknown): T { return value as T; }
type El = React.ReactElement<Record<string, unknown>>;
function find(node: React.ReactNode, test: (el: El) => boolean): El | undefined {
    if (Array.isArray(node)) return node.map(child => find(child, test)).find(Boolean);
    if (!React.isValidElement(node)) return undefined;
    const el = node as El;
    return test(el) ? el : find(el.props.children as React.ReactNode, test);
}
const render = (widget: { renderWidgetBody: (p: never) => React.ReactNode }): React.ReactNode => widget.renderWidgetBody(fixture<never>({}));

describe('Input read-only (upstream #96)', () => {
    const make = (readOnly: unknown) => {
        const setValue = vi.fn();
        const input = new MaterialDesignInput(fixture<ConstructorParameters<typeof MaterialDesignInput>[0]>({ context: { setValue } }));
        input.state = fixture<typeof input.state>({ rxData: { oid: 'test.0.text', readOnly }, values: { 'test.0.text.val': 'abc' } });
        return { input, setValue };
    };

    it.each([[true, true], ['true', true], ['1', true], ['false', false], [undefined, false]])('readOnly %j -> readonly attribute %s', (readOnly, expected) => {
        const field = find(render(make(readOnly).input), el => el.type === 'input')!;
        expect(!!field.props.readOnly).toBe(expected);
    });

    it('writes nothing on blur or Enter and hides the clear button', () => {
        const { input, setValue } = make(true);
        const tree = render(input);
        const field = find(tree, el => el.type === 'input')!;
        (field.props.onBlur as (e: unknown) => void)({ target: { value: 'abc' } });
        (field.props.onKeyDown as (e: unknown) => void)({ key: 'Enter', currentTarget: { value: 'abc' } });
        expect(setValue).not.toHaveBeenCalled();
        expect(find(tree, el => el.props['aria-label'] === 'ariaClearInput')).toBeUndefined();
    });

    it('declares a bindable read-only field', () => {
        const fields = MaterialDesignInput.getWidgetInfo().visAttrs.flatMap(group => group.fields as Array<{ name: string; noBinding?: boolean }>);
        expect(fields.find(field => field.name === 'readOnly')?.noBinding).toBe(false);
    });
});

describe('Select and Autocomplete read-only', () => {
    it('a read-only Select does not open its menu', () => {
        const select = new MaterialDesignSelect(fixture<ConstructorParameters<typeof MaterialDesignSelect>[0]>({ context: {} }));
        select.state = fixture<typeof select.state>({ rxData: { readOnly: 'true', listDataMethod: 'jsonStringObject', jsonStringObject: '[{"value":1,"text":"One"}]' }, values: {} });
        const button = find(render(select), el => el.type === 'button')!;
        (button.props.onClick as () => void)();
        expect((select as unknown as { open: boolean }).open).toBe(false);
    });

    it('a read-only Autocomplete is readonly, does not open, and writes nothing on blur', () => {
        const setValue = vi.fn();
        const auto = new MaterialDesignAutocomplete(fixture<ConstructorParameters<typeof MaterialDesignAutocomplete>[0]>({ context: { setValue } }));
        auto.state = fixture<typeof auto.state>({ rxData: { oid: 'test.0.v', readOnly: true, inputMode: 'write' }, values: {} });
        const field = find(render(auto), el => el.type === 'input')!;
        expect(field.props.readOnly).toBe(true);
        (field.props.onFocus as () => void)();
        (field.props.onClick as (e: unknown) => void)({ stopPropagation: () => undefined });
        expect((auto as unknown as { open: boolean }).open).toBe(false);
        (field.props.onBlur as () => void)();
        expect(setValue).not.toHaveBeenCalled();
    });

    it('a read-only Autocomplete ignores arrow keys', () => {
        const auto = new MaterialDesignAutocomplete(fixture<ConstructorParameters<typeof MaterialDesignAutocomplete>[0]>({ context: {} }));
        auto.state = fixture<typeof auto.state>({ rxData: { oid: 'test.0.v', readOnly: true }, values: {} });
        const field = find(render(auto), el => el.type === 'input')!;
        (field.props.onKeyDown as (e: unknown) => void)({ key: 'ArrowDown', preventDefault: () => undefined });
        expect((auto as unknown as { open: boolean }).open).toBe(false);
    });

    it('declares a bindable read-only field on both', () => {
        for (const info of [MaterialDesignSelect.getWidgetInfo(), MaterialDesignAutocomplete.getWidgetInfo()]) {
            const fields = info.visAttrs.flatMap(group => group.fields as Array<{ name: string; noBinding?: boolean }>);
            expect(fields.find(field => field.name === 'readOnly')?.noBinding).toBe(false);
        }
    });
});
