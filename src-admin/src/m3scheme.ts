/*
 * Material 3 scheme generation from a single seed color (../../MATERIAL3_PLAN.md Phase 9.1).
 *
 * This runs in the ADMIN bundle only, once per save, and its result is written to the
 * `colors.md3Scheme` state as JSON. The widget runtime never does color math: it reads that state
 * and writes the values into the `--mdw-seed-*` layer it already maintained for the four old
 * per-role overrides. Admin loads once per configuration; a widget runtime loads on every panel on
 * every reload, which is why the math lives here (see the phase text for the full argument).
 *
 * Palette math comes from `@material/material-color-utilities` — Google's own reference
 * implementation of HCT/CAM16, which is what the M3 tonal palettes are defined in terms of. There
 * is no native, CSS or already-installed way to compute it (compat rule #9), and hand-porting
 * CAM16 forward + inverse + the gamut solver is ~300 lines of numerically delicate code whose
 * transcription errors produce plausible-looking wrong colors.
 *
 * The TONE MAP below is ours, deliberately, and does NOT use the library's own `SchemeTonalSpot` /
 * `MaterialDynamicColors`: those derive several roles from a minimum-contrast search rather than
 * from the documented tone, and as a result they do not reproduce Google's own published baseline
 * scheme from its own baseline seed (#6750a4 yields `primary #65558f` instead of `#6750a4`, and
 * `on-primary-container #4d3d75` instead of `#21005d`). The tone map here does reproduce it, within
 * ±1/255 per channel on every role except the error palette, where the published baseline still
 * carries the older #b3261e and the current palette (hue 25 / chroma 84) gives #ba1a1a.
 * `m3scheme.test.ts` asserts that agreement, so a future library upgrade cannot quietly move it.
 */
import { Hct, TonalPalette, argbFromHex, hexFromArgb } from '@material/material-color-utilities';

// Exactly the color roles material3-tokens.css declares — no more. Adding a role here without a
// widget that consumes it re-creates the dead-token problem Phase 8 cleaned up; add both together.
export const M3_ROLES = ['primary', 'on-primary', 'primary-container', 'on-primary-container', 'secondary', 'secondary-container', 'on-secondary-container',
    'tertiary', 'error', 'surface', 'surface-container-low', 'surface-container', 'surface-container-high', 'on-surface', 'on-surface-variant',
    'outline', 'outline-variant', 'scrim'] as const;
export type M3Role = (typeof M3_ROLES)[number];
export type M3Scheme = Record<M3Role, string>;
export type M3SchemeSet = { light: M3Scheme; dark: M3Scheme };

type PaletteName = 'primary' | 'secondary' | 'tertiary' | 'neutral' | 'neutralVariant' | 'error';

// [role, palette, light tone, dark tone] — the M3 tone map. Both schemes come from the SAME
// palettes at different tones, which is why one seed is enough and a separate dark seed is not a
// refinement but a way to break the pairing (see the Phase 8 follow-up note in the plan).
const TONE_MAP: Array<[M3Role, PaletteName, number, number]> = [
    ['primary', 'primary', 40, 80],
    ['on-primary', 'primary', 100, 20],
    ['primary-container', 'primary', 90, 30],
    ['on-primary-container', 'primary', 10, 90],
    ['secondary', 'secondary', 40, 80],
    ['secondary-container', 'secondary', 90, 30],
    ['on-secondary-container', 'secondary', 10, 90],
    ['tertiary', 'tertiary', 40, 80],
    ['error', 'error', 40, 80],
    ['surface', 'neutral', 98, 6],
    ['surface-container-low', 'neutral', 96, 10],
    ['surface-container', 'neutral', 94, 12],
    ['surface-container-high', 'neutral', 92, 17],
    ['on-surface', 'neutral', 10, 90],
    ['on-surface-variant', 'neutralVariant', 30, 80],
    ['outline', 'neutralVariant', 50, 60],
    ['outline-variant', 'neutralVariant', 80, 30],
    ['scrim', 'neutral', 0, 0],
];

// M3's baseline seed. Used as the fallback whenever no seed is configured, so "unset" and
// "seeded with the baseline" produce byte-identical schemes instead of two near-misses.
export const M3_BASELINE_SEED = '#6750a4';

/**
 * `#abc` / `#aabbcc`, case-insensitive. Anything else (named colors, gradients, rgba) is rejected
 *  rather than guessed at — the caller keeps the baseline instead.
 */
export function m3SeedArgb(seed: string): number | undefined {
    const hex = seed.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
    if (!hex) return undefined;
    return argbFromHex(`#${hex.length === 3 ? hex.replace(/./g, char => char + char) : hex}`);
}

/** Both complete M3 schemes derived from one seed, or `undefined` if the seed is not a hex color. */
export function m3SchemeFromSeed(seed: string): M3SchemeSet | undefined {
    const argb = m3SeedArgb(seed);
    if (argb === undefined) return undefined;
    const { hue, chroma } = Hct.fromInt(argb);
    const palettes: Record<PaletteName, TonalPalette> = {
        // Chroma floor 48: a low-chroma seed (a grey, a pastel) would otherwise produce a primary
        // palette too washed out to carry the role, which is why M3 specifies the floor.
        primary: TonalPalette.fromHueAndChroma(hue, Math.max(chroma, 48)),
        secondary: TonalPalette.fromHueAndChroma(hue, 16),
        tertiary: TonalPalette.fromHueAndChroma(hue + 60, 24),
        neutral: TonalPalette.fromHueAndChroma(hue, 6),
        neutralVariant: TonalPalette.fromHueAndChroma(hue, 8),
        // Error is not derived from the seed: M3 fixes it, so a red-seeded project still has an
        // error color that reads as an error rather than as its own brand.
        error: TonalPalette.fromHueAndChroma(25, 84),
    };
    const scheme = (dark: boolean): M3Scheme => Object.fromEntries(
        TONE_MAP.map(([role, palette, light, darkTone]) => [role, hexFromArgb(palettes[palette].tone(dark ? darkTone : light))]),
    ) as M3Scheme;
    return { light: scheme(false), dark: scheme(true) };
}
