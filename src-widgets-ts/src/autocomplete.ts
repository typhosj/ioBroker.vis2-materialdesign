export interface AutocompleteItem { value: string | number | boolean; text: string }

/** Item whose text equals `text` trimmed, ignoring case. */
export function exactItem<T extends AutocompleteItem>(list: readonly T[], text: string): T | undefined {
    const wanted = text.trim().toLowerCase();
    return wanted ? list.find(item => item.text.trim().toLowerCase() === wanted) : undefined;
}

/** Next highlighted value among `visible` for ArrowDown (+1) / ArrowUp (-1); wraps; none → first/last. */
export function moveHighlight(visible: readonly AutocompleteItem[], current: string | undefined, step: 1 | -1): string | undefined {
    if (!visible.length) return undefined;
    const index = visible.findIndex(item => String(item.value) === current);
    const next = index < 0 ? (step === 1 ? 0 : visible.length - 1) : (index + step + visible.length) % visible.length;
    return String(visible[next].value);
}

/** True while an input method composes (Enter/Tab must not commit). */
export function isComposing(event: { nativeEvent?: { isComposing?: boolean }; keyCode?: number }): boolean {
    return !!event.nativeEvent?.isComposing || event.keyCode === 229;
}

/** What a free-text commit writes: the exact item's value, else the raw typed text. */
export function writeValue(list: readonly AutocompleteItem[], typed: string): string | number | boolean {
    return exactItem(list, typed)?.value ?? typed;
}
