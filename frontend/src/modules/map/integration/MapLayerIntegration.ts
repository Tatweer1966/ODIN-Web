import type Map from "ol/Map";
import type BaseLayer from "ol/layer/Base";

import { LayerController } from "../engine/LayerController";
import { OpenLayersAdapter } from "../engine/OpenLayersAdapter";
import { layerRegistry } from "../services/layerRegistryInstance";
import type { GisLayerDefinition } from "../types/gis";

export type OpenLayersLayerBindings = Record<string, BaseLayer>;

export interface MapLayerIntegrationOptions {
  /**
   * When true, disposing or unbinding a layer also removes it from the map.
   *
   * Keep this false for the current operational map because the map bundle
   * owns the initial OpenLayers layers and destroys the map separately.
   */
  removeLayerFromMapOnUnbind?: boolean;

  /**
   * When true, unknown OpenLayers bundle layers are ignored.
   *
   * When false, initialization throws if a bundle layer is not registered
   * in the GIS LayerRegistry.
   */
  ignoreUnknownLayers?: boolean;

  /**
   * When true, registered GIS definitions without an OpenLayers binding are
   * allowed. This is required for newly imported or dynamically created
   * layers until their OpenLayers instances are created.
   */
  allowUnboundRegistryLayers?: boolean;
}

/**
 * Bridges the GIS LayerRegistry with an OpenLayers map.
 *
 * Responsibilities:
 * - Creates and owns the OpenLayersAdapter.
 * - Creates and owns the LayerController.
 * - Binds existing OpenLayers layers to registry definitions.
 * - Applies visibility, opacity, order and metadata synchronization.
 * - Exposes controlled access for future drawing/editing integrations.
 *
 * This class intentionally does not create OpenLayers layers from registry
 * definitions. Dynamic layer creation, including GeoJSON import, can be added
 * later through a dedicated layer factory.
 */
export class MapLayerIntegration {
  private readonly adapter: OpenLayersAdapter;

  private readonly controller: LayerController;

  private readonly options: Required<MapLayerIntegrationOptions>;

  private initialized = false;

  private disposed = false;

  constructor(
    private readonly map: Map,
    private readonly layers: OpenLayersLayerBindings,
    options: MapLayerIntegrationOptions = {},
  ) {
    this.options = {
      removeLayerFromMapOnUnbind:
        options.removeLayerFromMapOnUnbind ?? false,
      ignoreUnknownLayers: options.ignoreUnknownLayers ?? false,
      allowUnboundRegistryLayers:
        options.allowUnboundRegistryLayers ?? true,
    };

    this.adapter = new OpenLayersAdapter(this.map);

    this.controller = new LayerController(
      layerRegistry,
      this.adapter,
      {
        removeLayerFromMapOnUnbind:
          this.options.removeLayerFromMapOnUnbind,
      },
    );
  }

  /**
   * Initializes registry-to-OpenLayers synchronization.
   *
   * Safe to call more than once. Subsequent calls are ignored.
   */
  initialize(): void {
    this.assertNotDisposed();

    if (this.initialized) {
      return;
    }

    this.validateBindings();

    /*
     * Subscribe first so later registry changes are synchronized
     * automatically.
     */
    this.controller.initialize();

    const bindings = Object.entries(this.layers)
      .filter(([id]) => layerRegistry.hasLayer(id))
      .map(([id, layer]) => ({
        id,
        layer,
      }));

    this.controller.bindLayers(bindings);
    this.controller.synchronizeAll();

    this.initialized = true;
  }

  /**
   * Reapplies the current registry rendering state to every bound layer.
   */
  synchronize(): void {
    this.assertInitialized();
    this.controller.synchronizeAll();
  }

  /**
   * Reapplies the current registry state to one bound layer.
   */
  synchronizeLayer(id: string): void {
    this.assertInitialized();

    if (!layerRegistry.hasLayer(id)) {
      throw new Error(
        `Cannot synchronize unknown GIS layer "${id}".`,
      );
    }

    this.controller.synchronizeLayer(id);
  }

  /**
   * Binds a dynamically created OpenLayers layer to an existing registry
   * definition.
   *
   * This will be used later by GeoJSON import and drawing-layer creation.
   */
  bindLayer(id: string, layer: BaseLayer): void {
    this.assertInitialized();

    if (!layerRegistry.hasLayer(id)) {
      throw new Error(
        `Cannot bind OpenLayers layer "${id}" because it is not registered in the GIS layer registry.`,
      );
    }

    this.controller.bindLayer(id, layer);
  }

  /**
   * Unbinds a layer from the adapter.
   *
   * Whether the OpenLayers layer is removed from the map depends on the
   * removeLayerFromMapOnUnbind option.
   */
  unbindLayer(id: string): void {
    this.assertInitialized();
    this.controller.unbindLayer(id);
  }

  /**
   * Returns the OpenLayers layer associated with a GIS registry ID.
   */
  getLayer(id: string): BaseLayer | undefined {
    this.assertNotDisposed();
    return this.adapter.get(id);
  }

  /**
   * Returns the currently active GIS layer definition.
   */
  getActiveLayerDefinition(): GisLayerDefinition | undefined {
    this.assertNotDisposed();

    const activeLayerId = this.controller.getActiveLayerId();

    return activeLayerId
      ? layerRegistry.getLayer(activeLayerId)
      : undefined;
  }

  /**
   * Returns the OpenLayers layer associated with the active GIS layer.
   */
  getActiveOpenLayersLayer(): BaseLayer | undefined {
    this.assertNotDisposed();

    const activeLayerId = this.controller.getActiveLayerId();

    return activeLayerId
      ? this.adapter.get(activeLayerId)
      : undefined;
  }

  /**
   * Sets the active layer through the registry.
   */
  setActiveLayer(id?: string): void {
    this.assertInitialized();
    this.controller.setActiveLayer(id);
  }

  /**
   * Returns the OpenLayers map controlled by this integration.
   */
  getMap(): Map {
    this.assertNotDisposed();
    return this.map;
  }

  /**
   * Returns the layer controller for advanced integrations.
   *
   * Prefer the higher-level methods on MapLayerIntegration where possible.
   */
  getController(): LayerController {
    this.assertNotDisposed();
    return this.controller;
  }

  /**
   * Returns the OpenLayers adapter for advanced integrations.
   *
   * Prefer the higher-level methods on MapLayerIntegration where possible.
   */
  getAdapter(): OpenLayersAdapter {
    this.assertNotDisposed();
    return this.adapter;
  }

  /**
   * Returns all currently bound GIS layer IDs.
   */
  getBoundLayerIds(): string[] {
    this.assertNotDisposed();
    return this.controller.getBoundLayerIds();
  }

  /**
   * Checks whether a GIS layer is currently bound to OpenLayers.
   */
  isLayerBound(id: string): boolean {
    this.assertNotDisposed();
    return this.controller.isBound(id);
  }

  /**
   * Disposes subscriptions and adapter bindings.
   *
   * Safe to call more than once.
   */
  dispose(): void {
    if (this.disposed) {
      return;
    }

    if (this.initialized) {
      this.controller.dispose();
    }

    this.adapter.destroy();

    this.initialized = false;
    this.disposed = true;
  }

  private validateBindings(): void {
    const bundleLayerIds = Object.keys(this.layers);
    const registryLayerIds = new Set(
      layerRegistry.getLayers().map((layer) => layer.id),
    );

    const unknownBundleLayerIds = bundleLayerIds.filter(
      (id) => !registryLayerIds.has(id),
    );

    if (
      unknownBundleLayerIds.length > 0 &&
      !this.options.ignoreUnknownLayers
    ) {
      throw new Error(
        [
          "The operational map contains OpenLayers layers that are not registered in the GIS layer registry.",
          `Unknown layer IDs: ${unknownBundleLayerIds.join(", ")}`,
        ].join(" "),
      );
    }

    if (!this.options.allowUnboundRegistryLayers) {
      const bundleLayerIdSet = new Set(bundleLayerIds);

      const unboundRegistryLayerIds = Array.from(
        registryLayerIds,
      ).filter((id) => !bundleLayerIdSet.has(id));

      if (unboundRegistryLayerIds.length > 0) {
        throw new Error(
          [
            "The GIS layer registry contains definitions without matching OpenLayers layers.",
            `Unbound layer IDs: ${unboundRegistryLayerIds.join(", ")}`,
          ].join(" "),
        );
      }
    }
  }

  private assertInitialized(): void {
    this.assertNotDisposed();

    if (!this.initialized) {
      throw new Error(
        "MapLayerIntegration has not been initialized.",
      );
    }
  }

  private assertNotDisposed(): void {
    if (this.disposed) {
      throw new Error(
        "MapLayerIntegration has already been disposed.",
      );
    }
  }
}