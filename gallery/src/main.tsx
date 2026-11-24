import React from 'react';
import { createRoot } from 'react-dom/client';

import './gallery.css';
import './ui/tokens.css';
import './ui/ui.css';
import '../../src-widgets-ts/src/mdi-font.css';
import { installShim } from './runtime/GalleryRxWidget';
import { type GalleryWindow, createRuntime } from './runtime/runtime';

installShim();
const runtime = createRuntime({ test: new URLSearchParams(location.hash.split('?')[1]).get('test') === '1' });
(window as unknown as GalleryWindow).__galleryRuntime = runtime;

// Widget modules read window.visRxWidget at evaluation time, so nothing that imports them may load before installShim().
const { App } = await import('./pages/App');
createRoot(document.getElementById('root')!).render(<App runtime={runtime} />);
