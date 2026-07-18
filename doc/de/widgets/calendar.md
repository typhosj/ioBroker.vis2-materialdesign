# Kalender

[Zurück zur README](../../../README.md#widget-documentation)

Nativer VIS-2-Monats-, Wochen- und Tageskalender aus einem JSON-Termin-State.
Template-ID: `tplVis2-materialdesign-Calendar`.

<img src="../../media/vis2_calendar_runtime.png" alt="Material-Design-Kalender in VIS 2">

## Editor-Einstellungen

<table>
<tr><td><img src="../../media/vis2_calendar_editor_overview.png" width="300"></td>
<td><ul><li><b>Kalenderansicht:</b> Monat, Woche oder Tag.</li><li>Layoutgruppen steuern Wochentage, Kalenderwochen, Kopfzeile, Bedienung und Zeitachse.</li><li>Termineinstellungen steuern Überlappung, Höhe und Schrift.</li><li>Eigene Formatfelder akzeptieren Datums-Token.</li></ul></td></tr>
</table>

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
