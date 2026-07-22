import React from 'react';

// Combined editor field: pick an MDI font icon (searchable, ~6800 names parsed from the loaded
// mdi-font.css) OR browse a file from the ioBroker file system (via socket.readDir, starting at the
// root namespace list so any adapter — e.g. icons-mfd-svg — is reachable). Both write into the same
// widget-data field. renderIcon() already handles both value kinds (image path -> <img>/mask,
// otherwise -> `mdi-<name>`), so no runtime change is needed.

type FileEntry = { file: string; isDir: boolean };
export interface PickerSocket {
    readDir(namespace: string, path: string): Promise<FileEntry[]>;
}
export interface PickerTheme {
    palette?: {
        mode?: string;
        background?: { paper?: string; default?: string };
        text?: { primary?: string; secondary?: string };
        divider?: string;
        primary?: { main?: string };
        action?: { hover?: string; selected?: string };
    };
}
export interface PickerTexts {
    adapter: string;
    cancel: string;
    choose: string;
    chooseEllipsis: string;
    clear: string;
    empty: string;
    file: string;
    icon: string;
    loading: string;
    preview: string;
    search: string;
    up: string;
}

let MDI_CACHE: string[] | null = null;
function mdiNames(): string[] {
    if (MDI_CACHE) {
        return MDI_CACHE;
    }
    const set = new Set<string>();
    for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList | null = null;
        try {
            rules = sheet.cssRules;
        } catch {
            continue; // cross-origin sheet
        }
        for (const rule of Array.from(rules || [])) {
            const sel = (rule as CSSStyleRule).selectorText;
            const m = sel && sel.match(/^\.mdi-([a-z0-9-]+)::?before$/);
            if (m) {
                set.add(m[1]);
            }
        }
    }
    MDI_CACHE = Array.from(set).sort();
    return MDI_CACHE;
}

const IMG_RE = /\.(gif|png|bmp|jpe?g|tiff?|svg)(\?|$)/i;
const isImg = (v: string): boolean => IMG_RE.test(v) || /^https?:\/\//.test(v) || v.startsWith('data:image/');

export function pickerValueName(value: string): string {
    if (!value) {
        return '';
    }
    if (value.startsWith('data:image/')) {
        return 'data:image';
    }
    const clean = value.split(/[?#]/, 1)[0];
    const name = clean.split('/').filter(Boolean).pop() || clean;
    try {
        return decodeURIComponent(name);
    } catch {
        return name;
    }
}

// Checkerboard tile behind image thumbnails: many ioBroker icon adapters ship white or `currentColor`
// SVGs that would be invisible on the light dialog surface (white on white). The pattern makes both
// black and white icons readable.
const checker: React.CSSProperties = {
    alignItems: 'center',
    backgroundColor: '#9e9e9e',
    backgroundImage:
        'linear-gradient(45deg,rgba(0,0,0,.25) 25%,transparent 25%,transparent 75%,rgba(0,0,0,.25) 75%),linear-gradient(45deg,rgba(0,0,0,.25) 25%,transparent 25%,transparent 75%,rgba(0,0,0,.25) 75%)',
    backgroundPosition: '0 0,4px 4px',
    backgroundSize: '8px 8px',
    borderRadius: 3,
    display: 'inline-flex',
    justifyContent: 'center',
    padding: 2,
};

function Preview({ value, size = 22 }: { value: string; size?: number }): React.JSX.Element | null {
    if (!value) {
        return null;
    }
    if (isImg(value)) {
        return (
            <span style={checker}>
                <img alt="" src={value} style={{ width: size, height: size, objectFit: 'contain' }} />
            </span>
        );
    }
    return <span className={`mdi mdi-${value.replace(/^mdi-/, '')}`} style={{ fontSize: size, lineHeight: 1 }} />;
}

export function IconFilePicker({ value, onChange, socket, label, texts, theme }: { value: string; onChange: (v: string) => void; socket?: PickerSocket; label?: string; texts: PickerTexts; theme?: PickerTheme }): React.JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [tab, setTab] = React.useState<'icon' | 'file'>(isImg(value) ? 'file' : 'icon');
    const [search, setSearch] = React.useState('');
    const [candidate, setCandidate] = React.useState(value);
    const dialogRef = React.useRef<HTMLDialogElement>(null);

    // theme-aware colors (fall back to a neutral dark palette so the dialog fits the vis2 editor)
    const pal = theme?.palette || {};
    const dark = pal.mode !== 'light';
    const surface = pal.background?.paper || (dark ? '#2a2a2a' : '#fff');
    const text = pal.text?.primary || (dark ? '#e0e0e0' : 'rgba(0,0,0,.87)');
    const subText = pal.text?.secondary || (dark ? '#a0a0a0' : 'rgba(0,0,0,.6)');
    const divider = pal.divider || (dark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)');
    const primary = pal.primary?.main || '#3399cc';
    const hover = pal.action?.hover || (dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)');

    React.useEffect(() => {
        const d = dialogRef.current;
        if (!d) {
            return;
        }
        if (open && !d.open) {
            d.showModal();
        } else if (!open && d.open) {
            d.close();
        }
    }, [open]);

    const names = React.useMemo(() => mdiNames(), []);
    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        return (q ? names.filter(n => n.includes(q)) : names).slice(0, 400);
    }, [names, search]);

    const choose = (): void => {
        onChange(candidate);
        setOpen(false);
    };
    const showPicker = (): void => {
        setCandidate(value);
        setOpen(true);
    };

    // --- file browser: ns === '' means the root namespace list ---
    const [ns, setNs] = React.useState('');
    const [path, setPath] = React.useState('');
    const [entries, setEntries] = React.useState<FileEntry[]>([]);
    const [err, setErr] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    React.useEffect(() => {
        if (!open || tab !== 'file' || !socket) {
            return undefined;
        }
        let cancelled = false;
        setErr('');
        setLoading(true);
        socket.readDir(ns, path)
            .then(list => { if (!cancelled) { setEntries(list); setLoading(false); } })
            .catch((e: { message?: string }) => {
                if (!cancelled) {
                    setEntries([]);
                    setLoading(false);
                    setErr(e?.message || 'Unable to load files');
                }
            });
        return () => {
            cancelled = true;
        };
    }, [open, tab, ns, path, socket]);

    const goUp = (): void => {
        if (path) {
            setPath(p => p.split('/').filter(Boolean).slice(0, -1).join('/'));
        } else {
            setNs('');
        }
    };
    const openEntry = (e: FileEntry): void => {
        if (!ns) {
            setNs(e.file.replace(/\/$/, ''));
            setPath('');
        } else if (e.isDir) {
            setPath(p => (p ? `${p}/${e.file}` : e.file));
        } else {
            setCandidate(`/${ns}/${path ? `${path}/` : ''}${e.file}`);
        }
    };
    const fileUrl = (file: string): string => `/${ns}/${path ? `${path}/` : ''}${file}`;

    const inputStyle: React.CSSProperties = { background: 'transparent', border: `1px solid ${divider}`, borderRadius: 4, boxSizing: 'border-box', color: text, font: 'inherit', fontSize: '.85rem', outline: 'none', padding: '8px 10px' };
    const rowBtn: React.CSSProperties = { alignItems: 'center', background: 'transparent', border: 0, borderRadius: 4, color: text, cursor: 'pointer', display: 'flex', font: 'inherit', fontSize: '.85rem', gap: 10, padding: '8px 10px', textAlign: 'left', width: '100%' };
    const visible = ns ? entries.filter(e => e.isDir || isImg(e.file)) : entries;
    const valueName = pickerValueName(value);

    return (
        <div className="mdw-iconpicker" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="mdw-editor-button mdw-editor-button--outlined" onClick={showPicker} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, padding: '6px 10px', textTransform: 'none' }} type="button">
                <Preview value={value} />
                <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={valueName || texts.chooseEllipsis}>{valueName || texts.chooseEllipsis}</span>
            </button>
            {value ? <button aria-label={texts.clear} className="mdw-editor-button mdw-editor-button--text" onClick={() => onChange('')} style={{ minWidth: 32 }} title={texts.clear} type="button">✕</button> : null}
            <dialog className="mdw-editor-dialog" onClick={e => { if (e.target === e.currentTarget) { setOpen(false); } }} onClose={() => setOpen(false)} ref={dialogRef} style={{ ['--mdw-editor-dialog-surface' as string]: surface, ['--mdw-editor-dialog-text' as string]: text, maxWidth: 620 }}>
                <div className="mdw-editor-dialog__paper" style={{ background: surface, color: text }}>
                    {/* header: title + tabs */}
                    <div style={{ alignItems: 'center', borderBottom: `1px solid ${divider}`, display: 'flex', gap: 8, padding: '14px 20px' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 500, marginRight: 'auto' }}>{label || texts.icon}</span>
                        <button className={`mdw-editor-button ${tab === 'icon' ? 'mdw-editor-button--contained' : 'mdw-editor-button--text'}`} onClick={() => setTab('icon')} style={{ textTransform: 'none' }} type="button">{texts.icon}</button>
                        <button className={`mdw-editor-button ${tab === 'file' ? 'mdw-editor-button--contained' : 'mdw-editor-button--text'}`} onClick={() => setTab('file')} style={{ textTransform: 'none' }} type="button">{texts.file}</button>
                    </div>

                    {/* selected candidate with large preview */}
                    <div style={{ alignItems: 'center', borderBottom: `1px solid ${divider}`, display: 'flex', gap: 16, minHeight: 116, padding: '12px 20px' }}>
                        <div style={{ alignItems: 'center', display: 'flex', flex: '0 0 100px', flexDirection: 'column', gap: 4 }}>
                            <Preview value={candidate} size={88} />
                            <span style={{ color: subText, fontSize: 12 }}>{texts.preview}</span>
                        </div>
                        <input onChange={e => setCandidate(e.target.value)} placeholder="mdi-name oder /path.svg" style={{ ...inputStyle, flex: 1, minWidth: 0 }} value={candidate} />
                    </div>

                    {/* content */}
                    <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '0 20px 8px' }}>
                        {tab === 'icon' ? (
                            <>
                                <input autoFocus onChange={e => setSearch(e.target.value)} placeholder={texts.search} style={{ ...inputStyle, marginBottom: 12, width: '100%' }} value={search} />
                                <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fill,minmax(58px,1fr))' }}>
                                    {filtered.map(n => (
                                        <button aria-label={`${n}: ${texts.choose}`} key={n} onClick={() => setCandidate(n)} style={{ alignItems: 'center', aspectRatio: '1', background: candidate === n ? primary : 'transparent', border: `1px solid ${candidate === n ? primary : divider}`, borderRadius: 6, color: candidate === n ? '#fff' : text, cursor: 'pointer', display: 'flex', justifyContent: 'center', padding: 0 }} title={n} type="button">
                                            <span className={`mdi mdi-${n}`} style={{ fontSize: 26, lineHeight: 1 }} />
                                        </button>
                                    ))}
                                </div>
                                <div style={{ color: subText, fontSize: 12, padding: '10px 0' }}>{filtered.length} / {names.length}</div>
                            </>
                        ) : (
                            <>
                                <div style={{ alignItems: 'center', color: subText, display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <button className="mdw-editor-button mdw-editor-button--outlined" disabled={!ns && !path} onClick={goUp} style={{ padding: '4px 10px' }} type="button">⬆ {texts.up}</button>
                                    <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ns ? `/${ns}/${path}` : texts.adapter}</span>
                                </div>
                                {err ? <div style={{ color: '#e57373', fontSize: 12, marginBottom: 8 }}>{err}</div> : null}
                                {loading ? <div style={{ color: subText, padding: 8 }}>{texts.loading}</div> : null}
                                <div>
                                    {visible.map(e => (
                                        <button aria-label={!ns || e.isDir ? undefined : `${e.file}: ${texts.choose}`} key={e.file} onClick={() => openEntry(e)} onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = hover; }} onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = candidate === fileUrl(e.file) ? primary : 'transparent'; }} style={{ ...rowBtn, background: candidate === fileUrl(e.file) ? primary : 'transparent' }} type="button">
                                            {!ns || e.isDir ? (
                                                <span className={`mdi ${ns ? 'mdi-folder' : 'mdi-database'}`} style={{ color: primary, fontSize: 22 }} />
                                            ) : (
                                                <Preview value={fileUrl(e.file)} />
                                            )}
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.file.replace(/\/$/, '')}</span>
                                        </button>
                                    ))}
                                    {!visible.length && !loading && !err ? <div style={{ color: subText, padding: 8 }}>{texts.empty}</div> : null}
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ borderTop: `1px solid ${divider}`, display: 'flex', justifyContent: 'flex-end', padding: '10px 16px' }}>
                        <button className="mdw-editor-button mdw-editor-button--text" onClick={() => setOpen(false)} style={{ textTransform: 'none' }} type="button">{texts.cancel}</button>
                        <button className="mdw-editor-button mdw-editor-button--contained" disabled={!candidate} onClick={choose} style={{ textTransform: 'none' }} type="button">{texts.choose}</button>
                    </div>
                </div>
            </dialog>
        </div>
    );
}
