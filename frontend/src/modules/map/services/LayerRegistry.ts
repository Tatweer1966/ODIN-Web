import type {
  GisLayerDefinition,
  GisLayerSnapshot,
  GisLayerUpdate,
} from "../types/gis";

export type LayerRegistryListener = (
  snapshot: GisLayerSnapshot,
) => void;

function cloneLayer(layer: GisLayerDefinition): GisLayerDefinition {
  return {
    ...layer,
    metadata: layer.metadata ? { ...layer.metadata } : undefined,
  };
}

function normalizeOpacity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(1, Math.max(0, value));
}

export class LayerRegistry {
  private readonly layers = new Map<string, GisLayerDefinition>();

  private readonly listeners = new Set<LayerRegistryListener>();

  private activeLayerId?: string;

  private revision = 0;

  constructor(initialLayers: GisLayerDefinition[] = []) {
    initialLayers.forEach((layer) => {
      this.layers.set(layer.id, this.normalizeLayer(layer));
    });
  }

  subscribe(listener: LayerRegistryListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());

    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): GisLayerSnapshot {
    return {
      layers: this.getLayers(),
      activeLayerId: this.activeLayerId,
      revision: this.revision,
    };
  }

  getLayers(): GisLayerDefinition[] {
    return Array.from(this.layers.values())
      .map(cloneLayer)
      .sort((left, right) => left.order - right.order);
  }

  getLayer(id: string): GisLayerDefinition | undefined {
    const layer = this.layers.get(id);
    return layer ? cloneLayer(layer) : undefined;
  }

  hasLayer(id: string): boolean {
    return this.layers.has(id);
  }

  register(layer: GisLayerDefinition): void {
    if (this.layers.has(layer.id)) {
      throw new Error(`GIS layer "${layer.id}" is already registered.`);
    }

    this.layers.set(layer.id, this.normalizeLayer(layer));
    this.bumpRevision();
  }

  registerMany(layers: GisLayerDefinition[]): void {
    layers.forEach((layer) => {
      if (this.layers.has(layer.id)) {
        throw new Error(`GIS layer "${layer.id}" is already registered.`);
      }
    });

    layers.forEach((layer) => {
      this.layers.set(layer.id, this.normalizeLayer(layer));
    });

    this.bumpRevision();
  }

  update(id: string, update: GisLayerUpdate): void {
    const current = this.requireLayer(id);

    this.layers.set(
      id,
      this.normalizeLayer({
        ...current,
        ...update,
        metadata:
          update.metadata === undefined
            ? current.metadata
            : {
                ...current.metadata,
                ...update.metadata,
              },
      }),
    );

    this.bumpRevision();
  }

  remove(id: string): void {
    const layer = this.requireLayer(id);

    if (layer.removable === false) {
      throw new Error(`GIS layer "${id}" cannot be removed.`);
    }

    this.layers.delete(id);

    if (this.activeLayerId === id) {
      this.activeLayerId = undefined;
    }

    this.bumpRevision();
  }

  setActiveLayer(id?: string): void {
    if (id !== undefined) {
      this.requireLayer(id);
    }

    this.activeLayerId = id;
    this.bumpRevision();
  }

  setVisibility(id: string, visible: boolean): void {
    this.update(id, { visible });
  }

  setLocked(id: string, locked: boolean): void {
    this.update(id, { locked });
  }

  setOpacity(id: string, opacity: number): void {
    this.update(id, { opacity: normalizeOpacity(opacity) });
  }

  moveLayer(id: string, newOrder: number): void {
    this.update(id, { order: newOrder });
  }

  incrementFeatureCount(id: string, amount = 1): void {
    const layer = this.requireLayer(id);
    const currentCount = layer.featureCount ?? 0;

    this.update(id, {
      featureCount: Math.max(0, currentCount + amount),
    });
  }

  clear(): void {
    this.layers.clear();
    this.activeLayerId = undefined;
    this.bumpRevision();
  }

  private requireLayer(id: string): GisLayerDefinition {
    const layer = this.layers.get(id);

    if (!layer) {
      throw new Error(`GIS layer "${id}" is not registered.`);
    }

    return layer;
  }

  private normalizeLayer(
    layer: GisLayerDefinition,
  ): GisLayerDefinition {
    return {
      ...cloneLayer(layer),
      opacity: normalizeOpacity(layer.opacity),
      order: Number.isFinite(layer.order) ? layer.order : 0,
      featureCount: Math.max(0, layer.featureCount ?? 0),
      security: layer.security ?? "UNCLASSIFIED",
    };
  }

  private bumpRevision(): void {
    this.revision += 1;
    const snapshot = this.getSnapshot();

    this.listeners.forEach((listener) => {
      listener(snapshot);
    });
  }
}
