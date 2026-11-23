export const pickVariant = <V extends { id: string }>(entry: { variants: V[] }, id?: string): V => entry.variants.find(v => v.id === id) ?? entry.variants[0];

export function parseDatapointInput(old: ioBroker.StateValue | undefined, raw: string): { ok: true; value: ioBroker.StateValue } | { ok: false } {
    if (typeof old === 'number') {
        const value = raw.trim() === '' ? NaN : Number(raw);
        return Number.isFinite(value) ? { ok: true, value } : { ok: false };
    }
    if (typeof old === 'boolean') return raw === 'true' || raw === 'false' ? { ok: true, value: raw === 'true' } : { ok: false };
    return { ok: true, value: raw };
}

export function parseStoredData(raw: string | null): Record<string, unknown> | undefined {
    try {
        const parsed: unknown = JSON.parse(raw ?? 'null');
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : undefined;
    } catch {
        return undefined;
    }
}
