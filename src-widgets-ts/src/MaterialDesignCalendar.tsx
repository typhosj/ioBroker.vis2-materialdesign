import React from "react";
import type { RxWidgetInfo, VisRxWidgetState } from "@iobroker/types-vis-2";
import { RenderProps, VisWidget, createInfo, stateValue } from "./widgetUtils";
type Data = Record<string, unknown> & { oid?: string };
type Event = {
  start?: string;
  end?: string;
  name?: string;
  color?: string;
  colorText?: string;
};
const s = (v: unknown, d = "") =>
  v === undefined || v === null || v === "" || v === "null" ? d : String(v);
const b = (v: unknown, d = false) =>
  v === undefined || v === null || v === ""
    ? d
    : v === true || v === "true" || v === 1 || v === "1";
const n = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const events = (v: unknown): Event[] => {
  try {
    const value = JSON.parse(s(v));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};
const attrs: RxWidgetInfo["visAttrs"] = [
  {
    name: "common",
    fields: [
      { name: "oid", label: "oid", type: "id" },
      {
        name: "calendarView",
        label: "calendarView",
        type: "select",
        options: ["month", "week", "day"],
        default: "month",
      },
      {
        name: "controlShow",
        label: "controlShow",
        type: "checkbox",
        default: true,
      },
      { name: "controlShowLabel", label: "controlShowLabel", type: "checkbox" },
    ],
  },
  {
    name: "calendarLayout",
    label: "group_calendarLayout",
    fields: [
      {
        name: "calendarShortWeekdays",
        label: "calendarShortWeekdays",
        type: "checkbox",
      },
      { name: "calendarWeekdays", label: "calendarWeekdays", type: "text" },
      {
        name: "calendarDayBackgroundColor",
        label: "calendarDayBackgroundColor",
        type: "color",
      },
      {
        name: "calendarBorderColor",
        label: "calendarBorderColor",
        type: "color",
      },
    ],
  },
];
export default class MaterialDesignCalendar extends VisWidget {
  private date = new Date();
  private view = "";
  private touchX = 0;
  static getWidgetInfo(): RxWidgetInfo {
    return {
      ...createInfo("tplVis2-materialdesign-Calendar", "Calendar", attrs),
      visPrev: '<img src="widgets/materialdesign/img/calendar.png"></img>',
      visDefaultStyle: { width: 500, height: 300 },
    };
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignCalendar.getWidgetInfo();
  }
  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    const d = this.state.rxData as Data,
      view = this.view || s(d.calendarView, "month"),
      source = events(stateValue(this.state as VisRxWidgetState, s(d.oid))),
      start = new Date(this.date),
      columns = view === "day" ? 1 : 7;
    if (view === "month") start.setDate(1);
    else
      start.setDate(start.getDate() - (view === "week" ? start.getDay() : 0));
    const days = Array.from(
      { length: view === "month" ? 42 : view === "week" ? 7 : 1 },
      (_, i) => {
        const day = new Date(start);
        day.setDate(
          start.getDate() + i - (view === "month" ? start.getDay() : 0),
        );
        const iso = day.toISOString().slice(0, 10),
          list = source.filter(
            (event) =>
              s(event.start).slice(0, 10) <= iso &&
              s(event.end || event.start).slice(0, 10) >= iso,
          );
        return (
          <div
            key={iso}
            style={{
              border: `1px solid ${s(d.calendarBorderColor, "#ddd")}`,
              minHeight: 48,
              padding: 4,
              background: s(d.calendarDayBackgroundColor, "#fff"),
            }}
          >
            <b>{day.getDate()}</b>
            {list.map((event, index) => (
              <div
                key={index}
                style={{
                  background: s(event.color, "#44739e"),
                  color: s(event.colorText, "#fff"),
                  fontSize: 12,
                  marginTop: 2,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {s(event.name)}
              </div>
            ))}
          </div>
        );
      },
    );
    const move = (amount: number) => {
      this.date = new Date(this.date);
      this.date.setDate(
        this.date.getDate() +
          amount * (view === "month" ? 30 : view === "week" ? 7 : 1),
      );
      this.forceUpdate();
    };
    return (
      <div
        className="materialdesign-widget materialdesign-calendar"
        style={{ height: "100%", width: "100%" }}
      >
        {b(d.controlShow, true) ? (
          <div>
            <button onClick={() => move(-1)}>‹</button>
            <button
              onClick={() => {
                this.date = new Date();
                this.forceUpdate();
              }}
            >
              today
            </button>
            <button onClick={() => move(1)}>›</button>
            {(["month", "week", "day"] as const).map(next => <button key={next} onClick={() => { this.view = next; this.forceUpdate(); }}>{next}</button>)}
          </div>
        ) : null}
        <div onTouchStart={event => { this.touchX = event.touches[0]?.clientX || 0; }} onTouchEnd={event => { const distance = (event.changedTouches[0]?.clientX || 0) - this.touchX; if (Math.abs(distance) > 30) move(distance < 0 ? 1 : -1); }}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            height: "calc(100% - 32px)",
          }}
        >
          {view !== "day"
            ? Array.from({ length: 7 }, (_, i) => (
                <b key={i}>
                  {new Intl.DateTimeFormat(undefined, {
                    weekday: b(d.calendarShortWeekdays) ? "short" : "long",
                  }).format(new Date(2024, 0, i + 1))}
                </b>
              ))
            : null}
          {days}
        </div>
      </div>
    );
  }
}
