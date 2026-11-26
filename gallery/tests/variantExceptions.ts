// Widget/variant -> why it may look like the first example; each entry needs a smoke-test interaction that shows the difference,
// unless the widget has no option of its own and so cannot differ.
export const VARIANT_EXCEPTIONS: Record<string, string> = {
    'Installed Version/as-inserted': 'no options: the typical use is the widget as inserted',
};

// Families not yet reviewed: their findings are reported but do not fail the test. Each review round removes its family.
export const PENDING_FAMILIES = new Set(['lists', 'charts', 'calendar', 'views', 'navigation']);
