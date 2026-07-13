import type { RxWidgetInfo } from "@iobroker/types-vis-2";
import { MaterialDesignViews, viewsInfo } from "./MaterialDesignViews";

export default class MaterialDesignMasonryViews extends MaterialDesignViews {
  constructor(props: any) {
    super(props, "masonry");
  }
  static getWidgetInfo(): RxWidgetInfo {
    return viewsInfo("masonry");
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignMasonryViews.getWidgetInfo();
  }
}
