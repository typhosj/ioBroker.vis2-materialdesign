# Calendar

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/calendar.md)

A native VIS 2 month, week and day calendar driven by a JSON event state.
Template id: `tplVis2-materialdesign-Calendar`.

<img src="../../media/vis2_calendar_runtime.png" alt="Material Design calendar in VIS 2">

Week/day view with time axis:

<img src="../../media/vis2_calendar_runtime_week.png" alt="Material Design calendar – week view" width="600">

## Editor settings

The screenshots show the general/layout groups and the event/date-format groups.
Settings not listed below are self-explanatory. The editor UI follows the
ioBroker system language, so the screenshots are German.

<img src="../../media/vis2_calendar_editor_overview.png" width="340" alt="Calendar general and layout options">

**General**

- **object id** – state with the JSON event array.
- **calendar view** – month, week or day.

**Layout**

- **weekdays / short weekdays** – full or abbreviated weekday names.
- **border / day background colors** – grid and day-cell colors.

Event display and date formats have their own groups:

<img src="../../media/vis2_calendar_editor_2.png" width="340" alt="Calendar event and date-format options">

- **event overlap mode** – how simultaneous events are arranged (stack or side by side).
- **event height / fonts** – size and typography of events.
- **custom date formats** – per-view header and day format strings using date tokens (e.g. `dddd`, `D. MMMM`).

The header, week-number, controls and time-axis layout groups style the
remaining calendar chrome.

```json
[
    {
        "start": "2026-07-18T10:00:00",
        "end": "2026-07-18T11:00:00",
        "name": "Meeting",
        "color": "#44739e",
        "colorText": "#ffffff"
    }
]
```

The state must contain a JSON array.
