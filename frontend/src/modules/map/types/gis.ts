export type CoordinateFormat =
  | "WGS84_DD"
  | "WGS84_DMS"
  | "UTM"
  | "MGRS";

export type GisLayerKind =
  | "basemap"
  | "tile"
  | "vector"
  | "image"
  | "terrain"
  | "group";

export type GisLayerGroup =
  | "base-maps"
  | "terrain"
  | "operational"
  | "friendly"
  | "enemy"
  | "control-measures"
  | "intelligence"
  | "logistics"
  | "weather"
  | "airspace"
  | "user";

export type GisLayerSecurity =
  | "UNCLASSIFIED"
  | "RESTRICTED"
  | "CONFIDENTIAL"
  | "SECRET"
  | "TOP_SECRET";

export interface GisLayerDefinition {
  id: string;
  title: string;
  kind: GisLayerKind;
  group: GisLayerGroup;

  visible: boolean;
  locked: boolean;
  opacity: number;
  order: number;

  selectable?: boolean;
  editable?: boolean;
  removable?: boolean;
  exportable?: boolean;

  featureCount?: number;
  sourceName?: string;
  security?: GisLayerSecurity;
  metadata?: Record<string, unknown>;
}

export interface GisLayerUpdate {
  title?: string;
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  order?: number;
  selectable?: boolean;
  editable?: boolean;
  featureCount?: number;
  security?: GisLayerSecurity;
  metadata?: Record<string, unknown>;
}

export interface MapCoordinate {
  longitude: number;
  latitude: number;
}

export interface MapCoordinateReadout extends MapCoordinate {
  format: CoordinateFormat;
  formatted: string;
}

export interface MapViewState {
  center: MapCoordinate;
  zoom: number;
  rotation: number;
  resolution: number;
  scaleDenominator?: number;
}

export interface MapSelectionState {
  selectedFeatureIds: string[];
  selectedLayerId?: string;
}

export interface GisLayerSnapshot {
  layers: GisLayerDefinition[];
  activeLayerId?: string;
  revision: number;
}
