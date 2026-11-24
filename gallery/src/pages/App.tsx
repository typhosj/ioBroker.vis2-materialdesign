import theme from 'virtual:gallery-theme';
import React, { useEffect, useState } from 'react';

import { hostRuntime, type GalleryRuntime } from '../runtime/runtime';
import { type Route, applyQuery, parseRoute } from '../state';
import { About } from './About';
import { DashboardFrame, DashboardPage } from './DashboardPage';
import { Lab } from './Lab';
import { Overview } from './Overview';
import { Shell } from './Shell';
import { WidgetFrame, WidgetPage } from './WidgetPage';

export function App({ runtime }: { runtime: GalleryRuntime }): React.JSX.Element {
    const [route, setRoute] = useState<Route>(() => parseRoute(location.hash));
    const [ready, setReady] = useState(0);
    const [search, setSearch] = useState('');
    useEffect(() => {
        const onHash = (): void => setRoute(parseRoute(location.hash));
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);
    useEffect(() => { void applyQuery(runtime, route.query, theme.schemes).catch((error: unknown) => console.error('applyQuery failed', error)).then(() => setReady(n => n + 1)); }, [runtime, route.query.theme, route.query.style, route.query.lang, route.query.seed]);
    useEffect(() => {
        document.documentElement.lang = route.query.lang;
        document.documentElement.dataset.theme = route.query.theme;
    }, [route.query.lang, route.query.theme]);
    if (!ready) return <></>;
    const [section, name] = route.path;
    if (section === 'frame' && name === 'dashboard') return <DashboardFrame key={`${route.query.lang}${route.path[2]}`} query={route.query} runtime={hostRuntime() ?? runtime} view={route.path[2]} />;
    if (section === 'frame') return <WidgetFrame key={`${route.query.lang}`} name={route.path[2]} query={route.query} runtime={runtime} />;
    // The language is part of the key: Intl formats and widget texts are read on mount.
    return (
        <div className="g-app" key={route.query.lang}>
            <Shell onSearch={setSearch} route={route} runtime={runtime} search={search}>
                {section === 'widget' && name ? <WidgetPage name={name} query={route.query} runtime={runtime} />
                    : section === 'dashboard' && name ? <DashboardPage name={name} query={route.query} />
                    : section === 'about' ? <About />
                    : section === 'lab' ? <Lab runtime={runtime} />
                    : <Overview family={section === 'family' ? name : undefined} query={route.query} search={search} />}
            </Shell>
        </div>
    );
}
