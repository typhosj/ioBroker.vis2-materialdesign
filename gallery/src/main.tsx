import React from 'react';
import { createRoot } from 'react-dom/client';

import { installShim } from './runtime/GalleryRxWidget';
import { type GalleryWindow, createRuntime } from './runtime/runtime';

installShim();
const runtime = createRuntime({ test: new URLSearchParams(location.hash.split('?')[1]).get('test') === '1' });
(window as unknown as GalleryWindow).__galleryRuntime = runtime;

// Widget modules read window.visRxWidget at evaluation time, so nothing that imports them may load before installShim().
const { Lab } = await import('./pages/Lab');
createRoot(document.getElementById('root')!).render(<Lab runtime={runtime} />);
