import type OlMap from "ol/Map";
import type BaseLayer from "ol/layer/Base";

import type { LayerAdapter } from "./LayerAdapter";
import {
  LayerEventType,
  type LayerEvent,
  type LayerEventListener,
} from "./LayerEvents";

function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(1, Math.max(0, value));
}

export class OpenLayersAdapter implements LayerAdapter {
  private readonly bindings = new Map<string, BaseLayer>();

  private readonly listeners = new Set<LayerEventListener>();

  private destroyed = false;

  constructor(private readonly map: OlMap) {}

  subscribe(listener: LayerEventListener): () => void {
    this.assertAvailable();

    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  register(id: string, layer: BaseLayer): void {
    this.assertAvailable();

    if (!id.trim()) {
      throw new Error("A GIS layer binding must have an ID.");
    }

    if (this.bindings.has(id)) {
      throw new Error(
        `OpenLayers layer "${id}" is already registered.`,
      );
    }

    const existingLayerId = layer.get("jcwsLayerId");

    if (
      typeof existingLayerId === "string" &&
      existingLayerId !== id
    ) {
      throw new Error(
        `The OpenLayers layer is already bound to "${existingLayerId}".`,
      );
    }

    layer.set("jcwsLayerId", id);
    this.bindings.set(id, layer);

    const mapLayers = this.map.getLayers();

    if (!mapLayers.getArray().includes(layer)) {
      mapLayers.push(layer);
    }

    this.emit({
      type: LayerEventType.Added,
      layerId: id,
      payload: { layer },
    });
  }

  unregister(id: string): void {
    this.assertAvailable();

    const layer = this.requireLayer(id);

    this.map.removeLayer(layer);
    this.bindings.delete(id);
    layer.unset("jcwsLayerId");

    this.emit({
      type: LayerEventType.Removed,
      layerId: id,
      payload: { layer },
    });
  }

  get(id: string): BaseLayer | undefined {
    this.assertAvailable();
    return this.bindings.get(id);
  }

  has(id: string): boolean {
    this.assertAvailable();
    return this.bindings.has(id);
  }

  getAll(): BaseLayer[] {
    this.assertAvailable();
    return Array.from(this.bindings.values());
  }

  setVisible(id: string, visible: boolean): void {
    this.assertAvailable();

    const layer = this.requireLayer(id);

    if (layer.getVisible() === visible) {
      return;
    }

    layer.setVisible(visible);

    this.emit({
      type: LayerEventType.VisibilityChanged,
      layerId: id,
      payload: { visible },
    });
  }

  setOpacity(id: string, opacity: number): void {
    this.assertAvailable();

    const layer = this.requireLayer(id);
    const normalizedOpacity = clampOpacity(opacity);

    if (layer.getOpacity() === normalizedOpacity) {
      return;
    }

    layer.setOpacity(normalizedOpacity);

    this.emit({
      type: LayerEventType.OpacityChanged,
      layerId: id,
      payload: { opacity: normalizedOpacity },
    });
  }

  setZIndex(id: string, order: number): void {
    this.assertAvailable();

    if (!Number.isFinite(order)) {
      throw new Error(
        `Invalid z-index "${order}" for GIS layer "${id}".`,
      );
    }

    const layer = this.requireLayer(id);

    if (layer.getZIndex() === order) {
      return;
    }

    layer.setZIndex(order);

    this.emit({
      type: LayerEventType.OrderChanged,
      layerId: id,
      payload: { order },
    });
  }

  synchronize(
    id: string,
    options: {
      visible?: boolean;
      opacity?: number;
      order?: number;
    },
  ): void {
    if (options.visible !== undefined) {
      this.setVisible(id, options.visible);
    }

    if (options.opacity !== undefined) {
      this.setOpacity(id, options.opacity);
    }

    if (options.order !== undefined) {
      this.setZIndex(id, options.order);
    }

    this.emit({
      type: LayerEventType.Updated,
      layerId: id,
      payload: options,
    });
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    for (const [id, layer] of this.bindings.entries()) {
      this.map.removeLayer(layer);
      layer.unset("jcwsLayerId");

      this.emit({
        type: LayerEventType.Removed,
        layerId: id,
        payload: { layer },
      });
    }

    this.bindings.clear();
    this.listeners.clear();
    this.destroyed = true;
  }

  private requireLayer(id: string): BaseLayer {
    const layer = this.bindings.get(id);

    if (!layer) {
      throw new Error(
        `OpenLayers layer "${id}" is not registered.`,
      );
    }

    return layer;
  }

  private emit(event: LayerEvent): void {
    this.listeners.forEach((listener) => {
      listener(event);
    });
  }

  private assertAvailable(): void {
    if (this.destroyed) {
      throw new Error(
        "The OpenLayers layer adapter has been destroyed.",
      );
    }
  }
}

