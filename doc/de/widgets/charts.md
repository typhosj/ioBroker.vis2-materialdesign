# Diagramme

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/charts.md)

Vier native VIS-2-Diagramme für unterschiedliche Datenquellen.

<img src="../../media/vis2_charts_runtime.png" alt="Material-Design-Diagramme in VIS 2">

## Widgets

- [Balkendiagramm](chart-bar.md) – einzelne aktuelle State-Werte vergleichen.
- [Kreisdiagramm](chart-pie.md) – Anteile einzelner aktueller State-Werte darstellen.
- [JSON-Diagramm](chart-json.md) – mehrere Balken- und Linienreihen aus einem JSON-State kombinieren.
- [Linienverlaufsdiagramm](chart-line-history.md) – Zeitreihen direkt aus einer History-Instanz laden.

Bar und Pie können ihre Werte entweder aus indizierten Editor-Datensätzen oder
aus einem gemeinsamen JSON-State lesen. JSON Chart erwartet ein eigenes
Mehrreihenformat. Line History fragt historische Werte über die ausgewählte
History-Adapterinstanz ab.

## Gemeinsame Einstellungen

Alle vier Diagramme teilen diese Gruppen. Der Screenshot zeigt die Gruppen
**Diagramm Layout** und **Legende** aufgeklappt. Die Editor-Sprache folgt der
ioBroker-Systemsprache, daher sind die Screenshots deutsch.

<img src="../../media/vis2_charts_editor_overview.png" width="340" alt="Gemeinsame Diagramm- und Legenden-Optionen">

**Diagramm Layout** – allgemeines Aussehen: Hintergrundfarben, Wertachsen-Vorgaben
(Min / Max, Dezimalstellen) und Animationsdauer.

**Card Hintergrund** – bettet Diagramm und HTML-Titel optional in eine
Material-Design-Karte ein.

**Legende** – ob die Legende gezeigt wird und ihre **Position**: oben/unten
ordnen Einträge horizontal an, links/rechts vertikal.

**Tooltip** – zeigt Werte beim Berühren oder Überfahren eines Diagrammelements.

Ein **Farbschema** verteilt eine Palette auf Datensätze ohne eigene Farbe.
