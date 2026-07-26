import type {
  GisLayerDefinition,
  GisLayerUpdate,
} from "../types/gis";

import { LayerModel } from "../models";
import type { LayerRegistry } from "../services/LayerRegistry";

export class LayerCommands {
  constructor(
    private readonly registry: LayerRegistry,
  ) {}

  addLayer(layer: GisLayerDefinition): void {
    this.registry.register(
      LayerModel.create(layer),
    );
  }

  addLayers(
    layers: GisLayerDefinition[],
  ): void {
    this.registry.registerMany(
      layers.map((l) => LayerModel.create(l)),
    );
  }

  removeLayer(id: string): void {
    this.registry.remove(id);
  }

  renameLayer(
    id: string,
    title: string,
  ): void {
    this.registry.update(id, {
      title,
    });
  }

  updateLayer(
    id: string,
    update: GisLayerUpdate,
  ): void {
    const layer = this.requireLayer(id);

    this.registry.update(
      id,
      LayerModel.update(layer, update),
    );
  }

  toggleVisibility(id: string): void {
    const layer = this.requireLayer(id);

    this.registry.setVisibility(
      id,
      !layer.visible,
    );
  }

  showLayer(id: string): void {
    this.registry.setVisibility(id, true);
  }

  hideLayer(id: string): void {
    this.registry.setVisibility(id, false);
  }

  toggleLock(id: string): void {
    const layer = this.requireLayer(id);

    this.registry.setLocked(
      id,
      !layer.locked,
    );
  }

  setOpacity(
    id: string,
    opacity: number,
  ): void {
    this.registry.setOpacity(
      id,
      opacity,
    );
  }

  moveLayer(
    id: string,
    order: number,
  ): void {
    this.registry.moveLayer(
      id,
      order,
    );
  }

  setActiveLayer(
    id?: string,
  ): void {
    this.registry.setActiveLayer(id);
  }

  incrementFeatureCount(
    id: string,
    amount = 1,
  ): void {
    this.registry.incrementFeatureCount(
      id,
      amount,
    );
  }

  private requireLayer(
    id: string,
  ): GisLayerDefinition {
    const layer =
      this.registry.getLayer(id);

    if (!layer) {
      throw new Error(
        `Layer "${id}" is not registered.`,
      );
    }

    return layer;
  }
}