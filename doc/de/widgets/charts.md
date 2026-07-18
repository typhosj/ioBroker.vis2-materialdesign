# Diagramme

[Zurück zur README](../../../README.md#widget-documentation)

Vier native VIS-2-Diagramme: Balken, Kreis, JSON und Linienverlauf.

Template-IDs: `tplVis2-materialdesign-Chart-Bar`, `-Pie`, `-JSON` und
`-Line-History`.

<img src="../../media/vis2_charts_runtime.png" alt="Material-Design-Diagramme in VIS 2">

## Editor-Einstellungen

<table>
<tr><td><img src="../../media/vis2_charts_editor_overview.png" width="300"></td>
<td><ul><li><b>Bar/Pie:</b> indizierte State-Datensätze, Texte und Farben.</li><li><b>JSON:</b> liest Labels und Datensätze aus einem JSON-State.</li><li><b>Line History:</b> History-Instanz, Zeitraum, Aggregation und Aktualisierung je State.</li><li>Legende, Achsen, Tooltip, Animation und Farben liegen in eigenen Gruppen.</li></ul></td></tr>
</table>

```json
{ "axisLabels": ["Mo", "Di", "Mi"], "graphs": [{ "legendText": "Leistung", "color": "#44739e", "data": [2, 5, 3] }] }
```
