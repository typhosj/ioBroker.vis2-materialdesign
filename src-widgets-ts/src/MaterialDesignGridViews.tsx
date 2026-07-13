import type { RxWidgetInfo } from "@iobroker/types-vis-2";
import { MaterialDesignViews, viewsInfo } from "./MaterialDesignViews";

export default class MaterialDesignGridViews extends MaterialDesignViews {
  constructor(props: any) {
    super(props, "grid");
  }
  static getWidgetInfo(): RxWidgetInfo {
    return viewsInfo("grid");
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignGridViews.getWidgetInfo();
  }
}
