import type {
  GisLayerDefinition,
  GisLayerGroup,
} from "../types/gis";

import { LayerModel } from "../models";
import type { LayerRegistry } from "../services/LayerRegistry";

export class LayerSelectors {
  constructor(
    private readonly registry: LayerRegistry,
  ) {}

  getAll(): GisLayerDefinition[] {
    return this.registry.getLayers();
  }

  getById(
    id: string,
  ): GisLayerDefinition | undefined {
    return this.registry.getLayer(id);
  }

  getActive():
    | GisLayerDefinition
    | undefined {
    const activeId =
      this.registry.getSnapshot().activeLayerId;

    if (!activeId) {
      return undefined;
    }

    return this.registry.getLayer(activeId);
  }

  getVisible(): GisLayerDefinition[] {
    return this.registry
      .getLayers()
      .filter(LayerModel.isVisible);
  }

  getHidden(): GisLayerDefinition[] {
    return this.registry
      .getLayers()
      .filter(
        (layer) => !LayerModel.isVisible(layer),
      );
  }

  getLocked(): GisLayerDefinition[] {
    return this.registry
      .getLayers()
      .filter((layer) => layer.locked);
  }

  getUnlocked(): GisLayerDefinition[] {
    return this.registry
      .getLayers()
      .filter((layer) => !layer.locked);
  }

  getEditable(): GisLayerDefinition[] {
    return this.registry
      .getLayers()
      .filter(LayerModel.canEdit);
  }

  getSelectable(): GisLayerDefinition[] {
    return this.registry
      .getLayers()
      .filter(LayerModel.canSelect);
  }

  getByGroup(
    group: GisLayerGroup,
  ): GisLayerDefinition[] {
    return this.registry
      .getLayers()
      .filter(
        (layer) => layer.group === group,
      );
  }

  getOrdered(): GisLayerDefinition[] {
    return this.registry
      .getLayers()
      .sort(LayerModel.compareByOrder);
  }

  exists(id: string): boolean {
    return this.registry.hasLayer(id);
  }

  count(): number {
    return this.registry.getLayers().length;
  }

  featureCount(): number {
    return this.registry
      .getLayers()
      .reduce(
        (sum, layer) =>
          sum + (layer.featureCount ?? 0),
        0,
      );
  }
}