# Kalender

[Anwenderhandbuch](../README.md) › [Widget-Katalog](README.md) · [English](../../en/widgets/calendar.md)

Nativer VIS-2-Monats-, Wochen- und Tageskalender aus einem JSON-Termin-State.
Template-ID: `tplVis2-materialdesign-Calendar`.

<img src="../../media/vis2_calendar_runtime.png" alt="Material-Design-Kalender in VIS 2">

Wochen-/Tagesansicht mit Zeitachse:

<img src="../../media/vis2_calendar_runtime_week.png" alt="Material-Design-Kalender – Wochenansicht" width="600">

## Editor-Einstellungen

Die Screenshots zeigen die Allgemein-/Layout-Gruppen sowie die Termin- und
Datumsformat-Gruppen. Nicht aufgeführte Einstellungen sind selbsterklärend.

<img src="../../media/vis2_calendar_editor_overview.png" width="340" alt="Kalender Allgemein und Layout">

**Allgemein**

- **Objekt-ID** – State mit dem JSON-Termin-Array.
- **Kalenderansicht** – `Monat`, `Woche` oder `Tag`.

**Layout**

- **anzuzeigende Wochentage** – kommagetrennte Wochentagsnummern, 0 = Sonntag bis
  6 = Samstag. Die Reihenfolge ist auch die Anzeigereihenfolge, der Standard
  `1,2,3,4,5,6,0` beginnt also montags. `1,2,3,4,5` blendet das Wochenende aus.
- **Zeige Kurznamen für Wochentage** – `Mo` statt `Montag`.
- **Rahmenfarbe / Hintergrundfarbe / Hintergrundfarbe für andere Monate** – Raster
  und Tageszellen; die letzte gilt für die Tage, die im Monatsraster aus dem
  Vor- oder Folgemonat stammen.

Termindarstellung und Datumsformate haben eigene Gruppen:

<img src="../../media/vis2_calendar_editor_2.png" width="340" alt="Kalender Termin- und Datumsformat">

**Terminlayout**

- **Modusüberlappung** – wie gleichzeitige Termine in Wochen- und Tagesansicht
  angeordnet werden: `Spalte` teilt die Breite unter ihnen auf, `stack` legt sie
  versetzt übereinander. In der Monatsansicht stehen Termine ohnehin
  untereinander, dort wirkt die Einstellung nicht.
- **Höhe** – Höhe eines Termins, dazu Schriftgröße und Schriftart der Termine.

**benutzerdefinierte Datumsformate**

- Je Ansicht ein Format für **Kopfzeile** und **Tag**, mit Datums-Token
  (z. B. `dddd`, `D. MMMM`). Leer gelassen gilt das Format des Gebietsschemas.

**Zeitachsenlayout** (nur Wochen- und Tagesansicht)

- **Startstunde / Endstunde** – der gezeigte Ausschnitt des Tages.
- **Intervall in Minuten** – Abstand der Rasterlinien, z. B. 30 oder 60.
- **zeige kurze Intervalle als Text** – abgeschaltet werden nur die vollen
  Stunden beschriftet.
- **Zeitformat** – `Gebietsschema`, `24h` oder `12h`.
- **aktuelle Uhrzeit anzeigen / Farbe aktuelle Uhrzeit** – Linie auf der
  aktuellen Uhrzeit, minütlich nachgeführt.
- **Hintergrundfarbe / Überschrift Hintergrundfarbe** – die erste färbt die
  Uhrzeit-Spalte, die zweite die Zelle darüber; zusammen die ganze Spalte.

**Kalenderwochen Layout**

- **Kalenderwoche anzeigen** – im Monat eine KW-Spalte links, in Wochen- und
  Tagesansicht die KW in der Ecke über der Zeitachse; Schrift und Farbe kommen
  aus derselben Gruppe.

**Layout der Kalendertasten**

- **Monatsansicht: gehe zu / Wochenansicht: gehe zu / Tagesansicht: gehe zu** –
  ein Klick auf die Tageszahl wechselt in die eingestellte Ansicht und nimmt den
  angeklickten Tag mit.

**Steuerungslayout**

- **Steuerung anzeigen** – die Leiste mit Vor/Zurück, Heute und Ansichtswahl.
- **Steuerungslayout** – `text`, `raised`, `unelevated` oder `outlined`.
- **Ausrichtung** – `stretch`, `left`, `right` oder `center`.
- **Beschriftungen anzeigen** – abgeschaltet bleiben nur die Symbole.

```json
[
    {
        "start": "2026-07-18T10:00:00",
        "end": "2026-07-18T11:00:00",
        "name": "Termin",
        "color": "#44739e",
        "colorText": "#ffffff"
    }
]
```

Der State muss ein JSON-Array enthalten.

## ICAL-Adapter

Der State `ical.0.data.table` kann direkt verwendet werden. Das Widget liest die
Feldnamen des ICAL-Adapters (`event`, `_date`, `_end`, `_allDay`, `_calColor`)
ebenso wie das obige Format und rechnet dessen UTC-Zeitstempel in Ortszeit um.
Ganztagestermine kommen von dort mit exklusivem Ende — der letzte Tag wird nicht
mitgezählt, wie im Kalender selbst.

## Gestaltungsstil

Die Stile **Klassisch** (links) und **Material 3** (rechts) nebeneinander, siehe
[Gestaltungsstil](../README.md#gestaltungsstil): die Monatsansicht mit und ohne
Kalenderwoche, Wochen- und Tagesansicht, Steuerung outlined und den Kalender
ohne Steuerung.

<img src="../../media/vis2_calendar_styles.png" alt="Kalender im klassischen und im Material-3-Stil">

Dieselben Widgets bei eingeschaltetem Dark-Theme:

<img src="../../media/vis2_calendar_styles_dark.png" alt="Kalender im klassischen und im Material-3-Stil, dunkel">
