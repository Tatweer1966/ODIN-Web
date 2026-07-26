import type {
  GisLayerDefinition,
  GisLayerUpdate,
} from "../types/gis";

export class LayerModel {
  static create(
    layer: GisLayerDefinition,
  ): GisLayerDefinition {
    return LayerModel.clone(layer);
  }

  static clone(
    layer: GisLayerDefinition,
  ): GisLayerDefinition {
    return {
      ...layer,
      tags: layer.tags ? [...layer.tags] : undefined,
      metadata: layer.metadata
        ? { ...layer.metadata }
        : undefined,
    };
  }

  static update(
    current: GisLayerDefinition,
    update: GisLayerUpdate,
  ): GisLayerDefinition {
    return {
      ...current,
      ...update,
      id: current.id,
      tags:
        update.tags !== undefined
          ? [...update.tags]
          : current.tags
            ? [...current.tags]
            : undefined,
      metadata:
        update.metadata !== undefined
          ? { ...update.metadata }
          : current.metadata
            ? { ...current.metadata }
            : undefined,
      updatedAt: new Date(),
    };
  }

  static isVisible(
    layer: GisLayerDefinition,
  ): boolean {
    return layer.visible && layer.opacity > 0;
  }

  static canEdit(
    layer: GisLayerDefinition,
  ): boolean {
    return Boolean(
      layer.editable &&
        !layer.locked &&
        !layer.readOnly,
    );
  }

  static canSelect(
    layer: GisLayerDefinition,
  ): boolean {
    return Boolean(
      layer.selectable &&
        layer.visible &&
        layer.opacity > 0,
    );
  }

  static compareByOrder(
    first: GisLayerDefinition,
    second: GisLayerDefinition,
  ): number {
    if (first.order !== second.order) {
      return first.order - second.order;
    }

    return first.title.localeCompare(second.title);
  }
}