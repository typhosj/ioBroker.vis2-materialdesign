# Checkbox

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/checkbox.md)

Eine native Material-Design-Checkbox für VIS 2, die boolesche oder eigene
Aus-/Ein-Werte liest und schreibt. Template-ID:
`tplVis2-materialdesign-CheckBox`.

<img src="../../media/vis2_checkbox_runtime.png" alt="Material-Design-Checkbox in VIS 2">

## Editor-Einstellungen

Der Screenshot zeigt die beiden relevanten Gruppen (**Allgemein** und
**Beschriftung**) aufgeklappt. Nicht aufgeführte Einstellungen sind
selbsterklärend.

<img src="../../media/vis2_checkbox_editor_overview.png" width="340" alt="Checkbox-Editoroptionen">

**Allgemein**

- **Art der Umschaltung** – `boolean` schreibt `true`/`false`; `value` schreibt stattdessen die unten gesetzten Werte **Wert für aus** / **Wert für ein**.
- **Zustand, wenn der Wert nicht der Bedingung 'Ein' entspricht** – welcher Zustand (an/aus) angezeigt wird, wenn der gelesene Wert weder zum Aus- noch zum Ein-Wert passt.
- **auf mobilen Geräten vibrieren [s]** – haptische Rückmeldung beim Drücken (nur mobil).
- **Klicksound-Lautstärke** – Lautstärke des Klicksounds, wenn *Klicksound abspielen* aktiv ist.
- **Nur lesen** – zeigt den Zustand an, schreibt aber nie.

**Beschriftung**

- **Beschriftung False / True** – Text neben der Box im Aus- / Ein-Zustand.
- **Beschriftungsposition** – links, rechts oder aus.
- **Beschriftungs-Klick aktivieren** – ein Klick auf die Beschriftung schaltet den Wert um, nicht nur die Box.

**Farben** steuert Box, Rahmen, Hover- und Labelfarben. **Verriegeln** ergänzt
Entsperren und eine automatische Wiederverriegelung.
