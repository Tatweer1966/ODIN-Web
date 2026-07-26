import { useMemo } from "react";

import { layerRegistry } from "../services/layerRegistryInstance";
import { LayerCommands } from "../commands";
import { LayerSelectors } from "../selectors";
import { useLayerRegistry } from "./useLayerRegistry";

export function useLayers() {
  const snapshot = useLayerRegistry();

  const commands = useMemo(
    () => new LayerCommands(layerRegistry),
    [],
  );

  const selectors = useMemo(
    () => new LayerSelectors(layerRegistry),
    [],
  );

  return {
    snapshot,

    layers: snapshot.layers,
    activeLayer:
      snapshot.layers.find(
        l => l.id === snapshot.activeLayerId,
      ),

    commands,
    selectors,
  };
}