# Alerts

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/alerts.md)

Displays a JSON alert queue as Material Design notices. Alerts can be closed and
the updated queue is written back to the state. Template id:
`tplVis2-materialdesign-Alerts`.

<img src="../../media/vis2_alerts_runtime.png" alt="Material Design alerts in VIS 2">

## Editor settings

The screenshot shows the **Common** and **layout** groups expanded. Settings not
listed below are self-explanatory. The editor UI follows the ioBroker system
language, so the screenshots are German.

<img src="../../media/vis2_alerts_editor_overview.png" width="340" alt="Alerts general and layout options">

**Common**

- **object id** – state holding the JSON alert array.
- **show max alerts** – how many alerts are shown at once, default 3. Empty or
  `0` shows every alert in the queue (100 at most).
- **hide below screen width [px]** – hides the widget below this screen width.
  The rule applies to this widget only, so several alerts widgets in one view can use different widths.

**layout**

- **layout** – `normal`, `outlined` or `tile`. The values are untranslated in
  the editor: `outlined` draws a border instead of a filled surface, `tile`
  removes the rounded corners.
- **slim / shadow / distance between alerts** – compactness (on by default),
  shadow depth 0–24 and the gap below each alert in pixels.
- **frame** – on which side each alert gets the 6 px colored stripe from
  `borderColor`: none, top, right, left or bottom.
- **icon close** / **icon close color** / **icon close color hover / selected** –
  the dismiss icon, its color and the color while it is held down. Closing
  removes the alert from the state.

```json
[
    {
        "text": "Window is open",
        "icon": "alert-outline",
        "backgroundColor": "#fff8e1",
        "borderColor": "#ffc107",
        "iconColor": "#ffc107",
        "fontColor": "#333333"
    }
]
```

Every property is optional. `text` may contain HTML (`<b>`, `<br>`, links);
scripts and event attributes are stripped before it is shown. `borderColor`
only has an effect while **frame** is not set to `none`.

The state must contain a JSON array. Invalid JSON is shown as an error in the
widget. An empty state shows nothing at all.

## Design style

The **Classic** (left) and **Material 3** (right) style side by side, see
[Design style](../README.md#design-style): the normal, outlined, tile and dense
layouts and an alert without the border stripe.

<img src="../../media/vis2_alerts_styles.png" alt="Alerts in the Classic and the Material 3 style">

The same widgets with the dark theme switched on:

<img src="../../media/vis2_alerts_styles_dark.png" alt="Alerts in the Classic and the Material 3 style, dark theme">
