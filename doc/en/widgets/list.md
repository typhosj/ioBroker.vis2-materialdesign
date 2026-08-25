# List

[User guide](../README.md) › [Widget catalog](README.md) · [Deutsch](../../de/widgets/list.md)

A configurable VIS 2 list with text rows, buttons, switches or checkboxes.
Rows can come from indexed editor fields or a JSON state. Template id:
`tplVis2-materialdesign-List`.

<img src="../../media/vis2_list_runtime.png" alt="Material Design list in VIS 2">

## Editor settings

The screenshots show the list-wide groups and one indexed row entry. Settings not
listed below are self-explanatory. The editor UI follows the ioBroker system
language, so the screenshots are German.

<img src="../../media/vis2_list_editor_overview.png" width="340" alt="List layout and data options">

**List layout**

- **list type** – text row, state / toggle / navigation / link button, switch or checkbox.
- **list layout** – standard, card or outlined card.
- **divider style** – separator drawn between rows.
- **scroll to top on change** – jumps back to the first row whenever the rows change, instead of keeping the old scroll position under new content.

**List item layout**

- **position of control** – whether the button, switch or checkbox sits left or right of the row text; **distance between control and text** sets the gap.

**List header**

- **position of headline image** – where the header image sits relative to the header text; **distance between headline text and image** sets the gap between them.

**Data of the list**

- **data method** – indexed editor entries or a JSON object state.
- **number of entries** – how many indexed row groups exist (editor method).

Each row is configured in its own indexed **List item [n]** group:

<img src="../../media/vis2_list_editor_2.png" width="340" alt="Indexed list item entry">

- **object id** – state shown/controlled by the row.
- **label / subLabel / right label** – primary, secondary and right-aligned text.
- **icon + active color** – row icon and its on-state color.
- **button / toggle values** – the value(s) written by the button/toggle list types.

The **Colors** group additionally holds **list item selected color** for the
focused row and **hover color of switch** for the switch under the pointer.

Minimal JSON example:

```json
[{ "objectId": "0_userdata.0.light", "text": "Light", "subText": "Living room", "image": "lightbulb" }]
```
