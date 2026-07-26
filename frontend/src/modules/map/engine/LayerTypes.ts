import type Map from "ol/Map";
import type BaseLayer from "ol/layer/Base";

export interface LayerBinding {
  id: string;
  layer: BaseLayer;
}

export interface LayerEngineContext {
  map: Map;
}

export interface MapServiceOptions {
  target?: HTMLElement | string;
  layers?: BaseLayer[];
  center?: [number, number];
  zoom?: number;
  projection?: string;
}
