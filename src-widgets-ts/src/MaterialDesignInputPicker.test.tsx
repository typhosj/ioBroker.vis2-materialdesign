import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Pin the device locale; everything else in pickerFormat stays real.
vi.mock('./pickerFormat', async importOriginal => ({ ...(await importOriginal<typeof import('./pickerFormat')>()), deviceLocale: () => 'de-DE' }));

import MaterialDesignInput, { materialPickerKind, pickerColors } from './MaterialDesignInput';

function fixture<T>(value: unknown): T {
    return value as T;
}

const setValue = vi.fn();
const props = { id: 'w1', context: { setValue } };
const renderProps = fixture<Parameters<MaterialDesignInput['renderWidgetBody']>[0]>(props);

function widget(rxData: Record<string, unknown>, stateVal: unknown): MaterialDesignInput {
    const w = new MaterialDesignInput(fixture<ConstructorParameters<typeof MaterialDesignInput>[0]>(props));
    fixture<{ state: unknown }>(w).state = { rxData: { oid: 'x.0.v', designStyle: 'material3', ...rxData }, values: { 'x.0.v.val': stateVal } };
    return w;
}

const DATE = { inputType: 'date', pickerStyle: 'material' };
const TIME = { inputType: 'time', pickerStyle: 'material', timeFormat: '24h' };

describe('picker helpers', () => {
    it('uses the material picker only for date/time with pickerStyle material', () => {
        expect(materialPickerKind({ inputType: 'date', pickerStyle: 'material' })).toBe('date');
        expect(materialPickerKind({ inputType: 'time', pickerStyle: 'material' })).toBe('time');
        expect(materialPickerKind({ inputType: 'text', pickerStyle: 'material' })).toBeNull();
        expect(materialPickerKind({ inputType: 'date', pickerStyle: 'native' })).toBeNull();
        expect(materialPickerKind({ inputType: 'date' })).toBeNull();
    });

    it('takes explicit colours and falls back to the M3 tokens', () => {
        expect(pickerColors({ pickerAccentColor: '#9bdcf3' }).accent).toBe('#9bdcf3');
        expect(pickerColors({}).accent).toBe('var(--md-sys-color-primary)');
        expect(pickerColors({ pickerBackgroundColor: '#mdwTheme:vis-materialdesign.0.colors.x' }).background).toBe('var(--md-sys-color-surface-container-high)');
        expect(pickerColors({}).text).toBe('var(--md-sys-color-on-surface)');
        expect(pickerColors({}).onAccent).toBe('var(--md-sys-color-on-primary)');
    });
});

describe('Input markup', () => {
    it('shows the formatted value, the mask and the picker button in material mode', () => {
        const html = renderToStaticMarkup(widget(DATE, '2026-11-10').renderWidgetBody(renderProps));
        expect(html).toContain('value="10.11.2026"');
        expect(html).toContain('placeholder="##.##.####"');
        expect(html).toContain('type="text"');
        expect(html).toMatch(/inputmode="numeric"/i);
        expect(html).toContain('aria-label="ariaOpenDatePicker"');
    });

    const markup = (rxData: Record<string, unknown>, stateVal: unknown): string => renderToStaticMarkup(widget(rxData, stateVal).renderWidgetBody(renderProps));

    it('renders the native field unchanged without pickerStyle', () => {
        const html = markup({ inputType: 'date' }, '2026-11-10');
        expect(html).toContain('type="date"');
        expect(html).toContain('value="2026-11-10"');
        expect(html).not.toContain('ariaOpenDatePicker');
        expect(html).not.toMatch(/inputmode/i);
    });

    it('renders native exactly like an unset pickerStyle, and ignores material for other input types', () => {
        expect(markup({ inputType: 'date', pickerStyle: 'native' }, '2026-11-10')).toBe(markup({ inputType: 'date' }, '2026-11-10'));
        expect(markup({ inputType: 'time', pickerStyle: 'native' }, '19:45')).toBe(markup({ inputType: 'time' }, '19:45'));
        expect(markup({ inputType: 'text', pickerStyle: 'material', inputMaxLength: 5 }, 'abc')).toBe(markup({ inputType: 'text', inputMaxLength: 5 }, 'abc'));
    });

    it('ignores max length in material mode, where it would cut the mask', () => {
        expect(markup({ ...DATE, inputMaxLength: 5 }, '2026-11-10')).not.toMatch(/maxlength/i);
        expect(markup({ inputType: 'date', inputMaxLength: 5 }, '2026-11-10')).toMatch(/maxlength="5"/i);
    });

    it('shows a time in the configured format', () => {
        const html = renderToStaticMarkup(widget({ ...TIME, timeFormat: '12h' }, '19:45').renderWidgetBody(renderProps));
        expect(html).toContain('value="07:45 PM"');
        expect(html).toContain('placeholder="##:## AA"');
        expect(html).toContain('aria-label="ariaOpenTimePicker"');
    });
});

describe('Input interaction', () => {
    let container: HTMLDivElement;
    let root: Root;

    const mount = (w: MaterialDesignInput): void => act(() => root.render(w.renderWidgetBody(renderProps)));
    const input = (): HTMLInputElement => container.querySelector('input') as HTMLInputElement;
    // The test base class has a no-op forceUpdate, so every step re-renders explicitly.
    function typeText(w: MaterialDesignInput, text: string): void {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        act(() => {
            setter?.call(input(), text);
            input().dispatchEvent(new Event('input', { bubbles: true }));
        });
        mount(w);
    }
    const blur = (): void => act(() => { input().dispatchEvent(new FocusEvent('focusout', { bubbles: true })); });
    const click = (el: Element): void => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    const dialogButton = (text: string): HTMLButtonElement =>
        Array.from(document.body.querySelectorAll('[role="dialog"] button')).find(b => b.textContent === text) as HTMLButtonElement;

    beforeEach(() => {
        setValue.mockClear();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it('masks typing and writes ISO on blur', () => {
        const w = widget(DATE, '2026-11-10');
        mount(w);
        typeText(w, '24122026');
        expect(input().value).toBe('24.12.2026');
        blur();
        expect(setValue).toHaveBeenCalledWith('x.0.v', '2026-12-24');
    });

    it('writes nothing for an impossible date and shows the state value again', () => {
        const w = widget(DATE, '2026-11-10');
        mount(w);
        typeText(w, '31022026');
        blur();
        mount(w);
        expect(setValue).not.toHaveBeenCalled();
        expect(input().value).toBe('10.11.2026');
    });

    it('writes an empty string for an emptied field', () => {
        const w = widget(DATE, '2026-11-10');
        mount(w);
        typeText(w, '');
        blur();
        expect(setValue).toHaveBeenCalledWith('x.0.v', '');
    });

    it('commits on Enter', () => {
        const w = widget(TIME, '19:45');
        mount(w);
        typeText(w, '0705');
        act(() => { input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
        expect(setValue).toHaveBeenCalledWith('x.0.v', '07:05');
    });

    it('opens the picker, writes on OK and returns the focus to the button', () => {
        const w = widget(DATE, '2026-11-10');
        mount(w);
        const opener = container.querySelector('[aria-label="ariaOpenDatePicker"]') as HTMLButtonElement;
        click(opener);
        mount(w);
        expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
        click(document.body.querySelector('[data-iso="2026-11-24"]') as Element);
        click(dialogButton('pickerOk'));
        expect(setValue).toHaveBeenCalledWith('x.0.v', '2026-11-24');
        expect(document.activeElement).toBe(opener);
        mount(w);
        expect(document.body.querySelector('[role="dialog"]')).toBeNull();
        expect(input().value).toBe('24.11.2026');
    });

    it('writes nothing on Cancel', () => {
        const w = widget(TIME, '19:45');
        mount(w);
        click(container.querySelector('[aria-label="ariaOpenTimePicker"]') as Element);
        mount(w);
        expect(document.body.querySelector('[role="slider"]')).not.toBeNull();
        click(dialogButton('pickerCancel'));
        mount(w);
        expect(setValue).not.toHaveBeenCalled();
        expect(document.body.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(container.querySelector('[aria-label="ariaOpenTimePicker"]'));
    });

    it('writes nothing on Escape and returns the focus to the button', () => {
        const w = widget(DATE, '2026-11-10');
        mount(w);
        const opener = container.querySelector('[aria-label="ariaOpenDatePicker"]') as HTMLButtonElement;
        click(opener);
        mount(w);
        click(document.body.querySelector('[data-iso="2026-11-24"]') as Element);
        const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
        act(() => { dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
        mount(w);
        expect(setValue).not.toHaveBeenCalled();
        expect(document.body.querySelector('[role="dialog"]')).toBeNull();
        expect(document.activeElement).toBe(opener);
        expect(input().value).toBe('10.11.2026');
    });
});
