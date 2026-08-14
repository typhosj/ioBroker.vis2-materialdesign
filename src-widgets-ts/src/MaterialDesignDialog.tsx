import React from "react";
import { squarePreview ,
  RenderProps,
  VisWidget,
  createInfo,
  designStyle,
  designStyleClasses,
  setStateValue,
  sizeCss,
  stateValue, accessibleText, sanitizeHtml, iconField, liftWidgetLayer } from './widgetUtils';
import type { RxWidgetInfo } from "@iobroker/types-vis-2";
import { renderIcon } from "./MaterialDesignButtons";

type Kind = "view" | "iframe";
type Data = Record<string, unknown> & {
  showDialogMethod?: string;
  showDialogOid?: string;
  contains_view?: string;
  src?: string;
};
const s = (v: unknown, d = ""): string =>
  v === undefined || v === null || v === "" || v === "null" ? d : typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" || typeof v === "bigint" ? String(v) : d;
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
  iconField("image", "image"),
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
  {
    name: "fullscreenCloseIconPressColor",
    label: "fullscreenCloseIconPressColor",
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
      ["buttonLayout", "layoutTitle", "layoutdialogCloseButton"],
    ),
    visPrev: squarePreview('F10AC'),
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
  private pressClose = false;
  private readonly viewRef = React.createRef<HTMLDivElement>();
  private readonly cardRef = React.createRef<HTMLDivElement>();
  private trigger: HTMLElement | null = null;
  private trapped = false;
  private measuredH = 0;
  private polling = false;
  private measureTimer?: number;
  getWidgetInfo(): RxWidgetInfo {
    return dialogInfo(this.kind);
  }
  componentDidMount(): void {
    super.componentDidMount();
    this.startMeasure();
    this.syncModalFocus();
  }
  componentDidUpdate(): void {
    this.startMeasure();
    this.syncModalFocus();
  }
  componentWillUnmount(): void {
    if (this.measureTimer !== undefined) window.clearTimeout(this.measureTimer);
    this.measureTimer = undefined;
    this.polling = false;
    super.componentWillUnmount?.();
  }
  // VIS2 views position widgets absolutely, so the embedded view has no intrinsic height and loads
  // asynchronously; poll scrollHeight and size the container to it.
  private startMeasure(): void {
    if (this.kind !== "view") return;
    if (!this.viewRef.current) {
      this.measuredH = 0;
      this.polling = false;
      return;
    }
    if (this.polling) return;
    this.polling = true;
    let ticks = 0;
    const tick = (): void => {
      const el = this.viewRef.current;
      if (!el) {
        this.measureTimer = undefined;
        this.polling = false;
        return;
      }
      const h = el.scrollHeight;
      if (h && Math.abs(h - this.measuredH) > 1) {
        this.measuredH = h;
        this.forceUpdate();
      }
      if (++ticks < 14) {
        this.measureTimer = window.setTimeout(tick, 120);
      } else {
        this.measureTimer = undefined;
        this.polling = false;
      }
    };
    tick();
  }
  // The widget dialog is a plain overlay div, not the native <dialog>, so focus move, restore and
  // the Tab wrap are ours. Focus inside an embedded iframe stays the browser's business.
  private focusable(root: HTMLElement): HTMLElement[] {
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])',
      ),
    ).filter(element => element.offsetParent !== null || element.tagName === "IFRAME");
  }
  private syncModalFocus(): void {
    if (typeof document === "undefined") return;
    const card = this.cardRef.current;
    if (card && !this.trapped) {
      this.trapped = true;
      this.trigger = document.activeElement as HTMLElement | null;
      (this.focusable(card)[0] ?? card).focus();
    } else if (!card && this.trapped) {
      this.trapped = false;
      this.trigger?.focus?.();
      this.trigger = null;
    }
  }
  private trapFocus(event: React.KeyboardEvent<HTMLDivElement>, close: () => void): void {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const items = this.focusable(event.currentTarget);
    if (!items.length) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === event.currentTarget)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
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
    const isM3 = designStyle(d) === "material3";
    const triggerStyle = s(d.buttonStyle, "raised");
    const triggerIsIcon = triggerStyle === "icon";
    const triggerOutlined = triggerStyle === "outlined";
    const triggerFlat = triggerOutlined || triggerStyle === "text" || triggerIsIcon;
    const triggerM3Variant = triggerStyle === "text" ? "text" : triggerOutlined ? "outlined" : "filled";
    const byState = s(d.showDialogMethod) === "datapoint";
    const stateOpen = b(
      stateValue(this.state, s(d.showDialogOid)),
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
    const view = s(d.contains_view);
    const title = s(d.title, view);
    const bodyW = fullscreen ? "100%" : s(d.dialogMaxWidth, "96vw");
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
            height: fullscreen ? "100%" : s(d.viewHeight, "400px"),
            overflowX: b(d.scrollX) ? "scroll" : "hidden",
            overflowY: b(d.scrollY) ? "scroll" : "hidden",
            width: "100%",
          }}
        />
      ) : (
        <div
          className="v-dialog-view-container"
          ref={this.viewRef}
          style={{
            height: s(d.viewHeight) || this.measuredH || undefined,
            overflow: "hidden",
            position: "relative",
            width: "100%",
          }}
        >
          {visible && view
            ? (
                this as unknown as {
                  getWidgetView: (
                    v: string,
                    p?: Record<string, unknown>,
                  ) => React.JSX.Element;
                }
              ).getWidgetView(view, {
                style: { width: "100%", height: "100%" },
              })
            : null}
        </div>
      );
    return (
      <div
        className={`materialdesign-widget materialdesign-vuetify-dialog${isM3 ? ` ${designStyleClasses(d, this.isDarkTheme())}` : ""}`}
        ref={(element) => liftWidgetLayer(element, visible ? n(d.z_index, 202) : null)}
        style={{ height: "100%", width: "100%" }}
      >
        {!byState ? (
          <button
            className={`materialdesign-${triggerIsIcon ? "icon-" : ""}button${isM3 ? (triggerIsIcon ? " mdw-md3-icon-button mdw-state-layer" : ` mdw-md3-button mdw-md3-button--${triggerM3Variant} mdw-state-layer`) : ""}`}
            onClick={show}
            style={{
              // `buttonStyle` selected the icon shape and was otherwise ignored: text, raised, unelevated and
              // outlined all rendered the same filled button.
              background: triggerFlat ? "transparent" : s(d.mdwButtonPrimaryColor, isM3 ? undefined : "#44739e"),
              border: triggerOutlined ? `1px solid ${s(d.mdwButtonSecondaryColor, isM3 ? "var(--md-sys-color-outline)" : "#44739e")}` : 0,
              borderRadius: isM3 ? undefined : triggerIsIcon ? "50%" : 4,
              boxShadow: !isM3 && triggerStyle === "raised" ? "0 3px 1px -2px rgba(0,0,0,.2),0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12)" : undefined,
              color: s(d.mdwButtonSecondaryColor, isM3 ? undefined : triggerFlat ? "#44739e" : "#fff"),
              fontFamily: s(d.textFontFamily),
              fontSize: d.textFontSize ? sizeCss(d.textFontSize, 14) : undefined,
              height: "100%",
              width: "100%",
            }}
          >
            {s(d.iconPosition, "left") === "left"
              ? renderIcon(
                  s(d.image),
                  s(d.imageColor, isM3 ? "currentColor" : triggerFlat ? "#44739e" : ""),
                  n(d.iconHeight, 18),
                  !!d.imageColor,
                )
              : null}
            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(s(d.buttontext)) }} />
            {s(d.iconPosition) === "right"
              ? renderIcon(
                  s(d.image),
                  s(d.imageColor, isM3 ? "currentColor" : triggerFlat ? "#44739e" : ""),
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
              background: s(d.overlayColor, isM3 ? "var(--md-sys-color-scrim)" : "rgba(0,0,0,.5)"),
              display: "flex",
              inset: 0,
              justifyContent: "center",
              opacity: n(d.overlayOpacity, 0.6),
              position: "fixed",
              zIndex: n(d.z_index, 202),
            }}
          >
            <div
              aria-label={accessibleText(title, "Dialog")}
              aria-modal="true"
              className="v-dialog v-card"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(event) => this.trapFocus(event, close)}
              ref={this.cardRef}
              role="dialog"
              tabIndex={-1}
              style={{
                background: s(d.backgroundColor, isM3 ? "var(--md-sys-color-surface-container-high)" : "#fff"),
                borderRadius: isM3 ? "var(--md-sys-shape-corner-extra-large)" : 4,
                boxShadow:
                  "0 11px 15px -7px rgba(0,0,0,.2),0 24px 38px 3px rgba(0,0,0,.14),0 9px 46px 8px rgba(0,0,0,.12)",
                display: "flex",
                flexDirection: "column",
                height: fullscreen ? "100%" : "auto",
                maxHeight: fullscreen ? "100%" : "90vh",
                maxWidth: fullscreen ? "100%" : "96vw",
                overflow: "hidden",
                width: bodyW,
              }}
            >
              {b(d.showTitle, true) ? (
                <header
                  // Size and weight stay unset so the stylesheet supplies the whole role, but only while the user
                  // set no size of their own (compat rule #5).
                  className={isM3 ? "mdw-md3-dialog-headline" : undefined}
                  style={{
                    alignItems: "center",
                    background: s(d.headerBackgroundColor),
                    color: s(d.titleColor, isM3 ? "var(--md-sys-color-on-surface)" : "#44739e"),
                    display: "flex",
                    fontFamily: s(d.titleFont),
                    fontSize: isM3 && !s(d.titleFontSize) ? undefined : sizeCss(d.titleFontSize, 16),
                    fontWeight: isM3 ? undefined : 500,
                    height: n(d.headerHeight, 50),
                    padding: "0 24px",
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }}
                />
              ) : null}
              <main style={{ flex: 1, minHeight: 0, overflow: "auto", padding: n(d.viewDistanceToBorder, 24) }}>
                {content}
              </main>
              <footer
                style={{
                  alignItems: "center",
                  background: s(d.footerBackgroundColor),
                  display: "flex",
                  height: n(d.footerHeight, 56),
                  justifyContent: s(d.buttonPosition, "flex-end"),
                  padding: "0 8px",
                }}
              >
                {b(d.showDivider) ? (
                  <hr
                    style={{ borderColor: s(d.dividerColor, isM3 ? "var(--md-sys-color-outline-variant)" : ""), width: "100%" }}
                  />
                ) : null}
                <button
                  className={isM3 ? "mdw-md3-dialog-button" : undefined}
                  onClick={close}
                  onPointerDown={fullscreen ? () => { this.pressClose = true; this.forceUpdate(); } : undefined}
                  onPointerUp={fullscreen ? () => { this.pressClose = false; this.forceUpdate(); } : undefined}
                  onPointerLeave={fullscreen ? () => { if (this.pressClose) { this.pressClose = false; this.forceUpdate(); } } : undefined}
                  style={{
                    background: "transparent",
                    border: 0,
                    borderRadius: 4,
                    color: s(d.buttonFontColor, isM3 ? "var(--md-sys-color-primary)" : "#44739e"),
                    cursor: "pointer",
                    fontFamily: s(d.buttonFont),
                    fontSize: isM3 && !s(d.buttonFontSize) ? undefined : sizeCss(d.buttonFontSize, 16),
                    fontWeight: isM3 ? undefined : 500,
                    height: 36,
                    minWidth: 64,
                    padding: "0 16px",
                    textTransform: isM3 ? undefined : "uppercase",
                    width: b(d.buttonFullWidth) ? "100%" : undefined,
                  }}
                  // A button can carry EITHER dangerouslySetInnerHTML OR children, never both (React #60).
                  {...(fullscreen
                    ? {}
                    : { dangerouslySetInnerHTML: { __html: sanitizeHtml(s(d.buttonText, "close")) } })}
                >
                  {fullscreen
                    ? renderIcon(
                        s(d.fullscreenCloseIcon, "close"),
                        this.pressClose && s(d.fullscreenCloseIconPressColor)
                          ? s(d.fullscreenCloseIconPressColor)
                          : s(d.fullscreenCloseIconColor, isM3 ? "var(--md-sys-color-on-surface-variant)" : ""),
                        20,
                        this.pressClose && s(d.fullscreenCloseIconPressColor)
                          ? true
                          : !!d.fullscreenCloseIconColor,
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
