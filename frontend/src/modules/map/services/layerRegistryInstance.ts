import { defaultGisLayers } from "../layers/defaultLayers";
import { LayerRegistry } from "./LayerRegistry";

export const layerRegistry = new LayerRegistry(defaultGisLayers);
