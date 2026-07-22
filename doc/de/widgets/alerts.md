# Warnmeldungen

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/alerts.md)

Zeigt eine JSON-Warteschlange als Material-Design-Meldungen. Geschlossene
Meldungen werden aus dem State entfernt. Template-ID:
`tplVis2-materialdesign-Alerts`.

<img src="../../media/vis2_alerts_runtime.png" alt="Material-Design-Warnmeldungen in VIS 2">

## Editor-Einstellungen

Der Screenshot zeigt die Gruppen **Allgemein** und **Layout** aufgeklappt. Nicht
aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_alerts_editor_overview.png" width="340" alt="Warnmeldungen Allgemein und Layout">

**Allgemein**

- **Objekt-ID** – State mit dem JSON-Meldungs-Array.
- **max. Meldungen** – wie viele Meldungen gleichzeitig gezeigt werden.
- **min. Bildschirmauflösung** – blendet das Widget unterhalb dieser Breite aus.

**Layout**

- **Layout** – normal, umrandet oder Kachel.
- **dicht / Höhe / Abstand unten** – Kompaktheit, Schattentiefe und Abstand zwischen Meldungen.
- **Rand-Layout** – Rahmenstil jeder Meldung.
- **Schließen-Icon / Farbe** – das Schließen-Icon und seine Farbe; Schließen entfernt die Meldung aus dem State.

```json
[
    {
        "text": "Fenster ist offen",
        "icon": "alert-outline",
        "backgroundColor": "#fff8e1",
        "borderColor": "#ffc107",
        "iconColor": "#ffc107",
        "fontColor": "#333333"
    }
]
```

Der State muss ein JSON-Array enthalten. Ungültiges JSON erscheint als Fehler.
