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
- **zeige max. Alerts** – wie viele Meldungen gleichzeitig gezeigt werden,
  Vorgabe 3. Leer oder `0` zeigt alle Meldungen der Warteschlange (maximal 100).
- **ausblenden unter Bildschirmbreite [px]** – blendet das Widget unterhalb dieser Breite aus.
  Die Regel gilt nur für dieses Widget, mehrere Alerts-Widgets einer Ansicht können also unterschiedliche Breiten verwenden.

**Layout**

- **Layout** – `normal`, `outlined` oder `tile`. Die Werte stehen im Editor roh
  da: `outlined` zeichnet einen Rahmen statt einer Fläche, `tile` nimmt die
  abgerundeten Ecken weg.
- **schlank / Schatten / Abstand zwischen Alerts** – Kompaktheit (Vorgabe an),
  Schattentiefe 0–24 und der Abstand unter jeder Meldung in Pixeln.
- **Rahmen** – auf welcher Seite jede Meldung den 6 px breiten Farbstreifen aus
  `borderColor` bekommt: keine, oben, rechts, links oder unten.
- **Schließen Symbol** / **Schließen Symbol Farbe** / **Schließen Symbol Farbe
  hover / selektiert** – das Schließen-Icon, seine Farbe und die Farbe, solange
  es gedrückt wird. Schließen entfernt die Meldung aus dem State.

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

Alle Eigenschaften sind optional. `text` darf HTML enthalten (`<b>`, `<br>`,
Links); Skripte und Ereignis-Attribute werden vor dem Anzeigen entfernt.
`borderColor` wirkt nur, wenn **Rahmen** nicht auf „keine“ steht.

Der State muss ein JSON-Array enthalten. Ungültiges JSON erscheint als Fehler.
Ein leerer State zeigt gar nichts an.

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): die Layouts normal, outlined,
tile und dense sowie eine Meldung ohne Rahmenstreifen.

<img src="../../media/vis2_alerts_styles.png" alt="Meldungen im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_alerts_styles_dark.png" alt="Meldungen im klassischen und im Material-3-Stil, dunkel">
