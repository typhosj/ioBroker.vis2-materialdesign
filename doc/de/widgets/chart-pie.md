# Kreisdiagramm

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) › [Diagramme](charts.md) · [English](../../en/widgets/chart-pie.md)

Stellt aktuelle Werte als Anteile eines Kreises oder Rings dar.
Template-ID: `tplVis2-materialdesign-Chart-Pie`.

## Datenquelle

- **Eingabe über Editor:** jeder Abschnitt liest einen eigenen State.
- **JSON-String/Objekt:** ein State liefert alle Abschnitte als JSON-Array.
- **Ringdiagramm:** Ausschnitt bestimmt die Größe der freien Mitte in Prozent.

Negative Eingangswerte werden als `0` dargestellt. Für Daten mit positiven und
negativen Werten eignet sich daher das Balken- oder JSON-Diagramm.

## Editor-Einstellungen

Die Editor-Sprache folgt der ioBroker-Systemsprache, daher ist der Screenshot
deutsch. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_chart_pie_editor.png" width="340" alt="Kreisdiagramm Allgemein und Kreislayout">

- **Allgemein** – Datenquelle (Editor-Abschnitte oder ein JSON-State), Anzahl der Abschnitte, Objekt-ID, **Typ** (Kreis oder Ring) und der **Ausschnitt**, der die leere Mitte bemisst. Je Editor-Abschnitt ergänzt eine indizierte Gruppe dessen Objekt-ID, Beschriftung und Farbe.

Die gemeinsamen Gruppen **Diagramm Layout**, **Legende** und **Tooltip** aus
[Diagramme](charts.md) gelten hier ebenfalls.

## JSON-Format

Das Format entspricht den Datensätzen des [Balkendiagramms](chart-bar.md),
außer dass `valueText` vom Kreisdiagramm nicht benötigt wird.

| Eigenschaft | Bedeutung |
| --- | --- |
| `label` | Name des Abschnitts und Eintrag in der Legende |
| `value` | numerischer, nicht negativer Anteil |
| `dataColor` | Farbe dieses Abschnitts |
| `valueAppendix` | Zusatz hinter dem Wert im Tooltip |
| `tooltipTitle` | eigener Tooltip-Titel |
| `tooltipText` | eigener Tooltip-Inhalt |

```json
[
    { "label": "Eigenverbrauch", "value": 68, "dataColor": "#43a047" },
    { "label": "Einspeisung", "value": 32, "dataColor": "#f9a825" }
]
```

## Relevante Layoutoptionen

- Eine eigene Abschnittsfarbe hat Vorrang vor Farbschema und globaler Farbe.
- Tooltip-Minimal- und Maximalstellen formatieren nur automatisch erzeugte Tooltip-Werte. Ein eigener `tooltipText` ersetzt diese Ausgabe.
- Legende und Diagramm teilen sich den verfügbaren Platz. Bei vielen Abschnitten eignet sich eine Position oben oder unten mit breiterem Widget.
