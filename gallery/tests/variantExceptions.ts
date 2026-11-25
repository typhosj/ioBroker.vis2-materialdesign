// Widget/variant -> why it may look like the first example; each entry needs a smoke-test interaction that shows the difference.
export const VARIANT_EXCEPTIONS: Record<string, string> = {};

// Families not yet reviewed: their findings are reported but do not fail the test. Each review round removes its family.
export const PENDING_FAMILIES = new Set(['buttons', 'iconButtons', 'input', 'sliders', 'progress', 'values', 'lists', 'charts', 'calendar', 'views', 'navigation']);
