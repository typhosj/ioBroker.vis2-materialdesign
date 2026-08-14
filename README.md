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

Every widget ships two presentations, selected per widget in the editor under
**General → design style**:

- **Classic** (default): the established Material Design 2-era look. Unchanged,
  and what every existing and every newly inserted widget uses.
- **Material 3**: Material 3 color roles, shape, type and state layers.
- **Project default**: follows the default style set in the adapter's **Design**
  tab, for switching a whole project at once.

Material 3 changes presentation only. Component IDs, option names, object IDs,
state values, write behaviour, timers and navigation are identical in both
modes, so switching a widget back and forth never changes what it does.

### Switching an existing project

1. Select a widget, open **General → design style** and pick `Material 3`.
2. Any color, font or size you explicitly configured still wins — Material 3
   only fills in the values you left empty. To let a widget follow the Material 3
   palette, clear those fields.
3. Switch widget by widget and check the result, or set the default style in the
   adapter's Design tab and leave the widgets on `Project default`; a saved
   project is never converted implicitly.
4. Setting the style back to `Classic` restores the old look exactly.

Dark mode follows the same `vis2-materialdesign.0.colors.darkTheme` state the
classic widgets already use. The adapter's Design tab takes **one seed color** and
derives the complete Material 3 scheme from it — all 18 roles, light and dark,
with every `on-*` pair — into `vis2-materialdesign.0.colors.md3Scheme`, which the
widgets read. Leave the seed empty and you get Google's contrast-verified
Material 3 baseline palette.

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

Feedback on the Material 3 style — how it looks and feels next to what you know
from the original adapter, not only what crashes — has its own form:
[Material 3 beta feedback](https://github.com/typhosj/ioBroker.vis2-materialdesign/issues/new?template=material3_beta_feedback.md).
Material 3 stays opt-in per widget while the beta runs, so nothing you report is
a reason to wait with an upgrade.

## Changelog
### **WORK IN PROGRESS**

- (typhosj) Added a second design style, **Material 3**, selectable per widget under General → design style, plus **Project default** for switching a whole project from the adapter's new **Design** tab. Classic stays the default for every existing and every newly inserted widget, and switching back restores the old look exactly — the style changes presentation only, never component ids, option names, object ids, values, write behaviour, timers or navigation
- (typhosj) Added the Material 3 color system: one seed color in the **Design** tab derives the complete scheme — all 18 roles, light and dark, with every `on-*` and `-container` pair — into `vis2-materialdesign.0.colors.md3Scheme`, which the widgets read. Leaving the seed empty gives Google's contrast-verified baseline palette. The color math runs once per save in the admin, never in the widget runtime
- (typhosj) Added the Material 3 type scale, shape scale and component geometry, and the static half of Material 3 Expressive (state layers, elevation, corner and motion tokens). A size, color or font you set explicitly still wins in both styles — Material 3 only fills in the values you left empty
- (typhosj) Added **Material Symbols Outlined** as an opt-in second icon source next to Material Design Icons. Pick it in any icon field with the **Symbols** button; names are stored with an `ms-` prefix. Both fonts are self-hosted and a panel downloads one only when a glyph from it is actually drawn
- (typhosj) Added a **show advanced options** switch to every widget, right below the design style: it hides the rarely used option groups so the editor opens on what a widget is normally configured with. A widget that already carries advanced values keeps showing them without the switch
- (typhosj) Migrated the charts from Chart.js 2.9.4 to 4.5.1. Existing chart configurations keep their option names and values
- (typhosj) Reworked accessibility: keyboard semantics and accessible names for clickable cards, icon lists, table headers and the alert close button, and measured contrast plus WCAG 2.5.8 target sizes for the Material 3 controls
- (typhosj) Fixed the third option of every "alignment" dropdown reading "rechts" in all eleven languages — including English, Spanish, French, Italian, Polish and Portuguese. The three options now use the same wording as the existing left/center/right values
- (typhosj) Replaced 94 Ukrainian editor labels that were not translations but shouted English ("CENTER", "DATAPOINT", "ROTATE 90 DEGRESS"), and translated the remaining English labels in the other nine languages — about 600 entries in total
- (typhosj) Fixed the Icon List's "sub label font color selected" dark-mode color being stored under the light-mode object id: the dark value overwrote the light one and the dark state was never created. A dark override saved for this one color has to be set once more
- (typhosj) Fixed the adapter description shown in the ioBroker admin adapter list still describing the VIS 1 adapter ("vuetify, chartjs, material components web library") in eight languages
- (typhosj) Fixed the Theme Editor rewriting several hundred objects on the next save after the admin language was switched
- (typhosj) Updated Material Design Icons from 6.9.96 to 7.4.47: 671 new icons, 7447 in total. Twenty names were retired upstream and no longer render — `android-messages`, `book-variant-multiple`, `desktop-mac`, `desktop-mac-dashboard`, `discord`, `email-receive`, `email-receive-outline`, `email-send`, `email-send-outline`, `format-textdirection-l-to-r`, `format-textdirection-r-to-l`, `google-controller`, `google-controller-off`, `google-home`, `lecturn`, `tablet-android`, `text-to-speech`, `text-to-speech-off`, `timeline-help` and `timeline-help-outline`. Pick a replacement from the icon picker where one of them was used
- (typhosj) Updated the admin UI framework (`@iobroker/adapter-react-v5` 8.3.2) and the two bundled webfont packages
- (typhosj) Translated the plain-language values of the widget dropdowns (on/off, none, contains, exists, left/right/top/bottom, 12 h / 24 h and others) in all 11 languages; the documented Material and chart.js variant names (filled, tonal, outlined, pie, doughnut, standard, dense, …) stay verbatim so the editor keeps matching the documentation
- (typhosj) Added the missing translations for 42 widget options that showed their raw key in the editor (fade-in/out duration, fade effect, scrolling, pre-rendering, tick source and others), in all 11 languages
- (typhosj) Fixed the "use card" option of all four charts cutting the card off: the card filled the widget box, so its shadow and rounded edge sat outside the area VIS 2 draws
- (typhosj) Added the hint text and the entry counter to the Select and Autocomplete widgets: both options sat in the editor without any effect. The hint follows "show input message always" — off, it only appears while the list is open; the counter shows the number of entries and is opt-in (its editor default claimed otherwise)
- (typhosj) Fixed the Table widget drawing a divider under the LAST row, which stuck out over the rounded edge of the card layouts
- (typhosj) Fixed the calendar day button being cut off in the week and day view: it was a fixed 56 px circle, and now fits the column width (Material 3: 40 px)
- (typhosj) Fixed the List widget's "card" and "card outlined" layouts losing their shadow and border: the card filled the widget box edge to edge and VIS 2 clips there
- (typhosj) Fixed the Table widget's "card" and "card outlined" layouts rendering exactly like "standard": the layouts only set a class, whose styling lived in the removed VIS 1 stylesheet
- (typhosj) Fixed the Material 3 elevated button (normal and vertical) losing its drop shadow: the button filled the widget box edge to edge and VIS 2 clips there, so the shadow was cut off on all four sides
- (typhosj) Fixed the doughnut chart placing its value labels outside the colored ring; they now sit in the middle of the ring (a saved "value position align" still wins)
- (typhosj) Fixed the Round Slider drawing nothing at all with `arcLength: 360`: a full turn puts the arc's start and end on the same point, which SVG renders as an empty path
- (typhosj) Fixed the Card widget's "Horizontal" layout: it had no styling at all, so the image collapsed to zero height and title and text stacked below an empty square instead of sitting beside the image
- (typhosj) Fixed the Bar and Line History charts cutting off their bottom axis and legend when "use card" is on: the chart kept the full card height and the card title pushed it out of the widget
- (typhosj) Added an alternating row color to the Table widget, so every second row can carry its own background (upstream wish #127)
- (typhosj) Added background color, border color, border width and corner radius for the value labels of the Bar, Pie and Line History charts (upstream wish #68)
- (typhosj) Fixed the Line History chart never drawing its value labels: the widget's per-series "show values" options had no effect at all, and now format the point value with the configured decimals and append text. A chart that never set the option shows labels again, as it does in the original adapter
- (typhosj) Fixed the Theme Editor's config dialog closing before the runtime state sync finished, which could leave the object tree half migrated; the dialog now waits for the sync to complete before closing, and shows a toast when it finishes without closing
- (typhosj) Fixed the Top App Bar swallowing every click in the empty part of its widget box: the box has to be as tall as the drawer it opens, and the transparent area below the bar blocked the widgets underneath. Only the bar, the drawer and its scrim take clicks now
- (typhosj) Fixed the drawer of the Top App Bar and the Dialog overlay staying behind other widgets whose CSS-general **z-index** was set: their own z-index option could only sort them inside the widget itself. Both now lift the widget while the drawer or the dialog is open
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
