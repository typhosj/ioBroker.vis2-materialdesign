![Logo](admin/vis-materialdesign.png)
<!-- omit in toc -->
# ioBroker.vis-materialdesign

![stable version](http://iobroker.live/badges/vis-materialdesign.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.vis-materialdesign.svg)](https://www.npmjs.com/package/iobroker.vis-materialdesign)
[![Number of Installations](http://iobroker.live/badges/vis-materialdesign-installed.svg)](https://www.npmjs.com/package/ioBroker.vis-materialdesign)
[![Downloads](https://img.shields.io/npm/dm/iobroker.vis-materialdesign.svg)](https://www.npmjs.com/package/ioBroker.vis-materialdesign)

[![NPM](https://nodei.co/npm/iobroker.vis-materialdesign.png?downloads=true)](https://nodei.co/npm/iobroker.vis-materialdesign/)

<!-- omit in toc -->
## Material Design Widgets for IoBroker VIS
[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=VWAXSTS634G88&source=url)


ioBroker Material Design Widgets are based on [Google's material design guidelines](https://material.io/design/)

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

### Online Example Project
provided by [iobroker.click](https://iobroker.click/index.html), thanks to bluefox and iobroker.

* <a href="https://iobroker.click/vis/index.html?Material%20Design%20Widgets" target="_blank">VIS Runtime</a> (<a href="http://iobroker.click:8082/vis/index.html?Material%20Design%20Widgets" target="_blank">alternativ</a>)
* <a href="https://iobroker.click/vis/edit.html?Material%20Design%20Widgets" target="_blank">VIS Editor</a> (<a href="http://iobroker.click:8082/vis/edit.html?Material%20Design%20Widgets" target="_blank">alternativ</a>)

### Practical examples
* [Weather View](https://forum.iobroker.net/topic/32232/material-design-widgets-wetter-view)
* [Skript Status](https://forum.iobroker.net/topic/30662/material-design-widgets-skript-status)
* [Adapter Status](https://forum.iobroker.net/topic/30661/material-design-widgets-adapter-status)
* [UniFi Netzwerk Status](https://github.com/typhosj/ioBroker.vis-materialdesign/tree/master/examples/UnifiNetworkState)

### Questions and answers about the widgets
If you have questions about the individual widgets, then first look at the topics of the individual widgets

* [German threads](https://forum.iobroker.net/search?term=Material%20Design%20Widgets%3A&in=titles&matchWords=all&by%5B%5D=Scrounger&categories%5B%5D=7&sortBy=topic.title&sortDirection=desc&showAs=topics)

### Supported Browser
I officially support the last two versions of every major browser. Specifically, i test on the following browsers:
* Firefox on Windows and Linux
* Chrome on Android, Windows, and Linux

### Supported Browser for vibrate on mobil devices function
https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate

### ioBroker VIS App
latest version needs to be implemented by the app, see https://github.com/ioBroker/ioBroker.vis.cordova.
I do not use the app and do not test on it either

## Adapter settings

Starting with version 0.4.0 there is a settings page for the adapter. You can find it under Instances in the user interface of the admin adapter

### General
![Logo](doc/en/media/settings_general.png)

| setting                | description                                                                                                                                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documentation          | Links to documentation to help you configure the widgets                                                                                                                                                                                                                   |
| Generate global script | Create a global script for the [Javascript Script Engine](https://github.com/ioBroker/ioBroker.javascript) with all theme data points. This allows to use colors, fonts and font sizes comfortably in scripts.                                                             |
| Sentry                 | use Sentry libraries to automatically report exceptions and code errors anonymously to the developers. For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! |

### Theme Editor

With the help of the Theme Editor you can centrally set colors, fonts and font sizes for all widgets via the adapter settings. For each widget datapoints (see screenshot below) are created with the set values. This makes it also possible to use these settings in other widgets (not Material Design Widgets) via bindings.

#### Datapoint structure

![Logo](doc/en/media/settings_datapoints.png)

#### Theme Settings

![Logo](doc/en/media/settings_colors_light.png)

Every settings page for colors, colors dark, font and font sizes look likes show in the screenshot above.

Standard colors / fonts /font sizes can be defined in the upper area. These standard colors / fonts /font sizes can then be assigned to the individual widgets using the buttons in the table. If you change the default colors / fonts /font sizes, it will also change for all widgets that use this colors / fonts /font sizes.
Additionally, it is possible to assign your own colors / fonts /font sizes to the widgets, independent of the standard colors.

For colors there are two themes - light theme and dark theme. With the datapoint `vis-materialdesign.0.colors.darkTheme` you can switch between the two themes. For example this datapoint can be used in a script to switch between lights and dark colors on sunrise and sunset. 

#### VIS Editor (Restore / update old Widgets)

![Logo](doc/en/media/vis_editor_theme_restore.gif)

In the VIS Editor you will find a button `use theme` for each widget. With this button you can reset the widgets to the use of the themes. That means if you have changed colors, fonts or font sizes, you can reset them with this button.

With the help of this button it is also possible to update your widgets from versions before 0.4.0 to use the themes.

#### Change Datapoint Binding for Material Design Widgets

![Logo](doc/en/media/settings_mdw_binding.gif)

If you would like to change the using of others colors that are defined for other widgets, you can copy the datapoint binding by pressing the button with the material design icon. Just paste this in any color, fonts or font sizes field of a material design widget. For example a color "state binding" looks like `#mdwTheme:vis-materialdesign.0.colors.card.background`

#### Use Binding for non Material Design Widgets

![Logo](doc/en/media/settings_binding.gif)

In the adapter settings you can copy the binding command to the clipboard by clicking on the button with iobroker icon. This binding can then be used by copy and paste even for non Material Design Widgets. For example a color binding looks like `{mode:vis-materialdesign.0.colors.darkTheme;light:vis-materialdesign.0.colors.light.card.background;dark:vis-materialdesign.0.colors.dark.card.background; mode === "true" ? dark : light}`

## Widget documentation

Detailed widget documentation was moved to separate files:

- [Material Design Icons and Images](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/material-design-icons-and-images.md)
- [Buttons](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/buttons.md)
- [Buttons Vertical](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/buttons-vertical.md)
- [Icon Buttons](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/icon-buttons.md)
- [Checkbox](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/checkbox.md)
- [Switch](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/switch.md)
- [Value](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/value.md)
- [HTML Card](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/html-card.md)
- [List](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/list.md)
- [IconList](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/iconlist.md)
- [Progress](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/progress.md)
- [Progress Circular](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/progress-circular.md)
- [Slider](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/slider.md)
- [Slider Round](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/slider-round.md)
- [Input](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/input.md)
- [Top App Bar](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/top-app-bar.md)
- [Charts](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/charts.md)
- [Table](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/table.md)
- [Responsive Layout](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/responsive-layout.md)
- [Alerts](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/alerts.md)
- [Calendar](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/calendar.md)
- [Dialog](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/dialog.md)
- [HTML Widgets](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/html-widgets.md)

Full index: [doc/en/widgets/README.md](https://github.com/typhosj/ioBroker.vis-materialdesign/tree/master/doc/en/widgets)

## Informations

### used libraries
The adapter uses the following libraries:
* [Google material components for the web](https://github.com/material-components/material-components-web)
* [Vuetify](https://github.com/vuetifyjs/vuetify)
* [chartjs](https://www.chartjs.org/)
* [round-slider from thomasloven](https://github.com/thomasloven/round-slider)
* [Material Design Icons](https://materialdesignicons.com/)


## Changelog
### 0.5.10 (2026-07-01)
* Calendar Widget improved for VIS2: content loads immediately on open and no error is shown on first open
* (Scrounger) JSON Chart Widget: method to use css color variables added
* (Scrounger) Pie Chart Widget: method to use css color variables added
* (Scrounger) Bar Chart Widget: method to use css color variables added
* (Scrounger) IconList Widget: sub text color activ added
* (Scrounger) css default color variables added
* (Scrounger) Icon Button Slider Widget added
* (Scrounger) Button Toggle Widgets: bug fix for state on runtime load
* (Scrounger) Value Widget: bug fix for show unit only if result is of type number
* (Scrounger) Value Widget: bug fix for data ovveride
* (Scrounger) IconList Widget: option to set minimal width for single item added
* (Scrounger) IconList Widget: header added
* (Scrounger) IconList Widget: color options added
* (Scrounger) IconList Widget: added option for color and text of status bar if state is active
* (Scrounger) List Widget: main header added
* (Scrounger) List Widget: events bug fix
* (darkiop) documentation updated ([#PR179](https://github.com/typhosj/ioBroker.vis-materialdesign/pull/179))
* (Scrounger) Top App Bar Widget: fixed bugs found by sentry
* (Scrounger) Top App Bar Widget: icon color bug fix if using json string
* (Scrounger) Top App Bar Widget: selected item icon color option added
* (Scrounger) Round Slider Widget: control bug fix
* (Scrounger) Grid Views Widget: Bug fix for nested grid views widgets
* (Scrounger) Masonry Views Widget: Bug fix for nested masonry views widgets
* (Scrounger) Progress Widget: striped distance option added
* (Scrounger) Advanced View in Widget widget added
* (Scrounger) Advanced View in Widget 8 widget added
* (Scrounger) Dialog Widget: background color bug fix on close animation
* (Scrounger) Dialog Widget: option added to show a save button and write a value to a datapoint
* (Scrounger) HTML Widget: bug fix for wrong type ([#182](https://github.com/typhosj/ioBroker.vis-materialdesign/issues/182))
* (Scrounger) support for base64 images added
* (Scrounger) Material Design Icons updated to v6.6.96
* (Scrounger) bug fix for VIS Editor dev values

<!-- omit in toc -->
### 0.5.9 (2021-06-13)
* (Scrounger) Top App Bar Widget: option added to define navigation items per JSON String [Details see documentation!](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/top-app-bar.md)
* (Scrounger) Top App Bar Widget: option added to define an id per item
* (Scrounger) fixed bugs found by sentry

<!-- omit in toc -->
### 0.5.8 (2021-06-09)
* (Scrounger) Top App Bar Widget: new layout 'auto' added - change between modal and permanent layout depending on screen resolution. [Details see documentation!](https://github.com/typhosj/ioBroker.vis-materialdesign/blob/master/doc/en/widgets/top-app-bar.md#layout-auto)
* (Scrounger) Top App Bar Widget: option added to set value on click at item that toggle submenu
* (Scrounger) IconList Widget: option added to set used space per row for every items
* (Scrounger) IconList Widget: option added to set visibility condition for every items ([#118](https://github.com/typhosj/ioBroker.vis-materialdesign/issues/118))
* (Scrounger) IconList Widget: bug fix for applying active color ([#176](https://github.com/typhosj/ioBroker.vis-materialdesign/issues/176))
* (Scrounger) Grid Widget: bug fix for visibility condition
* (Scrounger) Masonry Widget: bug fix for visibility condition

<!-- omit in toc -->
### 0.5.7 (2021-05-26)
* (Scrounger) Top App Bar Widget: color option for menu icon added ([#171](https://github.com/typhosj/ioBroker.vis-materialdesign/issues/171))
* (Scrounger) Top App Bar Widget: Permission group - option to deactivate default value added ([#173](https://github.com/typhosj/ioBroker.vis-materialdesign/issues/173))
* (Scrounger) iconList Widget: bug fix for active state at diffrent types ([#168](https://github.com/typhosj/ioBroker.vis-materialdesign/issues/168))
* (Scrounger) iconList Widget: layout bug fix for radius of buttons ([#174](https://github.com/typhosj/ioBroker.vis-materialdesign/issues/174))
* (Scrounger) list Widget: bug fix for theme properties
* (Scrounger) select Widget: bug fix for long text ([#169](https://github.com/typhosj/ioBroker.vis-materialdesign/issues/169))
* (Scrounger) fixed bugs found by sentry

<!-- omit in toc -->
### 0.5.6 (2021-05-07)
* (Scrounger) Html Widgets: escaping bug fix
* (Scrounger) iconList: layout bug fix

<!-- omit in toc -->
### 0.5.5 (2021-04-21)
* (Scrounger) adapter settings bug fixes
* (Scrounger) icon buttons: color bug fixes
* (Scrounger) Fixing bugs found by sentry

Older changelog entries are available in [CHANGELOG_OLD.md](CHANGELOG_OLD.md).

<!-- omit in toc -->
## License
MIT License

Copyright (c) 2021-2026 Scrounger <scrounger@gmx.net>

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
