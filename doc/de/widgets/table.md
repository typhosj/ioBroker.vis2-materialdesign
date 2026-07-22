# Tabelle

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/table.md)

Native VIS-2-Tabelle für JSON-Zeilen mit konfigurierbaren indizierten Spalten.
Template-ID: `tplVis2-materialdesign-Table`.

<img src="../../media/vis2_table_runtime.png" alt="Material-Design-Tabelle in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen die Allgemein-/Layout-Gruppen und eine indizierte Spalte.
Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_table_editor_overview.png" width="340" alt="Tabelle Allgemein und Layout">

**Allgemein**

- **oid / Daten-JSON** – ein JSON-Array aus einem State oder direkt als Text eingegeben.
- **Spaltenanzahl** – Anzahl der indizierten Gruppen **Spaltenlayout [n]**.

**Layout**

- **Tabellenlayout** – Standard, Karte oder umrandete Karte.
- **Kopf zeigen / fixierter Kopf** – Kopfzeile und ob sie beim Scrollen bleibt.
- **Zeilenhöhe / abgerundeter Rand** – Zeilenabstand und runde Ecken.

Jede Spalte wird in ihrer eigenen indizierten Gruppe konfiguriert:

<img src="../../media/vis2_table_editor_2.png" width="340" alt="Indizierte Tabellenspalte">

- **Beschriftung** – Spaltenkopftext.
- **Spaltentyp** – Text- oder Bildzelle.
- **Sortierschlüssel** – die JSON-Eigenschaft, die die Spalte liest und sortiert.
- **Breite / Ausrichtung / kein Umbruch** – Spaltengröße und Textverhalten.
- **Präfix / Suffix** – Text um den Zellenwert.

Die Anzeige folgt der JSON-Eigenschaftsreihenfolge.

```json
[{ "geraet": "Temperatur", "raum": "Wohnzimmer", "wert": "22,4 °C" }]
```

In jeder Zeile dieselbe JSON-Eigenschaftsreihenfolge verwenden.
