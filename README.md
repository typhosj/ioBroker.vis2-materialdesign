![Logo](admin/vis-materialdesign.png)
<!-- omit in toc -->
# ioBroker.vis2-materialdesign

![stable version](http://iobroker.live/badges/vis2-materialdesign.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.vis2-materialdesign.svg)](https://www.npmjs.com/package/iobroker.vis2-materialdesign)
[![Number of Installations](http://iobroker.live/badges/vis2-materialdesign-installed.svg)](https://www.npmjs.com/package/iobroker.vis2-materialdesign)
[![Downloads](https://img.shields.io/npm/dm/iobroker.vis2-materialdesign.svg)](https://www.npmjs.com/package/ioBroker.vis2-materialdesign)

[![NPM](https://nodei.co/npm/iobroker.vis2-materialdesign.png?downloads=true)](https://nodei.co/npm/iobroker.vis2-materialdesign/)

<!-- omit in toc -->
## Material Design Widgets for ioBroker VIS 2
ioBroker VIS 2 Material Design widgets based on [Google's material design guidelines](https://material.io/design/).

This adapter is maintained by typhosj. The widgets are based on the original
VIS Material Design widget work by Scrounger.

<br>

<!-- omit in toc -->
## Table of Content
- [General](#general)
- [Adapter settings](#adapter-settings)
- [Widget documentation](#widget-documentation)
- [Informations](#informations)
- [Changelog](#changelog)
- [License](#license)

## General

### Author and attribution

Author and maintainer: typhosj <typhosj@gmx.de>

The widgets are based on the original VIS Material Design widget work by
Scrounger <scrounger@gmx.net>.

### Legacy examples and forum posts

The following examples and discussion threads refer to the original VIS1 widgets. Use them as design/feature references, not as VIS2 installation instructions.

* [Weather View](https://forum.iobroker.net/topic/32232/material-design-widgets-wetter-view)
* [Skript Status](https://forum.iobroker.net/topic/30662/material-design-widgets-skript-status)
* [Adapter Status](https://forum.iobroker.net/topic/30661/material-design-widgets-adapter-status)
* [UniFi Netzwerk Status](https://github.com/typhosj/ioBroker.vis2-materialdesign/tree/master/examples/UnifiNetworkState)

### Questions about the legacy widgets

* [German threads](https://forum.iobroker.net/search?term=Material%20Design%20Widgets%3A&in=titles&matchWords=all&by%5B%5D=Scrounger&categories%5B%5D=7&sortBy=topic.title&sortDirection=desc&showAs=topics)

### Browser support

The generated widgets target modern Chromium-based browsers and current Firefox versions. Installed VIS2 runtime/browser compatibility testing is still pending.

### Supported Browser for vibrate on mobil devices function
https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate

## Adapter settings

The inherited Theme Editor and its `vis-materialdesign.0.*` bindings belong to the VIS1 widget set. They are retained for legacy compatibility, but are not native VIS2 configuration and have not been verified for the ported widgets. Configure native widgets through the VIS2 editor.

## Widget documentation

The following documents describe the original VIS1 widgets. They remain useful for option names and intended behavior, but are not yet native VIS2 user documentation.

- [Material Design Icons and Images](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/material-design-icons-and-images.md)
- [Buttons](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/buttons.md)
- [Buttons Vertical](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/buttons-vertical.md)
- [Icon Buttons](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/icon-buttons.md)
- [Checkbox](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/checkbox.md)
- [Switch](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/switch.md)
- [Value](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/value.md)
- [HTML Card](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/html-card.md)
- [List](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/list.md)
- [IconList](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/iconlist.md)
- [Progress](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/progress.md)
- [Progress Circular](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/progress-circular.md)
- [Slider](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/slider.md)
- [Slider Round](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/slider-round.md)
- [Input](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/input.md)
- [Top App Bar](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/top-app-bar.md)
- [Charts](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/charts.md)
- [Table](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/table.md)
- [Responsive Layout](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/responsive-layout.md)
- [Alerts](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/alerts.md)
- [Calendar](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/calendar.md)
- [Dialog](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/dialog.md)
- [HTML Widgets](https://github.com/typhosj/ioBroker.vis2-materialdesign/blob/master/doc/en/widgets/html-widgets.md)

Full index: [doc/en/widgets/README.md](https://github.com/typhosj/ioBroker.vis2-materialdesign/tree/master/doc/en/widgets)

## Informations

### Legacy library references

The original VIS1 widget set used the following libraries. Native VIS2 components only use the dependencies bundled by their VIS2 build.
* [Google material components for the web](https://github.com/material-components/material-components-web)
* [Vuetify](https://github.com/vuetifyjs/vuetify)
* [chartjs](https://www.chartjs.org/)
* [round-slider from thomasloven](https://github.com/thomasloven/round-slider)
* [Material Design Icons](https://materialdesignicons.com/)


## Changelog
### **WORK IN PROGRESS**

### 0.2.0 (2026-07-13)
* (typhosj) Ported all remaining legacy Material Design widget templates to native VIS 2 components
* (typhosj) Added calendar, chart, table and embedded child-view widgets for dialogs, masonry, grid and advanced views
* (typhosj) Added automated legacy-template-to-VIS2 registration coverage checks
* (typhosj) Ported the adapter configuration UI to React 5 with the native theme editor
* (typhosj) Restored the VIS2 editor action to apply Material Design theme values to widget properties

### 0.1.0 (2026-07-09)
* (typhosj) Initial native VIS 2 port of the Material Design button widgets
* (typhosj) Added one-to-one VIS 2 button variants for navigation, link, state, multi-state, addition, toggle, vertical buttons, icon buttons, and icon button slider
* (typhosj) Added VIS 2 editor previews using the original Material Design icon glyphs
* (typhosj) Ported button state writes, delayed multi-state writes, toggle and push-button behavior, lock overlay, click sound, vibration feedback, image/icon handling, and SVG color behavior
* Based on the original VIS Material Design widgets version 0.5.9 by Scrounger

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
