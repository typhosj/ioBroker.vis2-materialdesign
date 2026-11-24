import meta from 'virtual:gallery-meta';
import React from 'react';

import { EXCLUDED } from '../catalog/catalog';
import { translate } from '../runtime/i18n';
import { Card } from '../ui/Card';

export function About(): React.JSX.Element {
    return (
        <>
        <header className="g-page-head"><h1>{translate('gallery_about')}</h1></header>
        <Card>
            <p>{translate('gallery_about_text')}</p>
            <p>vis2-materialdesign {meta.version} · MIT · <a href="https://github.com/typhosj/ioBroker.vis2-materialdesign" rel="noopener" target="_blank">GitHub</a></p>
            <p>Fonts: Material Design Icons (Apache 2.0), Material Symbols (Apache 2.0), Roboto Condensed and Jura (OFL).</p>
            <h2>{translate('gallery_downloads')}</h2>
            <p>{translate('gallery_downloads_text')}</p>
            <ul>{meta.templates.map(file => <li key={file}><a href={`templates/${file}.json`} download>{file}.json</a></li>)}</ul>
            {Object.keys(EXCLUDED).length ? <><h2>{translate('gallery_excluded')}</h2><ul>{Object.entries(EXCLUDED).map(([m, why]) => <li key={m}>{m}: {why}</li>)}</ul></> : null}
        </Card>
        </>
    );
}
