import type BaseLayer from "ol/layer/Base";

import type { GisLayerDefinition, GisLayerSnapshot } from "../types/gis";
import type { LayerRegistry } from "../services/LayerRegistry";
import { OpenLayersAdapter } from "./OpenLayersAdapter";

export interface LayerControllerOptions {
  removeLayerFromMapOnUnbind?: boolean;
}

export class LayerController {
  private readonly boundLayerIds = new Set<string>();

  private unsubscribeRegistry?: () => void;

  private previousSnapshot?: GisLayerSnapshot;

  private initialized = false;

  private disposed = false;

  private readonly removeLayerFromMapOnUnbind: boolean;

  constructor(
    private readonly registry: LayerRegistry,
    private readonly adapter: OpenLayersAdapter,
    options: LayerControllerOptions = {},
  ) {
    this.removeLayerFromMapOnUnbind =
      options.removeLayerFromMapOnUnbind ?? true;
  }

  initialize(): void {
    this.assertNotDisposed();

    if (this.initialized) {
      return;
    }

    this.unsubscribeRegistry = this.registry.subscribe((snapshot) => {
      this.handleRegistrySnapshot(snapshot);
    });

    this.initialized = true;
  }

  bindLayer(id: string, layer: BaseLayer): void {
    this.assertNotDisposed();

    if (!this.registry.hasLayer(id)) {
      throw new Error(
        `Cannot bind OpenLayers layer "${id}" because it is not registered in the GIS layer registry.`,
      );
    }

    if (this.boundLayerIds.has(id) || this.adapter.has(id)) {
      throw new Error(
        `GIS layer "${id}" is already bound to OpenLayers.`,
      );
    }

    this.adapter.register(id, layer);
    this.boundLayerIds.add(id);

    const definition = this.registry.getLayer(id);

    if (definition) {
      this.applyDefinition(definition);
    }
  }

  bindLayers(
    bindings: ReadonlyArray<{
      id: string;
      layer: BaseLayer;
    }>,
  ): void {
    bindings.forEach(({ id, layer }) => {
      this.bindLayer(id, layer);
    });
  }

  unbindLayer(id: string): void {
    this.assertNotDisposed();

    if (!this.boundLayerIds.has(id) && !this.adapter.has(id)) {
      return;
    }

    if (this.removeLayerFromMapOnUnbind && this.adapter.has(id)) {
      this.adapter.unregister(id);
    }

    this.boundLayerIds.delete(id);
  }

  synchronizeLayer(id: string): void {
    this.assertNotDisposed();

    const definition = this.registry.getLayer(id);

    if (!definition) {
      throw new Error(
        `Cannot synchronize unknown GIS layer "${id}".`,
      );
    }

    if (!this.adapter.has(id)) {
      return;
    }

    this.applyDefinition(definition);
  }

  synchronizeAll(): void {
    this.assertNotDisposed();

    this.registry.getLayers().forEach((definition) => {
      if (this.adapter.has(definition.id)) {
        this.applyDefinition(definition);
      }
    });
  }

  setActiveLayer(id?: string): void {
    this.assertNotDisposed();
    this.registry.setActiveLayer(id);
  }

  getActiveLayerId(): string | undefined {
    return this.registry.getSnapshot().activeLayerId;
  }

  getBoundLayerIds(): string[] {
    return Array.from(this.boundLayerIds);
  }

  isBound(id: string): boolean {
    return this.boundLayerIds.has(id) && this.adapter.has(id);
  }

  zoomToLayer(
    id: string,
    fitExtent: (
      extent: [number, number, number, number],
    ) => void,
  ): void {
    this.assertNotDisposed();

    const layer = this.adapter.get(id);

    if (!layer) {
      throw new Error(
        `Cannot zoom to unbound GIS layer "${id}".`,
      );
    }

    const sourceLayer = layer as BaseLayer & {
      getSource?: () => {
        getExtent?: () => [number, number, number, number];
      } | null;
    };

    const extent = sourceLayer.getSource?.()?.getExtent?.();

    if (!extent) {
      throw new Error(
        `GIS layer "${id}" does not provide a usable extent.`,
      );
    }

    fitExtent(extent);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.unsubscribeRegistry?.();
    this.unsubscribeRegistry = undefined;

    for (const id of Array.from(this.boundLayerIds)) {
      if (this.removeLayerFromMapOnUnbind && this.adapter.has(id)) {
        this.adapter.unregister(id);
      }
    }

    this.boundLayerIds.clear();
    this.previousSnapshot = undefined;
    this.initialized = false;
    this.disposed = true;
  }

  private handleRegistrySnapshot(snapshot: GisLayerSnapshot): void {
    if (this.disposed) {
      return;
    }

    const previousLayers = new Map(
      this.previousSnapshot?.layers.map((layer) => [
        layer.id,
        layer,
      ]) ?? [],
    );

    const currentLayerIds = new Set(
      snapshot.layers.map((layer) => layer.id),
    );

    for (const definition of snapshot.layers) {
      if (!this.adapter.has(definition.id)) {
        continue;
      }

      const previousDefinition = previousLayers.get(definition.id);

      if (
        !previousDefinition ||
        this.hasRenderingChange(
          previousDefinition,
          definition,
        )
      ) {
        this.applyDefinition(definition);
      }
    }

    for (const previousLayer of previousLayers.values()) {
      if (
        !currentLayerIds.has(previousLayer.id) &&
        this.adapter.has(previousLayer.id)
      ) {
        this.adapter.unregister(previousLayer.id);
        this.boundLayerIds.delete(previousLayer.id);
      }
    }

    this.previousSnapshot = this.cloneSnapshot(snapshot);
  }

  private applyDefinition(
    definition: GisLayerDefinition,
  ): void {
    this.adapter.synchronize(definition.id, {
      visible: definition.visible,
      opacity: definition.opacity,
      order: definition.order,
    });

    const layer = this.adapter.get(definition.id);

    if (!layer) {
      return;
    }

    layer.set("jcwsLayerTitle", definition.title);
    layer.set("jcwsLayerGroup", definition.group);
    layer.set("jcwsLayerKind", definition.kind);
    layer.set("jcwsLayerLocked", definition.locked);
    layer.set("jcwsLayerSecurity", definition.security);
    layer.set(
      "jcwsLayerFeatureCount",
      definition.featureCount ?? 0,
    );
    layer.set("jcwsLayerSelectable", definition.selectable ?? true);
    layer.set("jcwsLayerEditable", definition.editable ?? false);
  }

  private hasRenderingChange(
    previous: GisLayerDefinition,
    current: GisLayerDefinition,
  ): boolean {
    return (
      previous.visible !== current.visible ||
      previous.opacity !== current.opacity ||
      previous.order !== current.order ||
      previous.title !== current.title ||
      previous.group !== current.group ||
      previous.kind !== current.kind ||
      previous.locked !== current.locked ||
      previous.security !== current.security ||
      previous.featureCount !== current.featureCount ||
      previous.selectable !== current.selectable ||
      previous.editable !== current.editable
    );
  }

  private cloneSnapshot(
    snapshot: GisLayerSnapshot,
  ): GisLayerSnapshot {
    return {
      activeLayerId: snapshot.activeLayerId,
      revision: snapshot.revision,
      layers: snapshot.layers.map((layer) => ({
        ...layer,
        metadata: layer.metadata
          ? { ...layer.metadata }
          : undefined,
      })),
    };
  }

  private assertNotDisposed(): void {
    if (this.disposed) {
      throw new Error(
        "The GIS LayerController has been disposed.",
      );
    }
  }
}
