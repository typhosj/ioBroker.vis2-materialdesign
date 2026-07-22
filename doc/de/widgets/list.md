# Liste

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/list.md)

Konfigurierbare VIS-2-Liste mit Textzeilen, Buttons, Switches oder Checkboxen.
Zeilen kommen aus Editor-Einträgen oder einem JSON-State. Template-ID:
`tplVis2-materialdesign-List`.

<img src="../../media/vis2_list_runtime.png" alt="Material-Design-Liste in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen die listenweiten Gruppen und einen indizierten Zeileneintrag.
Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_list_editor_overview.png" width="340" alt="Liste Layout und Daten">

**Layout der Liste**

- **Listentyp** – Textzeile, State-/Toggle-/Navigations-/Link-Button, Switch oder Checkbox.
- **Listenlayout** – Standard, Karte oder umrandete Karte.
- **Trennerstil** – Trennlinie zwischen den Zeilen.

**Daten der Liste**

- **Datenmethode** – indizierte Editor-Einträge oder ein JSON-Objekt-State.
- **Anzahl der Einträge** – wie viele indizierte Zeilengruppen es gibt (Editor-Methode).

Jede Zeile wird in ihrer eigenen indizierten Gruppe **Layout des Listenelements [n]** konfiguriert:

<img src="../../media/vis2_list_editor_2.png" width="340" alt="Indizierter Listeneintrag">

- **Objekt-ID** – der in der Zeile gezeigte/gesteuerte State.
- **Beschriftung / Unterzeile / rechte Beschriftung** – Haupt-, Neben- und rechtsbündiger Text.
- **Icon + Aktiv-Farbe** – Zeilen-Icon und seine Ein-Zustand-Farbe.
- **Button-/Toggle-Werte** – die von den Button-/Toggle-Listentypen geschriebenen Werte.

```json
[{ "objectId": "0_userdata.0.light", "text": "Licht", "subText": "Wohnzimmer", "image": "lightbulb" }]
```
