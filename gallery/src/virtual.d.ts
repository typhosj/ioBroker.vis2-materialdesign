declare module 'virtual:gallery-theme' {
    const theme: { states: Record<string, ioBroker.StateValue>; schemes: Record<string, string> };
    export default theme;
}
declare module 'virtual:gallery-meta' {
    const meta: { version: string; templates: string[] };
    export default meta;
}
declare module 'virtual:gallery-docs' {
    const docs: Record<string, { en: string; de: string }>;
    export default docs;
}
