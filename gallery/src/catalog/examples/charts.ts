import type { Example, FamilyExamples } from '../example';

const D = '0_userdata.0.demo.';
const CHART = { width: 480, height: 300 };
const PIE = { width: 320, height: 300 };

const typical = (en: string, de: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id: 'typical', label: { en: 'Typical', de: 'Typisch' }, purpose: { en, de } });
const text = (id: string, en: string, de: string, pen: string, pde: string): Pick<Example, 'id' | 'label' | 'purpose'> => ({ id, label: { en, de }, purpose: { en: pen, de: pde } });

// Energy today per consumer, one JSON state for Bar and Pie.
const breakdown = { oid: `${D}energy.breakdown`, chartDataMethod: 'jsonStringObject', valuesMaxDecimals: 1, valuesAppendText: ' kWh', tooltipBodyAppend: ' kWh', tooltipValueMaxDecimals: 1 };
const box = { valuesBackgroundColor: '#ffffff', valuesBorderColor: '#00696d', valuesBorderWidth: 1, valuesBorderRadius: 6 };
const scheme = { colorScheme: 'scrounger.pie' };
const power = { historyAdapterInstance: 'influxdb.0', timeIntervalToShow: '1 day', refreshTimeInterval: '30 seconds', xAxisTimeFormats: 'HH:mm', legendPosition: 'bottom' };
const houseLine = { yAxisTitle0: 'W', oid0: `${D}energy.power`, legendText0: 'House', aggregate0: 'average', minTimeInterval0: 3600, maxDataPoints0: 24, tooltipAppendText0: ' W', showValues0: 'showValuesOff' };

export const charts: FamilyExamples = {
    MaterialDesignChartBar: [
        { ...typical('Energy today per consumer from one JSON state, with the value on each bar.', 'Energie heute je Verbraucher aus einem JSON-Datenpunkt, mit dem Wert auf jedem Balken.'), size: CHART, data: { ...breakdown } },
        { ...text('horizontal', 'Horizontal', 'Waagerecht', 'Room for long category names; the value sits next to the bar.', 'Platz für lange Namen; der Wert steht neben dem Balken.'), size: CHART, data: { ...breakdown, chartType: 'horizontal' } },
        { ...text('data-points', 'One data point per bar', 'Ein Datenpunkt je Balken', 'Editor datasets: each bar reads its own state and has its own color.', 'Editor-Datensätze: jeder Balken liest seinen eigenen Datenpunkt und hat eine eigene Farbe.'), size: CHART, data: { dataCount: 2, oid0: `${D}energy.pv`, label0: 'PV', dataColor0: '#f9a825', oid1: `${D}energy.power`, label1: 'House', dataColor1: '#1e88e5', valuesAppendText: ' W', tooltipBodyAppend: ' W' } },
        { ...text('value-label-with-box', 'Value label with box', 'Wert mit Kasten', 'The label gets a box of its own, so it stays readable on any background.', 'Der Wert bekommt einen eigenen Kasten und bleibt auf jedem Hintergrund lesbar.'), size: CHART, data: { ...breakdown, ...box } },
        { ...text('without-value-labels', 'Without value labels', 'Ohne Werte', 'Only the axis tells the values, for a calmer chart.', 'Nur die Achse nennt die Werte, für ein ruhigeres Bild.'), size: CHART, data: { ...breakdown, showValues: 'showValuesOff', axisValueAppendText: ' kWh' } },
        { ...text('as-card', 'As card', 'Als Karte', 'Chart and title on a card, as a dashboard tile.', 'Diagramm und Titel auf einer Karte, als Dashboard-Kachel.'), size: { width: 480, height: 340 }, data: { ...breakdown, cardUse: true, title: 'Energy today' } },
    ],
    MaterialDesignChartPie: [
        { ...typical('Share of each consumer in today\'s energy, colors from a scheme.', 'Anteil jedes Verbrauchers an der Energie heute, Farben aus einem Farbschema.'), size: PIE, data: { ...breakdown, ...scheme, showLegend: true, legendPosition: 'bottom' } },
        { ...text('doughnut', 'Doughnut', 'Ring', 'The same shares as a ring.', 'Dieselben Anteile als Ring.'), size: PIE, data: { ...breakdown, ...scheme, chartType: 'doughnut', valuesPositionAlign: 'center', showLegend: true, legendPosition: 'bottom' } },
        { ...text('value-label-with-box', 'Value label with box', 'Wert mit Kasten', 'Boxed labels stay readable on light and dark segments.', 'Werte im Kasten bleiben auf hellen und dunklen Segmenten lesbar.'), size: PIE, data: { ...breakdown, ...scheme, ...box, showLegend: true, legendPosition: 'bottom' } },
        { ...text('without-legend', 'Without legend', 'Ohne Legende', 'All the room goes to the pie; the tooltip names the segment.', 'Der ganze Platz gehört der Torte; der Tooltip nennt das Segment.'), size: PIE, data: { ...breakdown, ...scheme, showLegend: false } },
        { ...text('as-card', 'As card', 'Als Karte', 'Pie and title on a card, as a dashboard tile.', 'Torte und Titel auf einer Karte, als Dashboard-Kachel.'), size: { width: 320, height: 340 }, data: { ...breakdown, ...scheme, showLegend: true, legendPosition: 'right', cardUse: true, title: 'Energy today' } },
    ],
    MaterialDesignChartJson: [
        { ...typical('A week of consumption as bars and PV as a line, both from one JSON state.', 'Eine Woche Verbrauch als Balken und PV als Linie, beide aus einem JSON-Datenpunkt.'), size: CHART, data: { oid: `${D}energy.week`, chartType: 'bar', legendPosition: 'top', xAxisOffsetGridLines: true, tooltipBodyAppend: ' kWh' } },
        { ...text('stacked', 'Stacked bars', 'Gestapelte Balken', 'Self-consumed PV and grid import stacked to the daily consumption, the grid part hatched.', 'Eigenverbrauch und Netzbezug zum Tagesverbrauch gestapelt, der Netzanteil schraffiert.'), size: CHART, data: { oid: `${D}energy.weekSources`, chartType: 'bar', legendPosition: 'top', xAxisOffsetGridLines: true, tooltipBodyAppend: ' kWh' } },
        { ...text('with-value-labels', 'With value labels', 'Mit Werten', 'The values written onto bars and points.', 'Die Werte stehen auf Balken und Punkten.'), size: CHART, data: { oid: `${D}energy.week`, chartType: 'bar', legendPosition: 'top', xAxisOffsetGridLines: true, showValues: 'showValuesOn', valuesMaxDecimals: 1, ...box } },
        { ...text('legend-at-bottom', 'Legend at bottom', 'Legende unten', 'The legend below the chart leaves the top free for a title above the widget.', 'Die Legende unter dem Diagramm lässt oben Platz für einen Titel über dem Widget.'), size: CHART, data: { oid: `${D}energy.week`, chartType: 'bar', legendPosition: 'bottom', xAxisOffsetGridLines: true } },
        { ...text('as-card', 'As card', 'Als Karte', 'Chart and title on a card, as a dashboard tile.', 'Diagramm und Titel auf einer Karte, als Dashboard-Kachel.'), size: { width: 480, height: 340 }, data: { oid: `${D}energy.week`, chartType: 'bar', legendPosition: 'top', xAxisOffsetGridLines: true, cardUse: true, title: 'This week' } },
    ],
    MaterialDesignChartLineHistory: [
        { ...typical('House power over the last day from the history instance, hourly average.', 'Hausverbrauch des letzten Tages aus der History-Instanz, Stundenmittel.'), size: CHART, data: { ...power, ...houseLine } },
        { ...text('two-lines', 'Consumption and PV', 'Verbrauch und PV', 'Two data points on one axis; the PV area filled.', 'Zwei Datenpunkte auf einer Achse; die PV-Fläche gefüllt.'), size: CHART, data: { ...power, dataCount: 2, ...houseLine, oid1: `${D}energy.pv`, legendText1: 'PV', aggregate1: 'average', minTimeInterval1: 3600, maxDataPoints1: 24, dataColor1: '#f9a825', useFillColor1: true, tooltipAppendText1: ' W', showValues1: 'showValuesOff' } },
        { ...text('with-value-labels', 'With value labels', 'Mit Werten', 'Every sixth point labelled, so the values stay apart.', 'Jeder sechste Punkt beschriftet, damit die Werte nicht überlappen.'), size: CHART, data: { ...power, ...houseLine, showValues0: 'showValuesOn', valuesSteps0: 6, valuesMaxDecimals0: 0, valuesAppendText0: ' W' } },
        { ...text('steps-stepped', 'Steps', 'Stufen', 'Each hourly average held as a step until the next one.', 'Jedes Stundenmittel als Stufe bis zum nächsten.'), size: CHART, data: { ...power, ...houseLine, steppedLine0: true } },
        { ...text('as-card', 'As card', 'Als Karte', 'Chart and title on a card, as a dashboard tile.', 'Diagramm und Titel auf einer Karte, als Dashboard-Kachel.'), size: { width: 480, height: 340 }, data: { ...power, ...houseLine, cardUse: true, title: 'Power today' } },
    ],
};
