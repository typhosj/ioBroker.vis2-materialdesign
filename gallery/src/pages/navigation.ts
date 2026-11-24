import { FAMILIES, type Family } from '../catalog/catalog';
import { translate } from '../runtime/i18n';
import { widgetIndex } from '../runtime/widgets';
import { type Route, routeHash } from '../state';
import type { NavSection } from '../ui/NavDrawer';

export const FAMILY_ORDER: Family[] = ['buttons', 'iconButtons', 'input', 'sliders', 'progress', 'values', 'lists', 'charts', 'calendar', 'views', 'navigation'];
export const FAMILY_ICON: Record<Family, string> = {
    buttons: 'gesture-tap-button', iconButtons: 'circle-outline', input: 'form-textbox', sliders: 'tune-variant', progress: 'progress-helper',
    values: 'numeric', lists: 'format-list-bulleted', charts: 'chart-line', calendar: 'calendar-month', views: 'view-dashboard-outline', navigation: 'dock-top',
};

const familyOf = (name: string): Family | undefined => {
    const entry = widgetIndex.find(e => e.name === name || e.module === name);
    return entry ? FAMILIES[entry.module]?.family : undefined;
};

export function navSections(route: Route): NavSection[] {
    const [section, name] = route.path;
    const current = section === 'family' ? name : section === 'widget' && name ? familyOf(name) : undefined;
    const link = (path: string[]): string => routeHash(path, { ...route.query, variant: undefined });
    return [
        { items: [{ href: link([]), label: translate('gallery_nav_overview'), icon: 'home-outline', current: !section }] },
        { label: translate('gallery_nav_widgets'), items: FAMILY_ORDER.map(f => ({ href: link(['family', f]), label: translate(`gallery_family_${f}`), icon: FAMILY_ICON[f], current: current === f })) },
        { items: [
            { href: link(['dashboard', 'tablet']), label: translate('gallery_dashboard_tablet'), icon: 'tablet-dashboard', current: section === 'dashboard' && name === 'tablet' },
            { href: link(['dashboard', 'phone']), label: translate('gallery_dashboard_phone'), icon: 'cellphone', current: section === 'dashboard' && name === 'phone' },
            { href: link(['about']), label: translate('gallery_about'), icon: 'information-outline', current: section === 'about' },
        ] },
    ];
}
