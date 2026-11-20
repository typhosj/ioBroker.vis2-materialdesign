import { m3ColorExplicit } from './MaterialDesignButtons';
import { legacyInk, legacySurface, numberValue as n, textValue as s } from './widgetUtils';

export interface KeyLook { background: string; key: string; text: string; special: string; fontSize: number; gap: number; radius: number }

export const clampTo = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function keyLook(data: Record<string, unknown>, isM3: boolean, isDark: boolean): KeyLook {
    const m3c = (saved: unknown, token: string, legacy: string): string => (isM3 && !m3ColorExplicit(saved) ? token : s(saved, legacy));
    return {
        background: m3c(data.keyboardBackground, 'var(--md-sys-color-surface-container-high)', isDark ? '#121212' : '#eceff1'),
        key: m3c(data.keyboardKeyColor, 'var(--md-sys-color-surface)', legacySurface(isDark)),
        text: m3c(data.keyboardKeyTextColor, 'var(--md-sys-color-on-surface)', legacyInk(isDark)),
        special: m3c(data.keyboardSpecialKeyColor, 'var(--md-sys-color-secondary-container)', isDark ? '#3a3a3a' : '#cfd8dc'),
        fontSize: clampTo(n(data.keyboardFontSize, 18), 8, 64),
        gap: clampTo(n(data.keyboardKeyGap, 6), 0, 32),
        radius: clampTo(n(data.keyboardKeyRadius, 8), 0, 64),
    };
}
