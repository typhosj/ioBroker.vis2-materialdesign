# Top App Bar

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/top-app-bar.md)

VIS-2-Top-App-Bar mit responsivem Navigation Drawer und indizierten Menüeinträgen.
Template-ID: `tplVis2-materialdesign-TopAppBar-Navigation`.

<img src="../../media/vis2_top_app_bar_runtime.png" alt="Material-Design-Top-App-Bar in VIS 2">

## Editor-Einstellungen

Die Screenshots zeigen die Allgemein-/Bar-Gruppen sowie die Menüdaten und einen
Eintrag. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_top_app_bar_editor_overview.png" width="340" alt="Top App Bar Allgemein und Layout">

**Allgemein**

- **Objekt-ID** – erhält den gewählten Menü-Index; ein optionaler zweiter State erhält den **Namen** des gewählten Eintrags.
- **Anzahl Menüeinträge** – Anzahl der indizierten Eintragsgruppen (Editor-Methode).
- **Fallback-Wert, wenn nicht in Benutzergruppe** / **Fallback-Wert deaktivieren** – welcher Eintrag vorausgewählt ist, solange die Objekt-ID noch keinen Wert hat, oder keiner. Trotz des Namens hat das Feld nichts mit Benutzergruppen zu tun; diese Funktion wurde nie portiert.

**Top App Bar Layout**

- **Layout** – Standard, dicht oder kurz.
- **Titel / gewählten Eintrag als Titel zeigen** – fester Titel oder der aktive Menüeintrag als Titel.
- **Farben** – Titel-, Hintergrund- und Icon-Farben.

Die Gruppe **Navigationsleiste: Layout** bestimmt den Drawer-Modus (modal,
permanent oder automatisch ab einer Bildschirmbreite), Drawer-Breite, Kopfzeile
und Sichtbarkeit der Beschriftungen.

Die Menüeinträge stammen aus den Daten- und Eintragsgruppen:

<img src="../../media/vis2_top_app_bar_editor_2.png" width="340" alt="Top App Bar Menüdaten und Eintrag">

- **Datenmethode** – indizierte Editor-Einträge oder ein JSON-String.
- **Menü-ID** – der für diesen Eintrag geschriebene Wert.
- **Beschriftung / Kopfzeile / Trenner** – Eintragstext, Abschnittskopf-Flag und Trennlinie.
- **Icon + Farbe** und **Untermenüs** pro Eintrag.

Die Navigationsleiste selbst kennt noch einige Einstellungen:

- **auf mobilen Geräten vibrieren [s]** – die Leiste vibriert bei der Auswahl eines Eintrags so viele Sekunden lang. Nicht jeder Browser und jedes Gerät unterstützt das; siehe [Browserhinweis](../README.md#browserhinweis).
- **Listenelement hover Farbe** und **Element selektiert / hover** färben die Zeile unter dem Zeiger im Menü und im Untermenü, **Hintergrund** füllt die Unterliste.

Berechtigungen je Eintrag nach ioBroker-Benutzergruppe wurden nie nach VIS 2
portiert; die zugehörigen Editor-Felder sind entfallen. Die Hälfte davon hätte
wie eine Zugriffsbeschränkung ausgesehen, ohne eine zu sein.

## Zwischen Ansichten umschalten

Die Top App Bar navigiert nicht selbst. Sie schreibt nur den Index des gewählten
Eintrags in ihre **Objekt-ID** (Eintrag 0 → `0`, Eintrag 1 → `1`, Untermenüs
zählen in derselben Reihenfolge mit). Den Wechsel der Ansicht übernimmt ein
zweites Widget, das dieselbe Objekt-ID liest:
[Advanced View in Widget](html-widgets.md) in der `8`-Variante, mit einer
eingebetteten Ansicht je Index.

Der übliche Aufbau: die Top App Bar und darunter das Advanced View in Widget 8,
beide auf derselben Ansicht, beide mit derselben Objekt-ID. Das Widget muss so
hoch sein wie der Drawer, den es aufklappen soll — der leere Rest seines Rahmens
lässt Klicks zu den darunterliegenden Widgets durch.
