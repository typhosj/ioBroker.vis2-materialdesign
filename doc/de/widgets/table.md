# Tabelle

[Zurück zur README](../../../README.md#widget-documentation)

Native VIS-2-Tabelle für JSON-Zeilen mit konfigurierbaren indizierten Spalten.
Template-ID: `tplVis2-materialdesign-Table`.

<img src="../../media/vis2_table_runtime.png" alt="Material-Design-Tabelle in VIS 2">

## Editor-Einstellungen

<table>
<tr><td><img src="../../media/vis2_table_editor_overview.png" width="300"></td>
<td><ul><li><b>oid/Daten-JSON:</b> JSON-Array aus State oder direktem Text.</li><li><b>Spaltenanzahl:</b> erzeugt indizierte Spaltengruppen.</li><li>Pro Spalte Beschriftung, Sortierschlüssel, Text oder Bild, Breite und Ausrichtung. Die Anzeige folgt der JSON-Eigenschaftsreihenfolge.</li><li>Standard-, Karten- oder umrandetes Kartenlayout wählen.</li></ul></td></tr>
</table>

```json
[{ "geraet": "Temperatur", "raum": "Wohnzimmer", "wert": "22,4 °C" }]
```

In jeder Zeile dieselbe JSON-Eigenschaftsreihenfolge verwenden.
