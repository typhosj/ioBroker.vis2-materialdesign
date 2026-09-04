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

**Common**

- **Object ID** – state with the JSON event array.
- **calendar view** – `month`, `week` or `day`.

**layout**

- **days of the week to be shown** – comma-separated weekday numbers, 0 = Sunday
  through 6 = Saturday. Their order is the display order too, so the default
  `1,2,3,4,5,6,0` starts on Monday. `1,2,3,4,5` hides the weekend.
- **show short names for weekdays** – `Mon` instead of `Monday`.
- **border color / background color / background color for other months** – grid
  and day cells; the last one applies to the days the month grid borrows from the
  previous or next month.

Event display and date formats have their own groups:

<img src="../../media/vis2_calendar_editor_2.png" width="340" alt="Calendar event and date-format options">

**appointment layout**

- **mode overlap** – how simultaneous events are arranged in the week and day
  view: `column` splits the width between them, `stack` offsets them on top of
  each other. Month view lists events below each other anyway, so the setting has
  no effect there.
- **height** – height of an event, plus font size and font family of the events.

**custom date formats**

- Per view a format for the **header** and the **day**, using date tokens (e.g.
  `dddd`, `D. MMMM`). Left empty the locale format applies.

**time axis layout** (week and day view only)

- **start hour / end hour** – the shown slice of the day.
- **interval in minutes** – spacing of the grid lines, e.g. 30 or 60.
- **show short intervals as text** – switched off, only full hours are labelled.
- **time format** – `locale`, `24h` or `12h`.
- **show current time / current time color** – a line on the current time, moved
  on every minute.
- **background color / heading background color** – the first colors the time
  column, the second the cell above it; together the whole column.

**calendar weeks layout**

- **show calendar week** – a week-number column on the left in month view, and
  the week number in the corner above the time axis in the week and day view;
  font and color come from the same group.

**calendar buttons layout**

- **month view: go to / week view: go to / day view: go to** – clicking the day
  number switches to the configured view and takes the clicked day with it.

**control layout**

- **display control** – the bar with previous/next, today and the view picker.
- **control layout** – `text`, `raised`, `unelevated` or `outlined`.
- **alignment** – `stretch`, `left`, `right` or `center`.
- **show labels** – switched off, only the icons remain.

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

## ical adapter

The state `ical.0.data.table` can be used directly. The widget reads the field
names of the ical adapter (`event`, `_date`, `_end`, `_allDay`, `_calColor`)
next to the format above and converts its UTC timestamps to local time. All-day
events arrive from there with an exclusive end — the last day is not counted, the
same as in the calendar itself.

## Design style

The **Classic** (left) and **Material 3** (right) style side by side, see
[Design style](../README.md#design-style): the month view with and without week
numbers, the week and day view, outlined controls and the calendar without
controls.

<img src="../../media/vis2_calendar_styles.png" alt="Calendar in the Classic and the Material 3 style">

The same widgets with the dark theme switched on:

<img src="../../media/vis2_calendar_styles_dark.png" alt="Calendar in the Classic and the Material 3 style, dark theme">
