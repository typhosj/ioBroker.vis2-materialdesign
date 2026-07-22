# Alerts

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/alerts.md)

Displays a JSON alert queue as Material Design notices. Alerts can be closed and
the updated queue is written back to the state. Template id:
`tplVis2-materialdesign-Alerts`.

<img src="../../media/vis2_alerts_runtime.png" alt="Material Design alerts in VIS 2">

## Editor settings

The screenshot shows the **General** and **Layout** groups expanded. Settings not
listed below are self-explanatory. The editor UI follows the ioBroker system
language, so the screenshots are German.

<img src="../../media/vis2_alerts_editor_overview.png" width="340" alt="Alerts general and layout options">

**General**

- **object id** – state holding the JSON alert array.
- **max alerts** – how many alerts are shown at once.
- **min screen resolution** – hides the widget below this screen width.

**Layout**

- **layout** – normal, outlined or tile.
- **dense / elevation / margin bottom** – compactness, shadow depth and spacing between alerts.
- **border layout** – border style of each alert.
- **close icon / color** – the dismiss icon and its color; closing removes the alert from the state.

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

The state must contain a JSON array. Invalid JSON is shown as an error in the widget.
