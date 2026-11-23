export interface DocWidget { tpl: string; data?: Record<string, unknown>; style?: Record<string, unknown> }
export interface IdRule { pattern: string; replace: string }
export interface ImportedVariant { module: string; id: string; label: string; data: Record<string, unknown>; size: { width: number; height: number } }

const HOST_ID = /^[a-z0-9_-]+\.\d+\.[\w.-]+$/i;
const URL_OR_IP = /https?:\/\/|\b\d{1,3}(\.\d{1,3}){3}\b/;
const px = (value: unknown): number => Number.parseFloat(typeof value === 'string' || typeof value === 'number' ? String(value) : '') || 0;
const slug = (text: string): string => text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'variant';
const humanize = (slugged: string, viewName: string): string => {
    const text = slugged.replace(/^m3-\d+-/, '').replace(new RegExp(`^${viewName.replace(/^m3-\d+-/, '')}-`), '').replace(/-+m3$/, '').replace(/-+/g, ' ').trim();
    return text ? text[0].toUpperCase() + text.slice(1) : '';
};
const plain = (html: unknown): string => (typeof html === 'string' ? html : '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

export function importDocVariants(
    project: Record<string, { widgets?: Record<string, DocWidget> }>,
    index: readonly { module: string; tpl: string; name: string }[],
    oidMap: Record<string, string>,
    rules: readonly IdRule[] = [],
    textMap: Record<string, string> = {},
): { variants: ImportedVariant[]; unmapped: string[]; review: string[] } {
    const variants: ImportedVariant[] = [];
    const unmapped = new Set<string>();
    const used = new Map<string, Set<string>>();
    const counters = new Map<string, number>();
    const translated = new Set(Object.values(textMap));
    const seen = new Set<string>();
    const tr = (text: string): string => (text in textMap ? textMap[text] : text);
    const rewrite = (value: unknown): unknown => {
        if (typeof value !== 'string') return value;
        if (value in oidMap) return oidMap[value];
        const rule = rules.find(r => new RegExp(r.pattern).test(value));
        if (rule) return rule.replace;
        if (value in textMap) return textMap[value];
        if (/[A-Za-z]/.test(value)) seen.add(value);
        if ((HOST_ID.test(value) && !value.startsWith('vis2-materialdesign.0.') && !value.startsWith('0_userdata.0.demo.')) || URL_OR_IP.test(value)) unmapped.add(value);
        return value;
    };
    for (const [viewName, view] of Object.entries(project)) {
        if (!viewName.startsWith('m3-') || viewName.endsWith('-dark') || viewName === 'm3-49-editor') continue;
        const widgets = Object.values(view.widgets ?? {});
        const labels = widgets.filter(w => w.tpl === 'tplHtml' && px(w.style?.left) < 230);
        const rows = widgets
            .filter(w => index.some(e => e.tpl === w.tpl) && w.data?.designStyle !== 'legacy')
            .sort((a, b) => px(a.style?.top) - px(b.style?.top));
        for (const widget of rows) {
            const entry = index.find(e => e.tpl === widget.tpl)!;
            const top = px(widget.style?.top);
            const rowLabel = plain(labels.find(l => Math.abs(px(l.style?.top) + px(l.style?.height) / 2 - (top + px(widget.style?.height) / 2)) <= 12)?.data?.html);
            const count = (counters.get(entry.module) ?? 0) + 1;
            counters.set(entry.module, count);
            const rawLabel = rowLabel || humanize(typeof widget.data?.name === 'string' ? widget.data.name : '', viewName);
            const label = tr(rawLabel) || `${entry.name} ${count}`;
            const ids = used.get(entry.module) ?? new Set<string>();
            let id = slug(label);
            for (let n = 2; ids.has(id); n++) id = `${slug(label)}-${n}`;
            ids.add(id);
            used.set(entry.module, ids);
            const data = Object.fromEntries(Object.entries(widget.data ?? {})
                .filter(([key]) => !key.startsWith('__mdwTheme') && key !== 'designStyle')
                .map(([key, value]) => [key, rewrite(value)]));
            variants.push({ module: entry.module, id, label, data, size: { width: px(widget.style?.width) || 300, height: px(widget.style?.height) || 60 } });
        }
    }
    for (const v of variants) seen.add(v.label);
    return { variants, unmapped: [...unmapped].sort(), review: [...seen].filter(s => !translated.has(s) && /\s|[A-Z]|[\u0080-\uffff]/.test(s) && !/^(#|0_userdata|vis2-materialdesign|[a-z0-9-]+\.\d+\.)/.test(s)).sort() };
}
