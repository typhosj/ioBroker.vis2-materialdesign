![Logo](admin/vis-materialdesign.png)
<!-- omit in toc -->

# ioBroker.vis2-materialdesign

![stable version](http://iobroker.live/badges/vis2-materialdesign.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.vis2-materialdesign.svg)](https://www.npmjs.com/package/iobroker.vis2-materialdesign)
[![Number of Installations](http://iobroker.live/badges/vis2-materialdesign-installed.svg)](https://www.npmjs.com/package/iobroker.vis2-materialdesign)
[![Downloads](https://img.shields.io/npm/dm/iobroker.vis2-materialdesign.svg)](https://www.npmjs.com/package/ioBroker.vis2-materialdesign)

[![NPM](https://nodei.co/npm/iobroker.vis2-materialdesign.png?downloads=true)](https://nodei.co/npm/iobroker.vis2-materialdesign/)

<!-- omit in toc -->

## Material Design widgets for ioBroker VIS 2

This adapter is maintained by typhosj. The widgets are based on the original
VIS Material Design widget work by Scrounger.

**Documentation:** [Deutsch](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/de/README.md) · [English](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/README.md)

## Design status

Existing widgets currently keep their established Material Design 2-era look,
component IDs and settings. An opt-in Material 3 presentation is planned. It
will not silently change existing VIS 2 projects.

## Requirements

- ioBroker with Admin 7.6.20 or newer
- Node.js 22 or newer
- an installed VIS 2 adapter
- a current Chromium-based browser or Firefox (target environment)

Vibration feedback depends on the browser and device. See the
[browser compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate#browser_compatibility).

## Installation

Install **Material Design Widgets** (`vis2-materialdesign`) from the ioBroker
Admin adapter list. No separate adapter process is needed for widget delivery.

## Quick start

1. Open the VIS 2 editor and a project.
2. Open the **Material Design** widget set.
3. Drag a widget into the view and select it.
4. Configure its object ID and behaviour in the **WIDGET** tab.
5. Save the project and test the view in runtime mode.

Theme use is optional. Configure colors and fonts in the adapter's **Theme
Editor**, save them, then use **Theme → use theme** on a selected widget. This
copies the matching theme references into that widget; explicit widget settings
can still be changed afterwards.

## Documentation

- [German user guide](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/de/README.md)
- [English user guide](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/README.md)
- [German widget catalog](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/de/widgets/README.md)
- [English widget catalog](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/README.md)

## Support

Report current VIS 2 problems in the
[GitHub issue tracker](https://github.com/typhosj/ioBroker.vis2-materialdesign/issues).

## Changelog
### 0.3.1 (2026-07-23)

- (typhosj) Added the combined icon/image picker to the remaining widgets (checkbox, input, select, switch)
- (typhosj) Removed the legacy VIS 1 example scripts (`examples/`) from the repository
- (typhosj) Expanded test coverage for the slider, round slider and value widgets

### 0.3.0 (2026-07-22)

- (typhosj) Removed all VIS 1 legacy: the bundled `materialdesign` VIS 1 widget set and `materialdesign.html` are gone; the adapter no longer ships or depends on any VIS 1 files
- (typhosj) Made all widgets self-contained by vendoring the Material Design Icons webfont and the required Material Components base CSS into the widget bundle, so icons and styling render without the legacy stylesheet
- (typhosj) Removed the obsolete jQuery/Materialize configuration page; the native React theme editor is now the only admin UI
- (typhosj) Roughly halved the published package size (woff2-only fonts, dead-code removal, smaller preview image)
- (typhosj) Added text input masking and custom calendar date/time formats
- (typhosj) Restored full visual parity of the ported widgets against the original VIS 1 versions and migrated the widget documentation to VIS 2
- (typhosj) Reworked the widget documentation with per-widget editor screenshots that expand the relevant option groups and describe every non-obvious setting (English and German)
- (typhosj) Fixed six widget editor group headers (title, text, card action, linked value, striped, list header) that showed untranslated keys

### 0.2.0 (2026-07-13)

- (typhosj) Ported all remaining legacy Material Design widget templates to native VIS 2 components
- (typhosj) Added calendar, chart, table and embedded child-view widgets for dialogs, masonry, grid and advanced views
- (typhosj) Added automated legacy-template-to-VIS2 registration coverage checks
- (typhosj) Ported the adapter configuration UI to React 5 with the native theme editor
- (typhosj) Restored the VIS2 editor action to apply Material Design theme values to widget properties

### 0.1.0 (2026-07-09)

- (typhosj) Initial native VIS 2 port of the Material Design button widgets
- (typhosj) Added one-to-one VIS 2 button variants for navigation, link, state, multi-state, addition, toggle, vertical buttons, icon buttons, and icon button slider
- (typhosj) Added VIS 2 editor previews using the original Material Design icon glyphs
- (typhosj) Ported button state writes, delayed multi-state writes, toggle and push-button behavior, lock overlay, click sound, vibration feedback, image/icon handling, and SVG color behavior
- Based on the original VIS Material Design widgets version 0.5.9 by Scrounger

[Older changelog entries](CHANGELOG_OLD.md)

<!-- omit in toc -->

## License

MIT License

Copyright (c) 2026 typhosj <typhosj@gmx.de>  
Copyright (c) 2021 Scrounger <scrounger@gmx.net>

The widgets are based on the original VIS Material Design widget work by
Scrounger <scrounger@gmx.net>.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
