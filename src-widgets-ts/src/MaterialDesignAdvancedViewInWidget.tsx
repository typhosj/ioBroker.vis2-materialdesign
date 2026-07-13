import type { RxWidgetInfo } from "@iobroker/types-vis-2";
import {
  advancedViewInfo,
  MaterialDesignAdvancedView,
} from "./MaterialDesignAdvancedView";
export default class MaterialDesignAdvancedViewInWidget extends MaterialDesignAdvancedView {
  constructor(props: any) {
    super(props, "state");
  }
  static getWidgetInfo(): RxWidgetInfo {
    return advancedViewInfo("state");
  }
  getWidgetInfo(): RxWidgetInfo {
    return MaterialDesignAdvancedViewInWidget.getWidgetInfo();
  }
}
