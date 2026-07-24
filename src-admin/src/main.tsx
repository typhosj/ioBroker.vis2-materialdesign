import { GenericApp, I18n, Loader, Logo, type GenericAppProps, type GenericAppState } from '@iobroker/adapter-react-v5';
import PaletteIcon from '@mui/icons-material/Palette';
import SettingsIcon from '@mui/icons-material/Settings';
import { Box, Button, Card, CardContent, Checkbox, CssBaseline, FormControlLabel, FormGroup, FormHelperText, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, ThemeProvider, Typography } from '@mui/material';
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
import '../../fonts.css';
import './style.css';

// Kept in sync by hand with `M3_SEED_ROLES` in src-widgets-ts/src/widgetUtils.tsx (not imported —
// that module pulls in the whole widget runtime/CSS, which does not belong in the admin bundle).
const M3_SEED_ROLES = ['primary', 'secondary', 'tertiary', 'error'] as const;
function md3Key(role: (typeof M3_SEED_ROLES)[number]): string { return `md3${role.charAt(0).toUpperCase()}${role.slice(1)}`; }
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

    return <Box sx={{ p: 1, py: 2 }}>
        <Tabs value={tab} onChange={(_event, next: number) => { setTab(next); setFilter(''); }} sx={{ borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
            <Tab label={t('config_colors')} /><Tab label={t('config_colorsDark')} /><Tab label={t('config_fonts')} /><Tab label={t('config_fontSizes')} />
        </Tabs>
        <Card sx={{ mt: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}><Typography variant="h6">{t(definition.title)}</Typography><Button sx={{ ml: 'auto' }} onClick={() => { updateDefaults([...definition.defaults]); updateEntries(readEntries({ [theme]: [] }, theme, [...definition.defaults])); }}>{t('reset')}</Button></Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 2 }}>
                    {defaults.map((value, index) => <Box key={index} sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                        {theme.startsWith('colors') && <Box aria-label={String(value)} sx={{ backgroundColor: String(value), border: 1, borderColor: 'divider', borderRadius: 0.5, flex: '0 0 auto', height: 28, width: 28 }} />}
                        {theme === 'fonts' && <Typography sx={{ flex: '0 0 auto', fontFamily: String(value), fontSize: 22, minWidth: 32 }}>Aa</Typography>}
                        {theme === 'fontSizes' && <Typography sx={{ flex: '0 0 auto', fontSize: `${Number(value) || 14}px`, minWidth: 32 }}>Aa</Typography>}
                        <TextField fullWidth label={`${t(`${theme}Default`)} ${index}`} type={theme === 'fontSizes' ? 'number' : 'text'} value={value} variant="standard" onChange={event => { const next = [...defaults]; next[index] = theme === 'fontSizes' ? Number(event.target.value) : event.target.value; updateDefaults(next); }} />
                    </Box>)}
                </Box>
            </CardContent>
        </Card>
        <Card sx={{ mt: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}><Typography variant="h6">{t(definition.widgetTitle)}</Typography><TextField label={t('Filter Widgets')} value={filter} onChange={event => setFilter(event.target.value)} variant="standard" sx={{ ml: 'auto', minWidth: 220 }} /></Box>
                <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>{t('Widget')}</TableCell><TableCell>{t('description')}</TableCell><TableCell>{t(`${theme}_table`)}</TableCell><TableCell>{t(`${theme}Default`)}</TableCell></TableRow></TableHead><TableBody>
                    {filteredEntries.map(entry => <TableRow key={entry.id}><TableCell>{entry.widget}</TableCell><TableCell>{t(entry.desc)}</TableCell><TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{theme.startsWith('colors') && <Box aria-label={String(entry.value ?? '')} sx={{ backgroundColor: String(entry.value ?? 'transparent'), border: 1, borderColor: 'divider', borderRadius: 0.5, flex: '0 0 auto', height: 24, width: 24 }} />}<TextField fullWidth type={theme === 'fontSizes' ? 'number' : 'text'} value={entry.value ?? ''} variant="standard" onChange={event => updateEntries(entries.map(candidate => candidate.id === entry.id ? { ...candidate, value: theme === 'fontSizes' ? Number(event.target.value) : event.target.value, defaultValue: undefined } : candidate))} /></Box></TableCell><TableCell><Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>{defaults.map((_value, index) => <Button key={index} size="small" variant={entry.defaultValue === index ? 'contained' : 'outlined'} onClick={() => updateEntries(entries.map(candidate => candidate.id === entry.id ? { ...candidate, defaultValue: index, value: defaults[index] } : candidate))}>{index}</Button>)}</Box></TableCell></TableRow>)}
                </TableBody></Table></TableContainer>
            </CardContent>
        </Card>
    </Box>;
}

function Config(props: { common: Record<string, unknown>; config: NativeConfig; instance: number; onError: (error: string) => void; onLoad: (settings: Record<string, unknown>) => void; update: (key: string, value: unknown) => void; onGenerate: () => void }): React.JSX.Element {
    const [tab, setTab] = useState(0);
    return <Box component="main" sx={{ height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' }, overflowY: 'auto' }}>
        <Box sx={{ minHeight: 72, position: 'relative', px: 1, py: 1 }}><Logo common={props.common} instance={props.instance} native={props.config} onError={props.onError} onLoad={props.onLoad} /><Typography component="h1" variant="h6" sx={{ fontWeight: 700, position: 'absolute', top: 18, left: 84 }}>Material Design Widgets</Typography></Box>
        <Tabs value={tab} onChange={(_event, next: number) => setTab(next)} sx={{ borderBottom: 1, borderColor: 'divider' }}><Tab icon={<SettingsIcon />} iconPosition="start" label={t('config_general')} /><Tab icon={<PaletteIcon />} iconPosition="start" label={t('Theme Editor for your Widgets')} /></Tabs>
        {tab === 0 ? <Box sx={{ p: 1, py: 2, display: 'grid', gap: 2 }}><Card><CardContent><Typography variant="h6" gutterBottom>{t('Generate global script')}</Typography><TextField fullWidth label={t('script name')} value={String(props.config.scriptName ?? 'Theme')} variant="standard" onChange={event => props.update('scriptName', event.target.value)} /><TextField fullWidth label={t('name of the variable')} value={String(props.config.variableName ?? 'myMdwTheme')} sx={{ mt: 2 }} variant="standard" onChange={event => props.update('variableName', event.target.value)} /><TextField fullWidth label={t('SelectJavascriptInstance')} value={String(props.config.javascriptInstance ?? '')} sx={{ mt: 2 }} variant="standard" onChange={event => props.update('javascriptInstance', event.target.value)} /><Button variant="contained" sx={{ mt: 2 }} onClick={props.onGenerate}>{t('generate script')}</Button></CardContent></Card><Card><CardContent><Typography variant="h6">{t('Sentry - automatic error reporting')}</Typography><FormGroup sx={{ pt: 1 }}><FormControlLabel control={<Checkbox checked={props.config.sentryReport === true} onChange={event => props.update('sentryReport', event.target.checked)} />} label={t('send Widget error reports')} /><FormHelperText sx={{ ml: 4, mt: -0.5 }}>{t('sentryInfo')}</FormHelperText></FormGroup></CardContent></Card><Card><CardContent><Typography variant="h6" gutterBottom>{t('material3SeedColors')}</Typography><FormHelperText sx={{ mb: 1 }}>{t('material3SeedColorsInfo')}</FormHelperText><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>{M3_SEED_ROLES.map(role => <TextField key={role} fullWidth label={t(`material3Seed_${role}`)} placeholder="#6750a4" value={str(props.config[md3Key(role)])} variant="standard" onChange={event => props.update(md3Key(role), event.target.value)} />)}</Box></CardContent></Card></Box> : <ThemeEditor config={props.config} update={props.update} />}
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
    private async syncRuntimeStates(): Promise<void> {
        const config = this.state.native as NativeConfig;
        const namespace = `${this.adapterName}.${this.instance}`;
        const ensuredChannels = new Set<string>();
        await this.socket.setState(`${namespace}.sentry`, config.sentryReport === true, true);
        for (const role of M3_SEED_ROLES) {
            await this.socket.setState(`${namespace}.colors.${md3Key(role)}`, str(config[md3Key(role)]), true);
        }
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
    render(): React.JSX.Element { if (!this.state.loaded) return <Loader />; return <ThemeProvider theme={this.state.theme}><CssBaseline /><Config common={this.common as Record<string, unknown>} config={this.state.native as NativeConfig} instance={this.instance} onError={this.showError} onLoad={settings => this.setState({ native: settings })} update={(key, value) => this.updateNativeValue(key, value)} onGenerate={() => void this.generateGlobalScript().catch(error => this.showAlert(String(error), 'error'))} />{this.renderHelperDialogs()}</ThemeProvider>; }
}

async function bootstrap(): Promise<void> {
    const initial = (window as unknown as { sysLang?: string }).sysLang || navigator.language?.split('-')[0] || 'en';
    await Promise.all([loadLang('en'), loadLang(initial)]);
    createRoot(document.getElementById('root')!).render(<MaterialDesignAdmin />);
}
void bootstrap();
