import { useSyncExternalStore } from "react";

import { layerRegistry } from "../services/layerRegistryInstance";
import type { GisLayerSnapshot } from "../types/gis";

let cachedSnapshot: GisLayerSnapshot = layerRegistry.getSnapshot();

layerRegistry.subscribe((snapshot) => {
  cachedSnapshot = snapshot;
});

function subscribe(onStoreChange: () => void): () => void {
  return layerRegistry.subscribe((snapshot) => {
    cachedSnapshot = snapshot;
    onStoreChange();
  });
}

function getSnapshot(): GisLayerSnapshot {
  return cachedSnapshot;
}

export function useLayerRegistry(): GisLayerSnapshot {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );
}
