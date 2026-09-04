# Advanced View in Widget

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/html-widgets.md)

A child-view container that embeds complete VIS 2 views and selects one from a
state.

Template ids: `tplVis2-materialdesign-view-in-widget` and
`tplVis2-materialdesign-view-in-widget8`.

<img src="../../media/vis2_html_widgets_runtime.png" alt="Embedded VIS 2 view">

## Editor settings

The screenshot shows the **Common** group. Settings not listed below are
self-explanatory. The editor UI follows the ioBroker system language, so the
screenshots are German.

<img src="../../media/vis2_html_widgets_editor_overview.png" width="340" alt="Advanced view in widget general options">

**Common**

- **Object ID** – the state whose value selects the embedded view. For
  `view-in-widget` the value is the view **name** (string, exactly as in the
  editor); for `view-in-widget8` it is the **index** `0 … n` of the views
  configured below (number, `true`/`false` count as `1`/`0`).
- **fade-in duration [ms] / fade-out duration [ms]** – transition when switching
  between views, 50 ms each by default.

`view-in-widget` only (the view comes from the state value):

- **fade effect** – `swing` (default) or `linear`; both are untranslated values
  in the editor.
- **render all views** together with **views rendered on load** keeps further
  views mounted in advance: the number opens that many **view** fields in the
  **pre-rendering:** group. Without the switch the list has no effect and only
  the selected view is mounted.
- **hide error message** – suppresses "error: view not found." when the state
  points at no view; the widget simply stays empty.

`view-in-widget8` only (the view comes from a list):

- **number of views** – how many **view** fields the **views:** group opens. The
  state value is the index into exactly that list.
- **keep loaded** – all configured views stay mounted, which makes switching
  instant. Without it only the selected view is rendered.
- **not while invisible** – while the widget is hidden its views are dropped
  instead of kept running in the background.

Use [Responsive Layout](responsive-layout.md) instead when multiple child views
must be arranged at the same time.

The state that selects the view usually comes from a menu: the
[Top App Bar](top-app-bar.md) writes the index of the selected menu entry, and
the `8` variant shows the matching view.
