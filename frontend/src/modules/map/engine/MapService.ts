import Map from "ol/Map";
import View from "ol/View";
import type { Coordinate } from "ol/coordinate";
import type { Extent } from "ol/extent";
import type BaseLayer from "ol/layer/Base";
import { fromLonLat } from "ol/proj";
import type Projection from "ol/proj/Projection";

import { OpenLayersAdapter } from "./OpenLayersAdapter";
import type { MapServiceOptions } from "./LayerTypes";

export class MapService {
  private map?: Map;

  private adapter?: OpenLayersAdapter;

  create(options: MapServiceOptions = {}): Map {
    if (this.map) {
      throw new Error(
        "The OpenLayers map has already been created.",
      );
    }

    const projection = options.projection ?? "EPSG:3857";
    const geographicCenter =
      options.center ?? [31.2357, 30.0444];

    const center =
      projection === "EPSG:4326"
        ? geographicCenter
        : fromLonLat(geographicCenter, projection);

    this.map = new Map({
      target: options.target,
      layers: options.layers ?? [],
      view: new View({
        projection,
        center,
        zoom: options.zoom ?? 6,
      }),
    });

    this.adapter = new OpenLayersAdapter(this.map);

    return this.map;
  }

  attach(map: Map): void {
    if (this.map) {
      throw new Error(
        "The MapService is already attached to an OpenLayers map.",
      );
    }

    this.map = map;
    this.adapter = new OpenLayersAdapter(map);
  }

  getMap(): Map {
    return this.requireMap();
  }

  getView(): View {
    return this.requireMap().getView();
  }

  getAdapter(): OpenLayersAdapter {
    if (!this.adapter) {
      throw new Error(
        "The OpenLayers layer adapter is not initialized.",
      );
    }

    return this.adapter;
  }

  setTarget(target?: HTMLElement | string): void {
    this.requireMap().setTarget(target);
  }

  registerLayer(id: string, layer: BaseLayer): void {
    this.getAdapter().register(id, layer);
  }

  removeLayer(id: string): void {
    this.getAdapter().unregister(id);
  }

  getLayer(id: string): BaseLayer | undefined {
    return this.getAdapter().get(id);
  }

  setLayerVisible(id: string, visible: boolean): void {
    this.getAdapter().setVisible(id, visible);
  }

  setLayerOpacity(id: string, opacity: number): void {
    this.getAdapter().setOpacity(id, opacity);
  }

  setLayerOrder(id: string, order: number): void {
    this.getAdapter().setZIndex(id, order);
  }

  setCenter(coordinate: Coordinate): void {
    this.getView().setCenter(coordinate);
  }

  setZoom(zoom: number): void {
    if (!Number.isFinite(zoom)) {
      throw new Error(`Invalid map zoom value "${zoom}".`);
    }

    this.getView().setZoom(zoom);
  }

  getZoom(): number | undefined {
    return this.getView().getZoom();
  }

  getResolution(): number | undefined {
    return this.getView().getResolution();
  }

  getProjection(): Projection {
    return this.getView().getProjection();
  }

  fitExtent(
    extent: Extent,
    options: {
      padding?: [number, number, number, number];
      duration?: number;
      maxZoom?: number;
    } = {},
  ): void {
    const map = this.requireMap();
    const size = map.getSize();

    if (!size) {
      throw new Error(
        "Cannot fit an extent before the map has a rendered size.",
      );
    }

    this.getView().fit(extent, {
      size,
      padding: options.padding ?? [48, 48, 48, 48],
      duration: options.duration ?? 350,
      maxZoom: options.maxZoom,
    });
  }

  zoomToLayer(
    id: string,
    options: {
      padding?: [number, number, number, number];
      duration?: number;
      maxZoom?: number;
    } = {},
  ): void {
    const layer = this.getAdapter().get(id);

    if (!layer) {
      throw new Error(
        `Cannot zoom to unregistered layer "${id}".`,
      );
    }

    const sourceCandidate = layer as BaseLayer & {
      getSource?: () => {
        getExtent?: () => Extent;
      } | null;
    };

    const source = sourceCandidate.getSource?.();
    const extent = source?.getExtent?.();

    if (!extent) {
      throw new Error(
        `GIS layer "${id}" does not expose a usable extent.`,
      );
    }

    this.fitExtent(extent, options);
  }

  updateSize(): void {
    this.requireMap().updateSize();
  }

  destroy(): void {
    this.adapter?.destroy();
    this.adapter = undefined;

    if (this.map) {
      this.map.setTarget(undefined);
      this.map.dispose();
      this.map = undefined;
    }
  }

  private requireMap(): Map {
    if (!this.map) {
      throw new Error(
        "The OpenLayers map has not been initialized.",
      );
    }

    return this.map;
  }
}
