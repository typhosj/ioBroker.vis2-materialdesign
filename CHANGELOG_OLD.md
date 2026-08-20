# Older changes

Older changelog entries are archived here by the release script once the changelog in the README grows past the most recent releases. The current changelog lives in the README.
## 0.3.0 (2026-07-22)

- (typhosj) Removed all VIS 1 legacy: the bundled `materialdesign` VIS 1 widget set and `materialdesign.html` are gone; the adapter no longer ships or depends on any VIS 1 files
- (typhosj) Made all widgets self-contained by vendoring the Material Design Icons webfont and the required Material Components base CSS into the widget bundle, so icons and styling render without the legacy stylesheet
- (typhosj) Removed the obsolete jQuery/Materialize configuration page; the native React theme editor is now the only admin UI
- (typhosj) Roughly halved the published package size (woff2-only fonts, dead-code removal, smaller preview image)
- (typhosj) Added text input masking and custom calendar date/time formats
- (typhosj) Restored full visual parity of the ported widgets against the original VIS 1 versions and migrated the widget documentation to VIS 2
- (typhosj) Reworked the widget documentation with per-widget editor screenshots that expand the relevant option groups and describe every non-obvious setting (English and German)
- (typhosj) Fixed six widget editor group headers (title, text, card action, linked value, striped, list header) that showed untranslated keys


## 0.2.0 (2026-07-13)

- (typhosj) Ported all remaining legacy Material Design widget templates to native VIS 2 components
- (typhosj) Added calendar, chart, table and embedded child-view widgets for dialogs, masonry, grid and advanced views
- (typhosj) Added automated legacy-template-to-VIS2 registration coverage checks
- (typhosj) Ported the adapter configuration UI to React 5 with the native theme editor
- (typhosj) Restored the VIS2 editor action to apply Material Design theme values to widget properties

## 0.1.0 (2026-07-09)

- (typhosj) Initial native VIS 2 port of the Material Design button widgets
- (typhosj) Added one-to-one VIS 2 button variants for navigation, link, state, multi-state, addition, toggle, vertical buttons, icon buttons, and icon button slider
- (typhosj) Added VIS 2 editor previews using the original Material Design icon glyphs
- (typhosj) Ported button state writes, delayed multi-state writes, toggle and push-button behavior, lock overlay, click sound, vibration feedback, image/icon handling, and SVG color behavior
- Based on the original VIS Material Design widgets version 0.5.9 by Scrounger

[Older changelog entries](CHANGELOG_OLD.md)

<!-- omit in toc -->
