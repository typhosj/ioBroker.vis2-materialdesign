import { M3_BASELINE_SEED, m3SchemeFromSeed } from '../../src-admin/src/m3scheme';
import { THEME_NAMES, readDefaults, readEntries, themeStateId } from '../../src-admin/src/themeConfig';

export const NAMESPACE = 'vis2-materialdesign.0';
export const M3_SEEDS: readonly string[] = [M3_BASELINE_SEED, '#006a6a', '#8b5000', '#b3261e'];

export function themeStates(): Record<string, ioBroker.StateValue> {
    const states: Record<string, ioBroker.StateValue> = {};
    for (const theme of THEME_NAMES) {
        for (const entry of readEntries({}, theme, readDefaults({}, theme))) {
            if (entry.value !== undefined) states[themeStateId(NAMESPACE, theme, entry.id)] = entry.value;
        }
    }
    states[`${NAMESPACE}.colors.md3Scheme`] = JSON.stringify(m3SchemeFromSeed(M3_BASELINE_SEED));
    states[`${NAMESPACE}.colors.darkTheme`] = 'light';
    states[`${NAMESPACE}.designStyle`] = 'material3';
    states[`${NAMESPACE}.fonts.md3Font`] = '';
    return states;
}

export function m3Schemes(): Record<string, string> {
    return Object.fromEntries(M3_SEEDS.map(seed => [seed, JSON.stringify(m3SchemeFromSeed(seed))]));
}
