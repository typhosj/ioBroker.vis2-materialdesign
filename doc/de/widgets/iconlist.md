# IconList

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/iconlist.md)

Zeigt zustandsabhängige Icons in einem responsiven VIS-2-Raster. Daten werden im
Editor eingegeben oder aus JSON gelesen. Template-ID:
`tplVis2-materialdesign-Icon-List`.

<img src="../../media/vis2_iconlist_runtime.png" alt="Material-Design-IconList in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen die Datengruppen und das Raster-Layout. Nicht aufgeführte
Einstellungen sind selbsterklärend.

<img src="../../media/vis2_iconlist_editor_overview.png" width="340" alt="IconList Daten und Eintrag">

**Daten der Liste**

- **Datenmethode** – indizierte Editor-Einträge oder ein JSON-State.
- **Anzahl der Einträge** – wie viele indizierte Eintragsgruppen es gibt.

Jede Zelle wird in ihrer eigenen indizierten Gruppe **Layout des Listenelements [n]** konfiguriert:

- **Objekt-ID** – der die Zelle steuernde State.
- **Icon-Farbe / Aktiv-Farbe** – Aus- und Ein-Zustand-Farbe des Icons.
- **Beschriftung / Unterzeile / Wert** – Texte unter dem Icon; **Wertzusatz** hängt eine Einheit an.
- **Sichtbarkeitsbedingung** – blendet die Zelle aus, sofern kein State passt.

Die Rasteranordnung liegt in der Gruppe **Allgemein**:

<img src="../../media/vis2_iconlist_editor_2.png" width="340" alt="IconList Raster-Layout">

- **Elemente umbrechen / max. Elemente pro Zeile** – wie Zellen in Zeilen fließen.
- **Abstände** – Abstand zwischen den Zellen.

Zellen- und Icon-Maße (Icon-Höhe, Mindestbreite / -höhe) liegen in der
optionalen Gruppe **Layout des Listenelements**.

Icons akzeptieren Material-Design-Iconnamen und Bildquellen. Über die
Aktiv-Icon-Felder lässt sich ein eigenes Aussehen für den Ein-Zustand festlegen.
