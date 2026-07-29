---
name: Material 3 beta feedback
about: How the Material 3 style behaves in your project — not a crash, just what looks or feels wrong
title: '[M3] [widget name]: [what looks or feels wrong]'
labels: 'material3-beta'
---

**Which widget, and which design style?**
Widget type, and whether it is set to `legacy` or `material3` (Style → Design style).

**What did you expect, and what do you see?**
Screenshots of the same widget in both styles say more than a description. If you
know the widget from the original VIS Material Design adapter, say how it looked
there — behavioral familiarity is exactly what this beta cannot test on its own.

**Is anything explicitly configured on that widget?**
Material 3 only fills in values you left empty. A color, font, size or height you
set yourself must keep winning; if it does not, that is a defect and worth saying
so plainly here.

**Seed color**
The seed under the adapter's Design tab, if you set one (leave empty for the
Material 3 baseline).

**Dark mode**
Whether `vis2-materialdesign.0.colors.darkTheme` is true or false.

**Widget or view export**
Export the widget or view and paste it here — it carries every option value.

```
Widget Export
```

**Versions**
 - Adapter version: <adapter-version>
 - VIS 2 version: <vis-2-version>
 - Browser and device: <e.g. Firefox 141 on a wall panel, Chrome on Android>
