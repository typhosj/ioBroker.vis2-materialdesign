# List

[Back to README](../../../README.md#widget-documentation)

A configurable VIS 2 list with text rows, buttons, switches or checkboxes.
Rows can come from indexed editor fields or a JSON state. Template id:
`tplVis2-materialdesign-List`.

<img src="../../media/vis2_list_runtime.png" alt="Material Design list in VIS 2">

## Editor settings

<table>
<tr><td><img src="../../media/vis2_list_editor_overview.png" width="300"></td>
<td><ul><li><b>list type:</b> text, state/toggle/navigation/link button, switch or checkbox.</li><li><b>data method:</b> editor entries or JSON object state.</li><li><b>list layout:</b> standard, card or outlined card.</li><li><b>Entries:</b> object id, labels, icon, action and divider per indexed row.</li></ul></td></tr>
</table>

Minimal JSON example:

```json
[{ "objectId": "0_userdata.0.light", "text": "Light", "subText": "Living room", "image": "lightbulb" }]
```
