import { GenericApp, I18n, Loader, Logo, type GenericAppProps, type GenericAppState } from '@iobroker/adapter-react-v5';
import PaletteIcon from '@mui/icons-material/Palette';
import SettingsIcon from '@mui/icons-material/Settings';
import { Box, Button, Card, CardContent, Checkbox, CssBaseline, FormControlLabel, FormGroup, FormHelperText, MenuItem, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, ThemeProvider, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import colors from '../../admin/lib/colors.json';
import colorsDark from '../../admin/lib/colorsDark.json';
import defaultcolors from '../../admin/lib/defaultcolors.json';
import defaultcolorsDark from '../../admin/lib/defaultcolorsDark.json';
import defaultfontSizes from '../../admin/lib/defaultfontSizes.json';
import defaultfonts from '../../admin/lib/defaultfonts.json';
import fontSizes from '../../admin/lib/fontSizes.json';
import fonts from '../../admin/lib/fonts.json';
// Preset labels are deliberately NOT translated: they are proper names of a palette/font package,
// same as the widget names in the theme table below.
import presets from '../../admin/lib/presets.json';
import '../../fonts.css';
import { M3_BASELINE_SEED, M3_ROLES, m3SchemeFromSeed, type M3Scheme } from './m3scheme';
import './style.css';

const MD3_FONT_KEY = 'md3Font';
const MD3_SEED_KEY = 'md3Seed';
// `props.config`/`config` are `Record<string, unknown>`; a bare String(value) on an unconstrained
// unknown would satisfy the compiler but risk "[object Object]" if a value is ever malformed.
function str(value: unknown): string { return typeof value === 'string' || typeof value === 'number' ? String(value) : ''; }

type ThemeName = 'colors' | 'colorsDark' | 'fonts' | 'fontSizes';
type ThemeEntry = { id: string; desc: string; widget: string; defaultValue?: number; value?: string | number };
type NativeConfig = Record<string, unknown> & { scriptName?: string; variableName?: string; javascriptInstance?: string; sentryReport?: boolean };
type ThemeDefinition = { entries: ThemeEntry[]; defaults: Array<string | number>; title: string; widgetTitle: string };

// Admin adapter translations load per-language at runtime — only English plus the active language —
// so the config bundle no longer inlines all 11 dictionaries (~124 kB gz). Vite still emits each
// admin/i18n/<lang>.json as its own lazy chunk; the open config fetches just what it needs. The
// full dictionaries still back the vis widget editor via the separate widget bundle.
const KNOWN_LANGS = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'ru', 'uk', 'zh-cn'];
const translations: Record<string, Record<string, string>> = {};

async function loadLang(lang: string): Promise<void> {
    const key = KNOWN_LANGS.includes(lang) ? lang : 'en';
    if (translations[key]) return;
    try {
        const module = await import(`../../admin/i18n/${key}.json`);
        translations[key] = (module.default ?? module) as Record<string, string>;
    } catch {
        // leave missing — adapter-react-v5 falls back to the key / English
    }
}
const themeDefinitions: Record<ThemeName, ThemeDefinition> = {
    colors: { entries: colors, defaults: defaultcolors, title: 'default light colors', widgetTitle: 'Widget colors' },
    colorsDark: { entries: colorsDark, defaults: defaultcolorsDark, title: 'default dark colors', widgetTitle: 'Widget colors' },
    fonts: { entries: fonts, defaults: defaultfonts, title: 'config_fonts', widgetTitle: 'Widget fonts' },
    fontSizes: { entries: fontSizes, defaults: defaultfontSizes, title: 'config_fontSizes', widgetTitle: 'Widget font sizes' },
};

// GenericApp's constructor merges `translations` into the framework dictionary and calls
// I18n.setTranslations itself, after bootstrap() has populated the active languages.
const t = (text: string): string => I18n.t(text);

function defaultsKey(theme: ThemeName): string {
    return `default${theme}`;
}

function readDefaults(config: NativeConfig, theme: ThemeName): Array<string | number> {
    const fallback = themeDefinitions[theme].defaults;
    const saved = config[defaultsKey(theme)];
    const values = !Array.isArray(saved) ? [...fallback] : fallback.map((value, index) => saved[index] ?? value) as Array<string | number>;
    // fontSizes must stay numeric even if an older config (or state) left a numeric string behind.
    return theme === 'fontSizes' ? values.map(value => Number(value)) : values;
}

function readEntries(config: NativeConfig, theme: ThemeName, defaults: Array<string | number>): ThemeEntry[] {
    const saved = Array.isArray(config[theme]) ? config[theme] as ThemeEntry[] : [];
    return themeDefinitions[theme].entries.map(entry => {
        const old = saved.find(candidate => candidate.id === entry.id);
        const rawDefault = old?.defaultValue as unknown;
        const savedDefault = rawDefault === '' ? Number.NaN : Number(rawDefault);
        const defaultValue = Number.isInteger(savedDefault) && savedDefault >= 0 && savedDefault < defaults.length ? savedDefault : old ? undefined : entry.defaultValue;
        const value = old?.value ?? entry.value ?? defaults[defaultValue ?? 0];
        return { ...entry, ...old, defaultValue, value: theme === 'fontSizes' ? Number(value) : value };
    });
}

const HEX = /^#[0-9a-f]{6}$/i;

// `<input type="color">` (native, no picker dependency) only accepts a 7-digit hex. The legacy
// palette also holds `rgba(...)`, 8-digit hex and — after "use theme" — `var(--mdw-...)` values,
// which the browser would silently rewrite to #000000, so those keep a plain swatch. `fallback` is
// the value that applies when the field is empty, so the swatch previews the baseline.
function ColorSwatch(props: { value: string; size: number; fallback?: string; onChange?: (value: string) => void }): React.JSX.Element {
    const shown = HEX.test(props.value) ? props.value : HEX.test(props.fallback ?? '') && !props.value ? props.fallback! : '';
    const onChange = props.onChange;
    const style = { border: '1px solid rgba(128, 128, 128, .4)', borderRadius: 2, flex: '0 0 auto', height: props.size, width: props.size };
    return onChange && shown
        ? <input aria-label={shown} onChange={event => onChange(event.target.value)} style={{ ...style, background: 'none', cursor: 'pointer', padding: 0 }} type="color" value={shown.toLowerCase()} />
        : <Box aria-label={props.value} sx={{ ...style, backgroundColor: props.value || 'transparent' }} />;
}

// Applying a preset only rewrites the numbered default slots. Widget entries still bound to a slot
// follow along; anything overridden by hand (defaultValue === undefined) keeps its own value — that
// is the difference to "reset", which deliberately throws the per-widget overrides away too.
function applyDefaultsPreset(props: { config: NativeConfig; update: (key: string, value: unknown) => void }, theme: ThemeName, next: Array<string | number>): void {
    const entries = readEntries(props.config, theme, readDefaults(props.config, theme));
    props.update(defaultsKey(theme), next);
    props.update(theme, entries.map(entry => entry.defaultValue === undefined ? entry : { ...entry, value: next[entry.defaultValue] ?? entry.value }));
}

function PresetSelect(props: { label: string; options: Array<{ label: string }>; onApply: (index: number) => void }): React.JSX.Element {
    const [selected, setSelected] = useState('');
    return <TextField fullWidth label={props.label} onChange={event => { setSelected(event.target.value); props.onApply(Number(event.target.value)); }} select value={selected} variant="standard">
        {props.options.map((option, index) => <MenuItem key={index} value={String(index)}>{option.label}</MenuItem>)}
    </TextField>;
}

function PresetCard(props: { children: React.ReactNode }): React.JSX.Element {
    return <Card><CardContent>
        <Typography variant="h6">{t('presets')}</Typography>
        <FormHelperText sx={{ mb: 2 }}>{t('presetsInfo')}</FormHelperText>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 2 }}>{props.children}</Box>
    </CardContent></Card>;
}

// The derived scheme, shown so the seed field is not a leap of faith: these are the exact colors the
// widgets will receive, computed by the same function that writes the `colors.md3Scheme` state.
function SchemePreview(props: { scheme: M3Scheme }): React.JSX.Element {
    return <Box sx={{ backgroundColor: props.scheme.surface, borderRadius: 1, border: '1px solid', borderColor: props.scheme.outline, display: 'grid', gap: 0.5, gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))', p: 1 }}>
        {M3_ROLES.map(role => {
            // Every role is drawn on itself with a legible label: `on-*` roles read on their own
            // container, the rest on the surface they are meant to sit on.
            const on = role.startsWith('on-') ? props.scheme[role.slice(3) as keyof M3Scheme] : props.scheme[`on-${role}` as keyof M3Scheme] ?? props.scheme['on-surface'];
            return <Box key={role} sx={{ backgroundColor: role.startsWith('on-') ? on : props.scheme[role], borderRadius: 0.5, color: role.startsWith('on-') ? props.scheme[role] : on, fontSize: 11, overflow: 'hidden', px: 0.75, py: 0.5, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${role} ${props.scheme[role]}`}>{role}</Box>;
        })}
    </Box>;
}

function Material3Editor(props: { config: NativeConfig; update: (key: string, value: unknown) => void }): React.JSX.Element {
    const seed = str(props.config[MD3_SEED_KEY]);
    // An unset seed renders the baseline preview, which is exactly what the widgets fall back to —
    // the CSS baseline is generated from this same seed, so the two cannot drift apart.
    const scheme = m3SchemeFromSeed(seed || M3_BASELINE_SEED);
    const font = str(props.config[MD3_FONT_KEY]);
    return <>
        <PresetCard>
            <PresetSelect label={t('presetColors')} onApply={index => props.update(MD3_SEED_KEY, presets.material3Colors[index].seed)} options={presets.material3Colors} />
            <PresetSelect label={t('presetFonts')} onApply={index => props.update(MD3_FONT_KEY, presets.material3Fonts[index].font)} options={presets.material3Fonts} />
        </PresetCard>
        <Card sx={{ mt: 2 }}><CardContent>
            <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
                <Typography variant="h6">{t('material3Seed')}</Typography>
                <Button sx={{ ml: 'auto' }} onClick={() => props.update(MD3_SEED_KEY, '')}>{t('reset')}</Button>
            </Box>
            <FormHelperText sx={{ mb: 2 }}>{t('material3SeedInfo')}</FormHelperText>
            <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, mb: 2, maxWidth: 420 }}>
                <ColorSwatch fallback={M3_BASELINE_SEED} onChange={next => props.update(MD3_SEED_KEY, next)} size={28} value={seed} />
                <TextField fullWidth label={t('material3Seed')} onChange={event => props.update(MD3_SEED_KEY, event.target.value)} placeholder={M3_BASELINE_SEED} value={seed} variant="standard" />
            </Box>
            {scheme
                ? [false, true].map(dark => <Box key={String(dark)} sx={{ mt: 1 }}>
                    <FormHelperText sx={{ mb: 0.5 }}>{t(dark ? 'material3SchemeDark' : 'material3SchemeLight')}</FormHelperText>
                    <SchemePreview scheme={dark ? scheme.dark : scheme.light} />
                </Box>)
                : <FormHelperText error>{t('material3SeedInvalid')}</FormHelperText>}
        </CardContent></Card>
        <Card sx={{ mt: 2 }}><CardContent>
            <Box sx={{ alignItems: 'center', display: 'flex', gap: 2 }}>
                <Typography variant="h6">{t('material3Font')}</Typography>
                <Button sx={{ ml: 'auto' }} onClick={() => props.update(MD3_FONT_KEY, '')}>{t('reset')}</Button>
            </Box>
            <FormHelperText sx={{ mb: 2 }}>{t('material3FontInfo')}</FormHelperText>
            <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                <Typography sx={{ flex: '0 0 auto', fontFamily: font || 'inherit', fontSize: 22, minWidth: 32 }}>Aa</Typography>
                <TextField fullWidth label={t('material3Font')} onChange={event => props.update(MD3_FONT_KEY, event.target.value)} placeholder="Roboto, sans-serif" value={font} variant="standard" />
            </Box>
        </CardContent></Card>
    </>;
}

// One control with two jobs: it is the project-wide default style for every widget that did not pick
// one itself (persisted, mirrored to the `designStyle` state the widgets subscribe to), and it picks
// which style's default values are edited below. A widget's own `designStyle` always wins over it.
function DesignTab(props: { config: NativeConfig; update: (key: string, value: unknown) => void }): React.JSX.Element {
    const style = props.config.defaultDesignStyle === 'material3' ? 'material3' : 'legacy';
    return <Box sx={{ p: 1, py: 2, display: 'grid', gap: 2 }}>
        <Card><CardContent>
            <Box sx={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6">{t('designStyle')}</Typography>
                <ToggleButtonGroup exclusive onChange={(_event, next: 'legacy' | 'material3' | null) => { if (next) props.update('defaultDesignStyle', next); }} size="small" value={style}>
                    <ToggleButton value="legacy">{t('legacy')}</ToggleButton>
                    <ToggleButton value="material3">{t('material3')}</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <FormHelperText sx={{ mt: 1 }}>{t('designStyleInfo')}</FormHelperText>
        </CardContent></Card>
        {style === 'legacy' ? <ThemeEditor config={props.config} update={props.update} /> : <Material3Editor config={props.config} update={props.update} />}
    </Box>;
}

function ThemeEditor(props: { config: NativeConfig; update: (key: string, value: unknown) => void }): React.JSX.Element {
    const [tab, setTab] = useState(0);
    const [filter, setFilter] = useState('');
    const theme = (['colors', 'colorsDark', 'fonts', 'fontSizes'] as ThemeName[])[tab];
    const definition = themeDefinitions[theme];
    const defaults = readDefaults(props.config, theme);
    const entries = readEntries(props.config, theme, defaults);
    const filteredEntries = useMemo(() => entries.filter(entry => entry.widget.toLowerCase().includes(filter.toLowerCase())), [entries, filter]);
    const updateDefaults = (next: Array<string | number>) => props.update(defaultsKey(theme), next);
    const updateEntries = (next: ThemeEntry[]) => props.update(theme, next);

    return <>
        <PresetCard>
            <PresetSelect label={t('presetColors')} onApply={index => {
                const preset = presets.legacyColors[index];
                applyDefaultsPreset(props, 'colors', [...preset.light]);
                applyDefaultsPreset(props, 'colorsDark', [...preset.dark]);
            }} options={presets.legacyColors} />
            <PresetSelect label={t('presetFonts')} onApply={index => applyDefaultsPreset(props, 'fonts', [...presets.legacyFonts[index].fonts])} options={presets.legacyFonts} />
            <PresetSelect label={t('presetFontSizes')} onApply={index => applyDefaultsPreset(props, 'fontSizes', [...presets.legacyFontSizes[index].fontSizes])} options={presets.legacyFontSizes} />
        </PresetCard>
        <Tabs value={tab} onChange={(_event, next: number) => { setTab(next); setFilter(''); }} sx={{ borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
            <Tab label={t('config_colors')} /><Tab label={t('config_colorsDark')} /><Tab label={t('config_fonts')} /><Tab label={t('config_fontSizes')} />
        </Tabs>
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}><Typography variant="h6">{t(definition.title)}</Typography><Button sx={{ ml: 'auto' }} onClick={() => { updateDefaults([...definition.defaults]); updateEntries(readEntries({ [theme]: [] }, theme, [...definition.defaults])); }}>{t('reset')}</Button></Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 2 }}>
                    {defaults.map((value, index) => <Box key={index} sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                        {theme.startsWith('colors') && <ColorSwatch onChange={next => { const values = [...defaults]; values[index] = next; updateDefaults(values); }} size={28} value={String(value)} />}
                        {theme === 'fonts' && <Typography sx={{ flex: '0 0 auto', fontFamily: String(value), fontSize: 22, minWidth: 32 }}>Aa</Typography>}
                        {theme === 'fontSizes' && <Typography sx={{ flex: '0 0 auto', fontSize: `${Number(value) || 14}px`, minWidth: 32 }}>Aa</Typography>}
                        <TextField fullWidth label={`${t(`${theme}Default`)} ${index}`} type={theme === 'fontSizes' ? 'number' : 'text'} value={value} variant="standard" onChange={event => { const next = [...defaults]; next[index] = theme === 'fontSizes' ? Number(event.target.value) : event.target.value; updateDefaults(next); }} />
                    </Box>)}
                </Box>
            </CardContent>
        </Card>
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}><Typography variant="h6">{t(definition.widgetTitle)}</Typography><TextField label={t('Filter Widgets')} value={filter} onChange={event => setFilter(event.target.value)} variant="standard" sx={{ ml: 'auto', minWidth: 220 }} /></Box>
                <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>{t('Widget')}</TableCell><TableCell>{t('description')}</TableCell><TableCell>{t(`${theme}_table`)}</TableCell><TableCell>{t(`${theme}Default`)}</TableCell></TableRow></TableHead><TableBody>
                    {filteredEntries.map(entry => <TableRow key={entry.id}><TableCell>{entry.widget}</TableCell><TableCell>{t(entry.desc)}</TableCell><TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{theme.startsWith('colors') && <ColorSwatch onChange={next => updateEntries(entries.map(candidate => candidate.id === entry.id ? { ...candidate, value: next, defaultValue: undefined } : candidate))} size={24} value={String(entry.value ?? '')} />}<TextField fullWidth type={theme === 'fontSizes' ? 'number' : 'text'} value={entry.value ?? ''} variant="standard" onChange={event => updateEntries(entries.map(candidate => candidate.id === entry.id ? { ...candidate, value: theme === 'fontSizes' ? Number(event.target.value) : event.target.value, defaultValue: undefined } : candidate))} /></Box></TableCell><TableCell><Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{defaults.map((_value, index) => <Button key={index} size="small" variant={entry.defaultValue === index ? 'contained' : 'outlined'} onClick={() => updateEntries(entries.map(candidate => candidate.id === entry.id ? { ...candidate, defaultValue: index, value: defaults[index] } : candidate))}>{index}</Button>)}</Box></TableCell></TableRow>)}
                </TableBody></Table></TableContainer>
            </CardContent>
        </Card>
    </>;
}

function Config(props: { common: Record<string, unknown>; config: NativeConfig; instance: number; onError: (error: string) => void; onLoad: (settings: Record<string, unknown>) => void; update: (key: string, value: unknown) => void; onGenerate: () => void }): React.JSX.Element {
    const [tab, setTab] = useState(0);
    return <Box component="main" sx={{ height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' }, overflowY: 'auto' }}>
        <Box sx={{ minHeight: 72, position: 'relative', px: 1, py: 1 }}><Logo common={props.common} instance={props.instance} native={props.config} onError={props.onError} onLoad={props.onLoad} /><Typography component="h1" variant="h6" sx={{ fontWeight: 700, position: 'absolute', top: 18, left: 84 }}>Material Design Widgets</Typography></Box>
        <Tabs value={tab} onChange={(_event, next: number) => setTab(next)} sx={{ borderBottom: 1, borderColor: 'divider' }}><Tab icon={<SettingsIcon />} iconPosition="start" label={t('config_general')} /><Tab icon={<PaletteIcon />} iconPosition="start" label={t('Theme Editor for your Widgets')} /></Tabs>
        {tab === 0 ? <Box sx={{ p: 1, py: 2, display: 'grid', gap: 2 }}><Card><CardContent><Typography variant="h6" gutterBottom>{t('Generate global script')}</Typography><TextField fullWidth label={t('script name')} value={String(props.config.scriptName ?? 'Theme')} variant="standard" onChange={event => props.update('scriptName', event.target.value)} /><TextField fullWidth label={t('name of the variable')} value={String(props.config.variableName ?? 'myMdwTheme')} sx={{ mt: 2 }} variant="standard" onChange={event => props.update('variableName', event.target.value)} /><TextField fullWidth label={t('SelectJavascriptInstance')} value={String(props.config.javascriptInstance ?? '')} sx={{ mt: 2 }} variant="standard" onChange={event => props.update('javascriptInstance', event.target.value)} /><Button variant="contained" sx={{ mt: 2 }} onClick={props.onGenerate}>{t('generate script')}</Button></CardContent></Card><Card><CardContent><Typography variant="h6">{t('Sentry - automatic error reporting')}</Typography><FormGroup sx={{ pt: 1 }}><FormControlLabel control={<Checkbox checked={props.config.sentryReport === true} onChange={event => props.update('sentryReport', event.target.checked)} />} label={t('send Widget error reports')} /><FormHelperText sx={{ ml: 4, mt: -0.5 }}>{t('sentryInfo')}</FormHelperText></FormGroup></CardContent></Card></Box> : <DesignTab config={props.config} update={props.update} />}
    </Box>;
}

class MaterialDesignAdmin extends GenericApp<GenericAppProps, GenericAppState> {
    constructor(props: GenericAppProps) { super(props, { adapterName: 'vis2-materialdesign', bottomButtons: true, translations }); }
    onPrepareLoad(settings: NativeConfig): void {
        super.onPrepareLoad(settings);
        (['colors', 'colorsDark', 'fonts', 'fontSizes'] as ThemeName[]).forEach(theme => {
            const defaults = readDefaults(settings, theme);
            settings[defaultsKey(theme)] = defaults;
            settings[theme] = readEntries(settings, theme, defaults);
        });
    }
    // GenericApp.updateNativeValue() snapshots this.state.native when it is CALLED, so several calls
    // from one event handler — a preset writes up to eight keys — all start from the same pre-batch
    // state and only the last one survives. A functional setState sees each previous update. Every
    // key written here is top level, so the dotted-path walk of the base class is not needed.
    private updateNative(key: string, value: unknown): void {
        this.setState(
            state => {
                const native = { ...state.native, [key]: value };
                return { native, changed: this.getIsChanged(native) };
            },
            () => {
                try {
                    window.parent.postMessage(this.state.changed ? 'change' : 'nochange', '*');
                } catch {
                    // not embedded in the admin iframe
                }
            },
        );
    }
    private async ensureAncestorChannels(id: string, namespace: string, ensured: Set<string>): Promise<void> {
        const parts = id.substring(namespace.length + 1).split('.');
        parts.pop(); // the leaf state itself doesn't need a channel
        let current = namespace;
        for (const part of parts) {
            current = `${current}.${part}`;
            if (ensured.has(current)) continue;
            ensured.add(current);
            if (!(await this.socket.getObject(current))) {
                await this.socket.setObject(current, { type: 'channel', common: { name: part }, native: {} });
            }
        }
    }
    private async setThemeState(id: string, name: string, value: string | number): Promise<void> {
        const type = typeof value === 'number' ? 'number' : 'string';
        // role "value" is restricted to type "number" by the ioBroker role catalogue;
        // color hex codes and font names are strings, so they need the generic "text" role.
        const role = type === 'number' ? 'value' : 'text';
        const existing = await this.socket.getObject(id);
        if (!existing) {
            await this.socket.setObject(id, { type: 'state', common: { name, desc: name, type, read: true, write: false, role }, native: {} });
        } else if (existing.common.name !== name || existing.common.type !== type || existing.common.role !== role) {
            await this.socket.setObject(id, { ...existing, common: { ...existing.common, name, desc: name, type, role } } as never);
        }
        await this.socket.setState(id, value, true);
    }
    // The global settings states are declared in io-package.json `instanceObjects`, but js-controller
    // only materializes those when an INSTANCE IS CREATED — never on upgrade. A host that installed
    // this adapter before a given state was added therefore never gets it (verified on the live host:
    // the then-`colors.md3Primary` was missing since the version that introduced it, which is one
    // reason the seed colors never did anything there — that state is gone now, the failure mode is
    // not). So create them here too, with the same common/role/type as io-package declares, and only
    // when they are actually absent.
    private async ensureGlobalState(id: string, name: string, role: string, value: string): Promise<void> {
        if (!(await this.socket.getObject(id))) {
            await this.socket.setObject(id, { type: 'state', common: { name, desc: name, type: 'string', read: true, write: true, role, def: '' }, native: {} });
        }
        await this.socket.setState(id, value, true);
    }
    private async syncRuntimeStates(): Promise<void> {
        const config = this.state.native as NativeConfig;
        const namespace = `${this.adapterName}.${this.instance}`;
        const ensuredChannels = new Set<string>();
        await this.socket.setState(`${namespace}.sentry`, config.sentryReport === true, true);
        // The seed is derived to a full scheme HERE, once per save, and only the result travels to
        // the widgets — see ../../MATERIAL3_PLAN.md Phase 9.1. An empty or unparseable seed writes an
        // empty state, which makes every widget fall back to the generated baseline in
        // material3-tokens.css rather than to a half-applied scheme.
        const schemeId = `${namespace}.colors.md3Scheme`;
        await this.ensureAncestorChannels(schemeId, namespace, ensuredChannels);
        const seed = str(config[MD3_SEED_KEY]);
        const scheme = seed ? m3SchemeFromSeed(seed) : undefined;
        await this.ensureGlobalState(schemeId, 'Material 3 color scheme derived from the seed (JSON, written by the admin UI)', 'json', scheme ? JSON.stringify(scheme) : '');
        const fontId = `${namespace}.fonts.${MD3_FONT_KEY}`;
        await this.ensureAncestorChannels(fontId, namespace, ensuredChannels);
        await this.ensureGlobalState(fontId, 'Material 3 font family (optional, inherits from the view when empty)', 'text', str(config[MD3_FONT_KEY]));
        await this.ensureGlobalState(`${namespace}.designStyle`, 'Default design style for widgets without an own style (legacy | material3)', 'text', config.defaultDesignStyle === 'material3' ? 'material3' : 'legacy');
        for (const theme of ['colors', 'colorsDark', 'fonts', 'fontSizes'] as ThemeName[]) {
            const defaults = readDefaults(config, theme);
            const entries = readEntries(config, theme, defaults);
            for (const [index, value] of defaults.entries()) {
                const id = theme === 'colors' ? `${namespace}.colors.light.default_${index}` : theme === 'colorsDark' ? `${namespace}.colors.dark.default_${index}` : `${namespace}.${theme}.default_${index}`;
                await this.ensureAncestorChannels(id, namespace, ensuredChannels);
                await this.setThemeState(id, `${t(`${theme}Default`)} ${index}`, value);
            }
            for (const entry of entries) {
                const id = theme.startsWith('colors') ? `${namespace}.colors.${entry.id}` : `${namespace}.${theme}.${entry.id}`;
                await this.ensureAncestorChannels(id, namespace, ensuredChannels);
                await this.setThemeState(id, t(entry.desc), entry.value ?? '');
            }
        }
        await this.socket.setState(`${namespace}.lastchange`, Date.now(), true);
    }
    private async generateGlobalScript(): Promise<void> {
        const config = this.state.native as NativeConfig;
        const javascriptInstance = String(config.javascriptInstance ?? '');
        const variableName = String(config.variableName ?? 'myMdwTheme');
        if (!javascriptInstance || !/^[A-Za-z_$][\w$]*$/.test(variableName)) {
            this.showAlert(t('SelectJavascriptInstance'), 'warning');
            return;
        }
        const namespace = `${this.adapterName}.${this.instance}`;
        const states = await this.socket.getObjectView(`${namespace}.`, `${namespace}.\u9999`, 'state');
        const lines = [`var ${variableName} = {};`];
        const paths = new Set<string>();
        Object.keys(states).filter(id => id !== `${namespace}.colors.darkTheme`).sort().forEach(id => {
            let path = variableName;
            id.substring(namespace.length + 1).split('.').forEach(part => {
                path += `.${part}`;
                if (!paths.has(path)) { lines.push(`${path} = {};`); paths.add(path); }
            });
            lines.push(`${path}.getId = function () { return "${id}"; };`);
            lines.push(`${path}.getValue = function () { return getState("${id}").val; };`);
        });
        const id = `script.js.global.MaterialDesignWidgets.${namespace.replace('.', '')}`;
        await this.socket.setObject(id, { type: 'script', common: { name: String(config.scriptName ?? 'Theme'), expert: true, engineType: 'Javascript/js', engine: `system.adapter.${javascriptInstance}`, source: lines.join('\n'), debug: false, verbose: false, enabled: true } });
        this.showAlert(t('generate script'), 'success');
    }
    onSave(isClose?: boolean): void {
        // Never let the base class close immediately: it would tear down this component (and the
        // socket) while syncRuntimeStates() is still working through hundreds of sequential state
        // writes, leaving the object tree half migrated. Close ourselves once our sync is done.
        super.onSave(false);
        this.syncRuntimeStates()
            .then(() => {
                if (!isClose) {
                    // Dialog stays open: signal completion so the user knows it's safe to navigate away.
                    this.showAlert(t('theme states synced'), 'success');
                }
            })
            .catch(error => this.showAlert(String(error), 'error'))
            .finally(() => {
                if (isClose) {
                    GenericApp.onClose();
                }
            });
    }
    // The active language comes from the socket after connect and can differ from the UI language we
    // preloaded (admin-UI language ≠ ioBroker system language). If its dictionary isn't loaded yet,
    // fetch it and merge (without wiping the framework strings), then re-render.
    async onConnectionReady(): Promise<void> {
        const lang = this.socket.systemLang;
        if (lang && !translations[lang]) {
            await loadLang(lang);
            if (translations[lang]) {
                I18n.extendTranslations(translations[lang], lang);
                this.forceUpdate();
            }
        }
    }
    render(): React.JSX.Element { if (!this.state.loaded) return <Loader />; return <ThemeProvider theme={this.state.theme}><CssBaseline /><Config common={this.common as Record<string, unknown>} config={this.state.native as NativeConfig} instance={this.instance} onError={this.showError} onLoad={settings => this.setState({ native: settings })} update={(key, value) => this.updateNative(key, value)} onGenerate={() => void this.generateGlobalScript().catch(error => this.showAlert(String(error), 'error'))} />{this.renderHelperDialogs()}</ThemeProvider>; }
}

async function bootstrap(): Promise<void> {
    const initial = (window as unknown as { sysLang?: string }).sysLang || navigator.language?.split('-')[0] || 'en';
    await Promise.all([loadLang('en'), loadLang(initial)]);
    createRoot(document.getElementById('root')!).render(<MaterialDesignAdmin />);
}
void bootstrap();
