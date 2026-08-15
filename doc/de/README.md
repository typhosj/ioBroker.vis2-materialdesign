# Material Design Widgets – Anwenderhandbuch

[Projektübersicht](../../README.md) · [English](../en/README.md)

## Voraussetzungen

- ioBroker Admin 7.6.20 oder neuer
- Node.js 22 oder neuer
- installierter VIS-2-Adapter
- aktueller Chromium-basierter Browser oder Firefox als Zielumgebung

Eine vollständige Browser-/Runtime-Kompatibilitätsmatrix ist noch nicht getestet.

## Installation und Schnellstart

1. In ioBroker Admin den Adapter **Material Design Widgets**
   (`vis2-materialdesign`) installieren.
2. Den VIS-2-Editor und ein Projekt öffnen.
3. Die Widget-Gruppe **Material Design** öffnen.
4. Ein Widget in die View ziehen und auswählen.
5. Im Tab **WIDGET** den Datenpunkt und das Verhalten konfigurieren.
6. Projekt speichern und in der Runtime testen.

Für den ersten Test eignet sich **Wertanzeige**: Datenpunkt unter `oid` wählen,
Einheit und Nachkommastellen einstellen, View speichern.

## Theme verwenden

Theme-Nutzung ist optional:

1. Adapterkonfiguration öffnen.
2. Im **Theme Editor** helle und dunkle Farben, Schriften und Schriftgrößen
   konfigurieren und speichern.
3. Im VIS-2-Editor ein Widget auswählen.
4. Unter **Theme** auf **Thema verwenden** klicken und bestätigen.

Dabei werden die passenden Theme-Referenzen in das ausgewählte Widget übernommen.
Danach gesetzte Widget-Werte bleiben individuelle Überschreibungen. Das globale
JavaScript-Skript in der Adapterkonfiguration ist nur nötig, wenn Skripte direkt
auf Theme-Werte zugreifen sollen.

## Widget nach Aufgabe wählen

- Schalten und navigieren: [Buttons](widgets/buttons.md),
  [Icon-Buttons](widgets/icon-buttons.md), [Checkbox](widgets/checkbox.md),
  [Switch](widgets/switch.md)
- Werte eingeben: [Eingabe, Select und Autocomplete](widgets/input.md),
  [Slider](widgets/slider.md), [Runder Slider](widgets/slider-round.md)
- Werte anzeigen: [Wertanzeige](widgets/value.md),
  [HTML Card](widgets/html-card.md), [Fortschritt](widgets/progress.md)
- Daten darstellen: [Liste](widgets/list.md), [Tabelle](widgets/table.md),
  [Diagramme](widgets/charts.md), [Kalender](widgets/calendar.md)
- Views strukturieren: [Top App Bar](widgets/top-app-bar.md),
  [Responsives Layout](widgets/responsive-layout.md), [Dialog](widgets/dialog.md)

[Vollständiger Widget-Katalog](widgets/README.md)

## Fehlerbehebung

- **Widget-Gruppe fehlt:** Installation von `vis2-materialdesign` und VIS 2
  prüfen, VIS-2-Editor neu laden.
- **Theme bleibt unverändert:** Adapterkonfiguration speichern, beim Widget
  **Theme → Thema verwenden** erneut ausführen, Runtime neu laden.
- **Änderung trotz Neuinstallation unsichtbar:** Browser-Cache mit hartem
  Neuladen umgehen.
- **Widget schreibt nicht:** Schreibbarkeit des Datenpunkts, Read-only-Option
  und Verriegelung des Widgets prüfen.
- **Liste, Tabelle, Kalender oder Diagramm leer:** JSON gegen das Beispiel der
  jeweiligen Widget-Seite prüfen.
- **Eine wiederholte Gruppe (Menüpunkt, Datensatz, Spalte, View) wächst nicht:**
  den **+**-Knopf in der Kopfzeile der letzten dieser Gruppen benutzen. Eine
  getippte Zahl im zugehörigen Anzahl-Feld baut die Gruppen nicht sofort neu auf —
  VIS 2 zeichnet sie nur über den Knopf oder nach einem Wechsel der Auswahl neu.
  Die letzte Gruppe zeigt nur ihre Kopfzeile mit den Knöpfen: sie ist die
  Hinzufügen-Leiste, kein Eintrag. Die Anzahl bleibt damit immer die Anzahl der
  Einträge.

## Browserhinweis

Vibration ist nicht in jedem Browser oder Gerät verfügbar. Maßgeblich ist die
[Browser-Kompatibilität der Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate#browser_compatibility).

Fehler bitte mit Adapterversion, Browser, betroffenem Widget und einem Screenshot
im [Issue-Tracker](https://github.com/typhosj/ioBroker.vis2-materialdesign/issues) melden.
