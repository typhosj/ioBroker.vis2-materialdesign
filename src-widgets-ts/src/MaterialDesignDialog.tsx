import React from "react";
import type { RxWidgetInfo, VisRxWidgetState } from "@iobroker/types-vis-2";
import { renderIcon } from "./MaterialDesignButtons";
import {
  RenderProps,
  VisWidget,
  createInfo,
  parseActionValue,
  setStateValue,
  stateValue,
} from "./widgetUtils";

type Kind = "view" | "iframe";
type Data = Record<string, unknown> & {
  showDialogMethod?: string;
  showDialogOid?: string;
  contains_view?: string;
  src?: string;
};
const s = (v: unknown, d = ""): string =>
  v === undefined || v === null || v === "" || v === "null" ? d : String(v);
const n = (v: unknown, d = 0): number =>
  v === undefined || v === null || v === "" || !Number.isFinite(Number(v))
    ? d
    : Number(v);
const b = (v: unknown, d = false): boolean =>
  v === undefined || v === null || v === ""
    ? d
    : v === true || v === "true" || v === 1 || v === "1";
const buttonFields = [
  {
    name: "buttonStyle",
    label: "buttonStyle",
    type: "select" as const,
    options: ["text", "raised", "unelevated", "outlined", "icon"],
    default: "raised",
  },
  { name: "buttontext", label: "buttontext", type: "html" as const },
  {
    name: "mdwButtonPrimaryColor",
    label: "mdwButtonPrimaryColor",
    type: "color" as const,
  },
  {
    name: "mdwButtonSecondaryColor",
    label: "mdwButtonSecondaryColor",
    type: "color" as const,
  },
  {
    name: "mdwButtonColorPress",
    label: "mdwButtonColorPress",
    type: "color" as const,
  },
  {
    name: "textFontFamily",
    label: "textFontFamily",
    type: "fontname" as const,
  },
  { name: "textFontSize", label: "textFontSize", type: "number" as const },
  {
    name: "labelWidth",
    label: "labelWidth",
    type: "slider" as const,
    min: 0,
    max: 100,
    step: 1,
  },
  { name: "image", label: "image", type: "icon" as const },
  { name: "imageColor", label: "imageColor", type: "color" as const },
  {
    name: "iconPosition",
    label: "iconPosition",
    type: "select" as const,
    options: ["left", "right"],
    default: "left",
  },
  {
    name: "iconHeight",
    label: "iconHeight",
    type: "slider" as const,
    min: 0,
    max: 200,
    step: 1,
  },
];
const dialogFields = [
  {
    name: "dialogMaxWidth",
    label: "dialogMaxWidth",
    type: "dimension" as const,
  },
  { name: "viewHeight", label: "viewHeight", type: "dimension" as const },
  { name: "z_index", label: "z_index", type: "number" as const },
  {
    name: "closingClickOutside",
    label: "closingClickOutside",
    type: "checkbox" as const,
    default: true,
  },
  {
    name: "viewDistanceToBorder",
    label: "viewDistanceToBorder",
    type: "number" as const,
  },
  { name: "backgroundColor", label: "backgroundColor", type: "color" as const },
  { name: "headerHeight", label: "headerHeight", type: "number" as const },
  {
    name: "headerBackgroundColor",
    label: "headerBackgroundColor",
    type: "color" as const,
  },
  { name: "footerHeight", label: "footerHeight", type: "number" as const },
  {
    name: "footerBackgroundColor",
    label: "footerBackgroundColor",
    type: "color" as const,
  },
  { name: "showDivider", label: "showDivider", type: "checkbox" as const },
  { name: "dividerColor", label: "dividerColor", type: "color" as const },
  { name: "overlayColor", label: "overlayColor", type: "color" as const },
  {
    name: "overlayOpacity",
    label: "overlayOpacity",
    type: "slider" as const,
    min: 0,
    max: 1,
    step: 0.1,
  },
];
const closeFields = [
  {
    name: "buttonPosition",
    label: "buttonPosition",
    type: "select" as const,
    options: ["flex-start", "center", "flex-end"],
    default: "flex-end",
  },
  {
    name: "buttonSize",
    label: "buttonSize",
    type: "select" as const,
    options: ["small", "medium", "large"],
    default: "medium",
  },
  {
    name: "buttonFullWidth",
    label: "buttonFullWidth",
    type: "checkbox" as const,
  },
  { name: "buttonText", label: "buttonText", type: "html" as const },
  { name: "buttonFontSize", label: "buttonFontSize", type: "number" as const },
  { name: "buttonFont", label: "buttonFont", type: "fontname" as const },
  { name: "buttonFontColor", label: "buttonFontColor", type: "color" as const },
  { name: "pressColor", label: "pressColor", type: "color" as const },
  {
    name: "fullscreenCloseIcon",
    label: "fullscreenCloseIcon",
    type: "icon" as const,
    default: "close",
  },
  {
    name: "fullscreenCloseIconColor",
    label: "fullscreenCloseIconColor",
    type: "color" as const,
  },
];
export function dialogInfo(kind: Kind): RxWidgetInfo {
  const common = [
    {
      name: "showDialogMethod",
      label: "showDialogMethod",
      type: "select" as const,
      options: ["button", "datapoint"],
      default: "button",
    },
    { name: "showDialogOid", label: "showDialogOid", type: "id" as const },
    {
      name: "fullscreenResolutionLower",
      label: "fullscreenResolutionLower",
      type: "number" as const,
      default: 360,
    },
    {
      name: "vibrateOnMobilDevices",
      label: "vibrateOnMobilDevices",
      type: "number" as const,
      default: 50,
    },
    {
      name: "clickSoundPlay",
      label: "clickSoundPlay",
      type: "checkbox" as const,
    },
    {
      name: "clickSoundVolume",
      label: "clickSoundVolume",
      type: "slider" as const,
      min: 0,
      max: 1,
      step: 0.1,
      default: 0.5,
    },
    { name: "debug", label: "debug", type: "checkbox" as const },
  ];
  const iframe = [
    { name: "src", label: "src", type: "url" as const },
    { name: "noSandbox", label: "noSandbox", type: "checkbox" as const },
    { name: "scrollX", label: "scrollX", type: "checkbox" as const },
    { name: "scrollY", label: "scrollY", type: "checkbox" as const },
    { name: "seamless", label: "seamless", type: "checkbox" as const },
  ];
  return {
    ...createInfo(
      `tplVis2-materialdesign-Vuetify-Dialog-${kind === "view" ? "View" : "iFrame"}`,
      kind === "view" ? "Dialog" : "Dialog iFrame",
      [
        {
          name: "common",
          fields:
            kind === "view"
              ? [
                  ...common,
                  {
                    name: "contains_view",
                    label: "contains_view",
                    type: "views",
                  },
                ]
              : common,
        },
        ...(kind === "iframe"
          ? [{ name: "iFrame", label: "group_iFrame", fields: iframe }]
          : []),
        {
          name: "buttonLayout",
          label: "group_buttonLayout",
          fields: buttonFields,
        },
        {
          name: "layoutDialog",
          label: "group_layoutDialog",
          fields: dialogFields,
        },
        {
          name: "layoutTitle",
          label: "group_layoutTitle",
          fields: [
            {
              name: "showTitle",
              label: "showTitle",
              type: "checkbox",
              default: true,
            },
            { name: "title", label: "title", type: "html" },
            { name: "titleFontSize", label: "titleFontSize", type: "number" },
            { name: "titleFont", label: "titleFont", type: "fontname" },
            { name: "titleColor", label: "titleColor", type: "color" },
          ],
        },
        {
          name: "layoutdialogCloseButton",
          label: "group_layoutdialogCloseButton",
          fields: closeFields,
        },
      ],
    ),
    visPrev:
      '<img src="widgets/materialdesign/img/prev_dialog_view.png"></img>',
    visDefaultStyle: { width: 100, height: 30 },
  };
}
export class MaterialDesignDialog extends VisWidget {
  constructor(
    props: any,
    private readonly kind: Kind,
  ) {
    super(props);
  }
  private open = false;
  private readonly embeddedViewId = `materialdesign-dialog-view-${Math.random()
    .toString(36)
    .slice(2)}`;
  private renderedView = "";
  getWidgetInfo(): RxWidgetInfo {
    return dialogInfo(this.kind);
  }
  componentDidMount(): void {
    super.componentDidMount();
    this.renderEmbeddedView();
  }
  componentDidUpdate(): void {
    this.renderEmbeddedView();
  }
  private renderEmbeddedView(): void {
    const d = this.state.rxData as unknown as Data;
    const visible =
      s(d.showDialogMethod) === "datapoint"
        ? b(stateValue(this.state as VisRxWidgetState, s(d.showDialogOid)))
        : this.open;
    const view = s(d.contains_view);
    if (this.kind !== "view") return;
    if (!visible || !view) {
      this.renderedView = "";
      return;
    }
    if (view === this.renderedView) return;
    const vis = (
      window as unknown as {
        vis?: { renderView?: (viewDiv: string, view: string) => void };
      }
    ).vis;
    if (!vis?.renderView) return;
    vis.renderView(this.embeddedViewId, view);
    this.renderedView = view;
  }
  private feedback(d: Data): void {
    if (n(d.vibrateOnMobilDevices) > 0)
      navigator.vibrate?.(n(d.vibrateOnMobilDevices));
    if (b(d.clickSoundPlay)) {
      const a = new Audio(
        "widgets/vis2-materialdesign/materialdesign-widgets-click-sound.mp3",
      );
      a.volume = Math.max(0, Math.min(1, n(d.clickSoundVolume, 0.5)));
      void a.play().catch(() => undefined);
    }
  }
  renderWidgetBody(props: RenderProps): React.JSX.Element {
    super.renderWidgetBody(props);
    const d = this.state.rxData as unknown as Data;
    const byState = s(d.showDialogMethod) === "datapoint";
    const stateOpen = b(
      stateValue(this.state as VisRxWidgetState, s(d.showDialogOid)),
    );
    const visible = byState ? stateOpen : this.open;
    const close = () => {
      if (byState) setStateValue(this.props, s(d.showDialogOid), false);
      else {
        this.open = false;
        this.forceUpdate();
      }
    };
    const show = () => {
      this.feedback(d);
      this.open = true;
      this.forceUpdate();
    };
    const fullscreen =
      typeof window !== "undefined" &&
      window.innerWidth <= n(d.fullscreenResolutionLower, 0);
    const title = s(d.title, s(d.contains_view));
    const content =
      this.kind === "iframe" ? (
        <iframe
          className="iFrame_container"
          sandbox={
            b(d.noSandbox)
              ? undefined
              : "allow-modals allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts"
          }
          seamless={b(d.seamless)}
          src={s(d.src)}
          style={{
            border: 0,
            height: "100%",
            overflowX: b(d.scrollX) ? "scroll" : "hidden",
            overflowY: b(d.scrollY) ? "scroll" : "hidden",
            width: "100%",
          }}
        />
      ) : (
        <div
          id={this.embeddedViewId}
          className="v-dialog-view-container"
          style={{ height: s(d.viewHeight, "100%") }}
        />
      );
    return (
      <div
        className="materialdesign-widget materialdesign-vuetify-dialog"
        style={{ height: "100%", width: "100%" }}
      >
        {!byState ? (
          <button
            className={`materialdesign-${s(d.buttonStyle) === "icon" ? "icon-" : ""}button`}
            onClick={show}
            style={{
              background: s(d.mdwButtonPrimaryColor, "#44739e"),
              border: 0,
              color: s(d.mdwButtonSecondaryColor, "#fff"),
              fontFamily: s(d.textFontFamily),
              fontSize: n(d.textFontSize) || undefined,
              height: "100%",
              width: "100%",
            }}
          >
            {s(d.iconPosition, "left") === "left"
              ? renderIcon(
                  s(d.image),
                  s(d.imageColor),
                  n(d.iconHeight, 18),
                  !!d.imageColor,
                )
              : null}
            <span dangerouslySetInnerHTML={{ __html: s(d.buttontext) }} />
            {s(d.iconPosition) === "right"
              ? renderIcon(
                  s(d.image),
                  s(d.imageColor),
                  n(d.iconHeight, 18),
                  !!d.imageColor,
                )
              : null}
          </button>
        ) : null}
        {visible ? (
          <div
            className="v-overlay"
            onClick={() => b(d.closingClickOutside, true) && close()}
            style={{
              alignItems: fullscreen ? "stretch" : "center",
              background: s(d.overlayColor, "rgba(0,0,0,.5)"),
              display: "flex",
              inset: 0,
              justifyContent: "center",
              opacity: n(d.overlayOpacity, 0.6),
              position: "fixed",
              zIndex: n(d.z_index, 202),
            }}
          >
            <div
              className="v-dialog v-card"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: s(d.backgroundColor, "#fff"),
                display: "flex",
                flexDirection: "column",
                height: fullscreen ? "100%" : s(d.viewHeight, "auto"),
                maxWidth: s(d.dialogMaxWidth, fullscreen ? "100%" : "auto"),
                width: fullscreen ? "100%" : undefined,
              }}
            >
              {b(d.showTitle, true) ? (
                <header
                  style={{
                    background: s(d.headerBackgroundColor),
                    color: s(d.titleColor),
                    fontFamily: s(d.titleFont),
                    fontSize: n(d.titleFontSize, 20),
                    height: n(d.headerHeight, 50),
                    padding: "0 16px",
                  }}
                  dangerouslySetInnerHTML={{ __html: title }}
                />
              ) : null}
              <main style={{ flex: 1, padding: n(d.viewDistanceToBorder, 24) }}>
                {content}
              </main>
              <footer
                style={{
                  background: s(d.footerBackgroundColor),
                  display: "flex",
                  height: n(d.footerHeight, 56),
                  justifyContent: s(d.buttonPosition, "flex-end"),
                }}
              >
                {b(d.showDivider) ? (
                  <hr
                    style={{ borderColor: s(d.dividerColor), width: "100%" }}
                  />
                ) : null}
                <button
                  onClick={close}
                  style={{
                    color: s(d.buttonFontColor),
                    fontFamily: s(d.buttonFont),
                    fontSize: n(d.buttonFontSize) || undefined,
                    width: b(d.buttonFullWidth) ? "100%" : undefined,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: fullscreen ? "" : s(d.buttonText, "close"),
                  }}
                >
                  {fullscreen
                    ? renderIcon(
                        s(d.fullscreenCloseIcon, "close"),
                        s(d.fullscreenCloseIconColor),
                        20,
                        !!d.fullscreenCloseIconColor,
                      )
                    : null}
                </button>
              </footer>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}
