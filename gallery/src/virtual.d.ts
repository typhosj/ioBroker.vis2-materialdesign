declare module 'virtual:gallery-theme' {
    const theme: { states: Record<string, ioBroker.StateValue>; schemes: Record<string, string> };
    export default theme;
}
declare module 'virtual:gallery-meta' {
    const meta: { version: string };
    export default meta;
}
