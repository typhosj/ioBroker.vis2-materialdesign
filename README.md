![Logo](admin/vis-materialdesign.png)
<!-- omit in toc -->

# ioBroker.vis2-materialdesign

[![stable version](https://img.shields.io/badge/stable%20version-%E2%80%91%E2%80%91%E2%80%91-lightgrey)](https://www.npmjs.com/package/iobroker.vis2-materialdesign)
[![NPM version](http://img.shields.io/npm/v/iobroker.vis2-materialdesign.svg)](https://www.npmjs.com/package/iobroker.vis2-materialdesign)
[![Downloads](https://img.shields.io/npm/dm/iobroker.vis2-materialdesign.svg)](https://www.npmjs.com/package/ioBroker.vis2-materialdesign)
[![Tests](https://github.com/typhosj/ioBroker.vis2-materialdesign/actions/workflows/test-and-release.yml/badge.svg)](https://github.com/typhosj/ioBroker.vis2-materialdesign/actions/workflows/test-and-release.yml)

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
### **WORK IN PROGRESS**

- (typhosj) Added direct support for the **ical adapter** to the Calendar: a state like `ical.0.data.table` can be used as it is. The widget reads the adapter's own field names (`event`, `_date`, `_end`, `_allDay`, `_calColor`) next to the documented start/end/name format, and converts its UTC timestamps to local time so an appointment no longer lands on the wrong hour or day (reported in the forum)
- (typhosj) Added a line on the current time to the week and day view of the Calendar, moved on every minute. It can be switched off and colored in the time-axis group (reported in the forum)
- (typhosj) Added the calendar week to the week view of the Calendar, above the time axis, following the existing "show calendar week" option (reported in the forum)
- (typhosj) Fixed all-day and multi-day appointments of the **Calendar** covering one day too many: an all-day end is exclusive, and the ical adapter writes it as midnight of the following day, which the widget still counted as a day of its own. An end at midnight now ends the appointment on the previous day, whether it is written as a date or as a timestamp (reported in the forum)
- (typhosj) Fixed the month view of the **Calendar** dropping the start time of an appointment that has one; it shows the time in front of the name again, like VIS 1 (reported in the forum)
- (typhosj) Fixed the Calendar option **font color for past days** doing nothing: past days are dimmed with it again, in the month grid and in the day header of the week and day view (reported in the forum)

### 0.3.4 (2026-08-16)

- (typhosj) Fixed the **Min/Max** limit of the Addition buttons: a single bound was always read as the minimum, so a maximum like `50` lifted the state up to 50 on the first press and then counted on without any limit. A single bound is now the end the step runs into — a step up stops at a maximum, a step down at a minimum — while `0;100` keeps bounding both ends. An empty field, and an empty half in `50;`, also stopped acting as a bound of 0, so a button without a limit can count into negative values again (issue #12)
- (typhosj) Fixed every **active** option of the Navigation buttons doing nothing: the variant reads no object, so "active" was always false and label true, active label color, active background, active image and active image color never showed. Active now means the target view is the one on screen, which is what highlights the current page in a navigation bar (issue #11)
- (typhosj) Fixed the button styles `raised` and `unelevated` looking identical: no shadow was drawn at all, and the shadow is the whole difference between them. `raised` now carries the Material elevation and gives up 4 px of its box for it, because VIS 2 clips a widget at its edge — the opening button of the Dialog widgets got the same room, its shadow was drawn but clipped away (issue #11)
- (typhosj) Fixed the chart area background, the card's section background and every tooltip option except "show tooltip" being editor fields the four chart widgets never read: mode, position, colors and fonts now reach chart.js, the Line History tooltip formats its value with the configured decimals and unit, and its points take the line color instead of the translucent fill (issue #10)
- (typhosj) Fixed the fade of the Advanced View widgets never running — the jQuery easing name went straight into CSS and the views were switched through `display`, which cannot animate — and made the `persistent`, `notIfInvisible` and `debug` options of the `8` variant do what they say. The dropped `slowConnection` option only delayed a VIS 1 network path that VIS 2 does not have (issue #9)
- (typhosj) Fixed multi-color SVG icons being flattened to one blue in the Icon List and List widgets: the default item color was applied before the "did the user pick a color?" check, so every SVG was masked. An SVG keeps its own colors now unless a color is chosen explicitly (issue #8)
- (typhosj) Fixed the push button writing its off value on a release the button never saw the press for: a view loading under the pointer, a widget taking focus while a key is down, or a hover followed by a mouse-leave wrote the state with nobody touching the button
- (typhosj) Fixed the Theme Editor's config dialog closing before the runtime state sync finished, which could leave the object tree half migrated; the dialog now waits for the sync to complete before closing, and shows a toast when it finishes without closing
- (typhosj) Fixed the Top App Bar swallowing every click in the empty part of its widget box: the box has to be as tall as the drawer it opens, and the transparent area below the bar blocked the widgets underneath. Only the bar, the drawer and its scrim take clicks now
- (typhosj) Fixed the drawer of the Top App Bar and the Dialog overlay staying behind other widgets whose CSS-general **z-index** was set: their own z-index option could only sort them inside the widget itself. Both now lift the widget while the drawer or the dialog is open
- (typhosj) Fixed the **button style** of the Dialog and Dialog iFrame widgets doing nothing: the opening button was always drawn filled, so `text`, `outlined` and `icon` looked exactly like `raised`. The flat styles now drop the fill and carry the primary color in border and label, `raised` gets its shadow back, and `icon` is round (issue #6)
- (typhosj) Fixed the `text` and `outlined` styles of the button widgets painting their label in the on-primary color (white by default) on a transparent background, which left it invisible; label and border now use the button color
- (typhosj) Fixed every repeating editor group not letting a single entry be added: VIS 2 puts the add, clone and delete buttons on the last of these groups, and all of them hid exactly that one — while typing a number into the matching count field does not rebuild the groups either. That group now shows as an add bar carrying only the buttons and a line naming it, so the count keeps meaning the number of entries. Affected the menu entries of Select, Autocomplete and Top App Bar, the data sets of all four charts, the columns of the Table, the views of Advanced View, Advanced View in Widget and Responsive Layout, and the object list of the multi-state buttons (issue #7)
- (typhosj) Fixed the **+** button of the List and Icon List rows adding a row the runtime never drew: the button counted up a second, hidden index while the widget kept reading "count of list items". Both now use one number, and the hidden index is gone (rows added past the count through that button have to be added once more)
- (typhosj) Fixed the Select and Autocomplete widgets dropping every menu entry that was given a label but no value — which is what the editor stores for a freshly added entry. Such an entry now uses its label as the value written to the object (issue #7)
- (typhosj) Fixed the Select and Autocomplete data method "states of the object" never showing a single entry: the widget read the states from an object cache that VIS 2 does not hand to widgets, so it always saw nothing (issue #7)
- (typhosj) Changed every **count** option to mean what it says: 3 now gives three entries. VIS 1 stored the last index there, so 3 produced four — this affects the data sets of the Bar, Pie and Line History charts, the menu entries of the Top App Bar, the table columns, the select and autocomplete values, the object ids of the multi-state buttons, and the views of Advanced View in Widget and of the responsive layouts. Check the value once when you rebuild such a widget from a VIS 1 project, otherwise its last entry disappears
- (typhosj) Fixed the Select and Autocomplete widgets offering only the first list entry in the editor: the item group carried the fields of entry 0 instead of repeating per entry, so a "number of select values" above 1 had nowhere to be filled in
- (typhosj) Fixed the per-data-set options of the Bar, Pie and Line History charts being editable only for the first data set: bar color, label, value text, tooltip text — and the per-series line and y-axis settings of the Line History chart — appeared once instead of once per data set, so a chart with several data sets could not be styled per series like in VIS 1. Each data set now has one group holding its object id and all of its options; existing charts keep every saved value (reported in the forum)
- (typhosj) Fixed the icon picker showing only the first 400 of the 6809 icons with no way to reach the rest — the grid ends there and neither scrolling nor paging went further, so an icon whose name you did not know was unreachable. The grid now keeps loading while you scroll (issue #4)
- (typhosj) Documented how the Top App Bar switches views — it writes the selected menu index into its object id, and an [Advanced View in Widget 8](doc/en/widgets/html-widgets.md) with the same object id shows the matching view (reported in the forum)

### 0.3.3 (2026-07-24)

- (typhosj) Fixed the Theme Editor's runtime state sync: it never created the intermediate channel objects for nested color/font states, used the "value" role (number-only) for string values, and could leave font-size states with a stale string/number type mismatch
- (typhosj) Removed the "mocha" devDependency; it is already provided by `@iobroker/testing`

### 0.3.2 (2026-07-24)

- (typhosj) Fixed the "npm run test:package" CI check to run the standard `@iobroker/testing` package-file validation again (it was shadowed by a project-specific script of the same name)
- (typhosj) Removed the unused `axios` devDependency

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

[Older changelog entries](CHANGELOG_OLD.md)

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
