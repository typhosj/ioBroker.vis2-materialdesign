import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MaterialDesignAutocomplete from './MaterialDesignAutocomplete';
import MaterialDesignInput from './MaterialDesignInput';
import MaterialDesignProgress from './MaterialDesignProgress';
import MaterialDesignRoundSlider from './MaterialDesignRoundSlider';
import MaterialDesignSlider from './MaterialDesignSlider';

function fixture<T>(value: unknown): T { return value as T; }

// VisWidget.t returns the key in unit tests, so a name is either the visible label's text or an `aria…` key.
type AnyWidget = { state: unknown; renderWidgetBody: (props: never) => React.JSX.Element };
const renderProps = fixture<never>({});

function mount(widgets: AnyWidget[]): void {
    document.body.innerHTML = widgets.map(widget => renderToStaticMarkup(widget.renderWidgetBody(renderProps))).join('');
}

function nameOf(element: Element): string {
    const by = element.getAttribute('aria-labelledby');
    if (by) return by.split(' ').map(id => document.getElementById(id)?.textContent ?? '').join(' ').trim();
    return (element.getAttribute('aria-label') ?? '').trim();
}

afterEach(() => { document.body.innerHTML = ''; });

const slider = (rxData: Record<string, unknown>, values: Record<string, unknown> = {}, setValue = vi.fn()): MaterialDesignSlider => {
    const widget = new MaterialDesignSlider(fixture<ConstructorParameters<typeof MaterialDesignSlider>[0]>({ context: { setValue }, id: 'w1' }));
    widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.level', ...rxData }, values: { 'test.0.level.val': 40, ...values } });
    return widget;
};
const thumb = (): Element => document.querySelector('[role="slider"]')!;

describe('linear slider name and value', () => {
    it('is named by its visible text', () => {
        mount([slider({ prepandText: 'Ladestrom' })]);
        expect(nameOf(thumb())).toBe('Ladestrom');
        expect(thumb().hasAttribute('aria-label')).toBe(false);
    });

    it.each([['empty', ''], ['blank', '   '], ['unset', undefined]])('falls back to the generic name when the text is %s', (_name, text) => {
        mount([slider({ prepandText: text })]);
        expect(nameOf(thumb())).toBe('ariaSlider');
        expect(thumb().hasAttribute('aria-labelledby')).toBe(false);
    });

    it('keeps the ids of two sliders apart and names each after its own text', () => {
        mount([slider({ prepandText: 'First' }), slider({ prepandText: 'Second' })]);
        const [a, b] = Array.from(document.querySelectorAll('[role="slider"]'));
        expect(a.getAttribute('aria-labelledby')).not.toBe(b.getAttribute('aria-labelledby'));
        expect([nameOf(a), nameOf(b)]).toEqual(['First', 'Second']);
        expect(new Set(Array.from(document.querySelectorAll('[id]')).map(el => el.id)).size).toBe(document.querySelectorAll('[id]').length);
    });

    it('hides its internal value input from assistive technology', () => {
        mount([slider({})]);
        expect(document.querySelector('.v-slider input')!.getAttribute('aria-hidden')).toBe('true');
    });

    it('reports value, range and the visible value with its unit', () => {
        mount([slider({ min: 10, max: 50, valueLabelUnit: ' %', valueLabelStyle: 'sliderValue' })]);
        const el = thumb();
        expect([el.getAttribute('aria-valuemin'), el.getAttribute('aria-valuemax'), el.getAttribute('aria-valuenow')]).toEqual(['10', '50', '40']);
        expect(el.getAttribute('aria-valuetext')).toBe('40 %');
    });

    it('keeps the existing max offset of 100 when min equals max', () => {
        mount([slider({ min: 7, max: 7 }, { 'test.0.level.val': 7 })]);
        const el = thumb();
        expect([el.getAttribute('aria-valuemin'), el.getAttribute('aria-valuemax'), el.getAttribute('aria-valuenow')]).toEqual(['7', '107', '7']);
    });

    it('clamps a value outside the range', () => {
        mount([slider({ min: 0, max: 20 }, { 'test.0.level.val': 999 })]);
        expect(thumb().getAttribute('aria-valuenow')).toBe('20');
        mount([slider({ min: 0, max: 20 }, { 'test.0.level.val': -5 })]);
        expect(thumb().getAttribute('aria-valuenow')).toBe('0');
    });

    it('drops the value text when the value label is hidden or only markup', () => {
        mount([slider({ showValueLabel: false })]);
        expect(thumb().hasAttribute('aria-valuetext')).toBe(false);
        mount([slider({ valueLabelMin: '<b></b>', useLabelRules: true }, { 'test.0.level.val': 0 })]);
        expect(thumb().hasAttribute('aria-valuetext')).toBe(false);
    });

    it('still writes the state on a key press', () => {
        const setValue = vi.fn();
        const widget = slider({ min: 0, max: 100, step: 5 }, {}, setValue);
        const tree = widget.renderWidgetBody(renderProps);
        const find = (node: React.ReactNode): React.ReactElement<Record<string, unknown>> | undefined => {
            if (Array.isArray(node)) return node.map(find).find(Boolean);
            if (!React.isValidElement(node)) return undefined;
            const el = node as React.ReactElement<Record<string, unknown>>;
            return el.props.role === 'slider' ? el : find(el.props.children as React.ReactNode);
        };
        (find(tree)!.props.onKeyDown as (event: unknown) => void)({ key: 'ArrowRight', preventDefault: vi.fn(), stopPropagation: vi.fn() });
        expect(setValue).toHaveBeenLastCalledWith('test.0.level', 45);
    });
});

describe('round slider value text', () => {
    const round = (rxData: Record<string, unknown>, value: unknown = 30): MaterialDesignRoundSlider => {
        const widget = new MaterialDesignRoundSlider(fixture<ConstructorParameters<typeof MaterialDesignRoundSlider>[0]>({ context: { setValue: vi.fn() }, id: 'r1' }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.level', ...rxData }, values: { 'test.0.level.val': value } });
        return widget;
    };

    it('is named and reports value, range and the visible value with its unit', () => {
        mount([round({ min: 0, max: 60, valueLabelUnit: '°C' })]);
        const el = thumb();
        expect(nameOf(el)).toBe('ariaRoundSlider');
        expect([el.getAttribute('aria-valuemin'), el.getAttribute('aria-valuemax'), el.getAttribute('aria-valuenow')]).toEqual(['0', '60', '30']);
        expect(el.getAttribute('aria-valuetext')).toBe('30 °C');
    });

    it('clamps a value outside the range and drops the text without a visible label', () => {
        mount([round({ min: 0, max: 60, showValueLabel: false }, 500)]);
        expect(thumb().getAttribute('aria-valuenow')).toBe('60');
        expect(thumb().hasAttribute('aria-valuetext')).toBe(false);
    });
});

describe('progress name and value text', () => {
    const progress = (rxData: Record<string, unknown>, value: unknown = 20): MaterialDesignProgress => {
        const widget = new MaterialDesignProgress(fixture<ConstructorParameters<typeof MaterialDesignProgress>[0]>({ context: { setValue: vi.fn() } }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.level', ...rxData }, values: { 'test.0.level.val': value } });
        return widget;
    };
    const bar = (): Element => document.querySelector('[role="slider"], [role="progressbar"]')!;

    it.each([['writable', { progressWritable: true }, 'slider'], ['plain', {}, 'progressbar']])('names the %s bar', (_name, rxData, role) => {
        mount([progress(rxData)]);
        expect(bar().getAttribute('role')).toBe(role);
        expect(nameOf(bar())).toBe('ariaProgress');
    });

    it('reports the visible value with its unit', () => {
        mount([progress({ progressWritable: true, min: 0, max: 50, valueLabelStyle: 'progressValue', valueLabelUnit: ' kWh' })]);
        expect([bar().getAttribute('aria-valuemin'), bar().getAttribute('aria-valuemax'), bar().getAttribute('aria-valuenow')]).toEqual(['0', '50', '20']);
        expect(bar().getAttribute('aria-valuetext')).toBe('20 kWh');
    });

    it('clamps a value outside the range and drops the text without a visible label', () => {
        mount([progress({ progressWritable: true, min: 0, max: 50, showValueLabel: false }, 900)]);
        expect(bar().getAttribute('aria-valuenow')).toBe('50');
        expect(bar().hasAttribute('aria-valuetext')).toBe(false);
    });

    it('keeps min equal to max readable', () => {
        mount([progress({ progressWritable: true, min: 5, max: 5 }, 5)]);
        expect(bar().getAttribute('aria-valuenow')).toBe('5');
        expect(nameOf(bar())).toBe('ariaProgress');
    });
});

describe('text field and combobox names', () => {
    const input = (rxData: Record<string, unknown>): MaterialDesignInput => {
        const widget = new MaterialDesignInput(fixture<ConstructorParameters<typeof MaterialDesignInput>[0]>({ context: { setValue: vi.fn() }, id: 'i1' }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.text', ...rxData }, values: { 'test.0.text.val': 'abc' } });
        return widget;
    };
    const auto = (rxData: Record<string, unknown>): MaterialDesignAutocomplete => {
        const widget = new MaterialDesignAutocomplete(fixture<ConstructorParameters<typeof MaterialDesignAutocomplete>[0]>({ context: { setValue: vi.fn() }, id: 'same' }));
        widget.state = fixture<typeof widget.state>({
            rxData: { oid: 'test.0.choice', listDataMethod: 'valueList', valueList: '1;2', valueListLabels: 'One;Two', ...rxData },
            values: {},
        });
        return widget;
    };
    const field = (): Element => document.querySelector('input')!;

    it.each([
        ['classic', {}],
        ['Material 3', { designStyle: 'material3' }],
        ['read-only', { readOnly: true }],
        ['outlined', { inputLayout: 'outlined' }],
    ])('names the %s input after its label', (_name, extra) => {
        mount([input({ inputLabelText: 'Name', ...extra })]);
        expect(nameOf(field())).toBe('Name');
        expect(field().hasAttribute('aria-label')).toBe(false);
    });

    it.each([['empty', ''], ['blank', '   '], ['unset', undefined]])('falls back to the generic name when the label is %s', (_name, label) => {
        mount([input({ inputLabelText: label })]);
        expect(nameOf(field())).toBe('ariaTextInput');
        expect(field().hasAttribute('aria-labelledby')).toBe(false);
    });

    it('shows markup in a label as text, so the name is that text', () => {
        mount([input({ inputLabelText: '<b></b>' })]);
        expect(nameOf(field())).toBe('<b></b>');
    });

    it('keeps the ids of two inputs apart and names each after its own label', () => {
        mount([input({ inputLabelText: 'First' }), input({ inputLabelText: 'Second' })]);
        const [a, b] = Array.from(document.querySelectorAll('input'));
        expect(a.getAttribute('aria-labelledby')).not.toBe(b.getAttribute('aria-labelledby'));
        expect([nameOf(a), nameOf(b)]).toEqual(['First', 'Second']);
    });

    it('names the autocomplete combobox after its label, also for widgets that share a widget id', () => {
        mount([auto({ inputLabelText: 'Room' }), auto({ inputLabelText: 'Floor' })]);
        const [a, b] = Array.from(document.querySelectorAll('[role="combobox"]'));
        expect([nameOf(a), nameOf(b)]).toEqual(['Room', 'Floor']);
        expect(a.getAttribute('aria-labelledby')).not.toBe(b.getAttribute('aria-labelledby'));
    });

    it.each([['empty', ''], ['blank', '  '], ['unset', undefined]])('falls back to the generic combobox name when the label is %s', (_name, label) => {
        mount([auto({ inputLabelText: label })]);
        expect(nameOf(document.querySelector('[role="combobox"]')!)).toBe('ariaSelectInput');
    });

    it('still commits the typed value of the input on Enter', () => {
        const setValue = vi.fn();
        const widget = new MaterialDesignInput(fixture<ConstructorParameters<typeof MaterialDesignInput>[0]>({ context: { setValue }, id: 'i1' }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.text', inputLabelText: 'Name' }, values: { 'test.0.text.val': 'abc' } });
        const find = (node: React.ReactNode): React.ReactElement<Record<string, unknown>> | undefined => {
            if (Array.isArray(node)) return node.map(find).find(Boolean);
            if (!React.isValidElement(node)) return undefined;
            const el = node as React.ReactElement<Record<string, unknown>>;
            return el.type === 'input' ? el : find(el.props.children as React.ReactNode);
        };
        const el = find(widget.renderWidgetBody(renderProps))!;
        (el.props.onKeyDown as (event: unknown) => void)({ key: 'Enter', currentTarget: { value: 'xyz' } });
        expect(setValue).toHaveBeenCalledWith('test.0.text', 'xyz');
    });
});

describe('label check matches the rendered label', () => {
    const cases: Array<[string, unknown, string]> = [['0', '0', '0'], ['number 0', 0, ''], ['false', false, ''], ['null', null, ''], ['blank', '   ', '']];

    const noDanglingId = (el: Element): void => {
        const by = el.getAttribute('aria-labelledby');
        if (by) expect(document.getElementById(by)).not.toBeNull();
    };

    it.each(cases)('Slider text %s', (_name, text, shown) => {
        const widget = new MaterialDesignSlider(fixture<ConstructorParameters<typeof MaterialDesignSlider>[0]>({ context: { setValue: vi.fn() }, id: 'w' }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.level', prepandText: text }, values: {} });
        mount([widget]);
        expect(nameOf(thumb())).toBe(shown || 'ariaSlider');
        noDanglingId(thumb());
    });

    it.each(cases)('Input label %s', (_name, text, shown) => {
        const widget = new MaterialDesignInput(fixture<ConstructorParameters<typeof MaterialDesignInput>[0]>({ context: { setValue: vi.fn() }, id: 'w' }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.text', inputLabelText: text }, values: {} });
        mount([widget]);
        expect(nameOf(document.querySelector('input')!)).toBe(shown || 'ariaTextInput');
        noDanglingId(document.querySelector('input')!);
    });

    it.each(cases)('Autocomplete label %s', (_name, text, shown) => {
        const widget = new MaterialDesignAutocomplete(fixture<ConstructorParameters<typeof MaterialDesignAutocomplete>[0]>({ context: { setValue: vi.fn() }, id: 'w' }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.c', listDataMethod: 'valueList', valueList: '1', valueListLabels: 'One', inputLabelText: text }, values: {} });
        mount([widget]);
        const box = document.querySelector('[role="combobox"]')!;
        expect(nameOf(box)).toBe(shown || 'ariaSelectInput');
        noDanglingId(box);
    });
});

describe('remaining name cases', () => {
    it('keeps the Slider name when the widget is locked', () => {
        const widget = new MaterialDesignSlider(fixture<ConstructorParameters<typeof MaterialDesignSlider>[0]>({ context: { setValue: vi.fn() }, id: 'w' }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.level', prepandText: 'Locked one', lockEnabled: true }, values: {} });
        mount([widget]);
        expect(nameOf(thumb())).toBe('Locked one');
    });

    it('shows markup in a Slider text literally, so that is the name', () => {
        const widget = new MaterialDesignSlider(fixture<ConstructorParameters<typeof MaterialDesignSlider>[0]>({ context: { setValue: vi.fn() }, id: 'w' }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.level', prepandText: '<b></b>' }, values: {} });
        mount([widget]);
        // The text is rendered as text, so the markup shows literally and is the name.
        expect(nameOf(thumb())).toBe('<b></b>');
    });

    it('names the read-only progress bar', () => {
        const widget = new MaterialDesignProgress(fixture<ConstructorParameters<typeof MaterialDesignProgress>[0]>({ context: { setValue: vi.fn() } }));
        widget.state = fixture<typeof widget.state>({ rxData: { oid: 'test.0.level', progressWritable: true, readOnly: true }, values: { 'test.0.level.val': 10 } });
        mount([widget]);
        const bar = document.querySelector('[role="slider"], [role="progressbar"]')!;
        expect(nameOf(bar)).toBe('ariaProgress');
    });
});
