export enum LayerEventType {
  Added = "layer-added",
  Removed = "layer-removed",
  Updated = "layer-updated",
  VisibilityChanged = "layer-visibility",
  OpacityChanged = "layer-opacity",
  OrderChanged = "layer-order",
  ActiveChanged = "layer-active",
}

export interface LayerEvent<TPayload = unknown> {
  type: LayerEventType;
  layerId: string;
  payload?: TPayload;
}

export type LayerEventListener = (
  event: LayerEvent,
) => void;
