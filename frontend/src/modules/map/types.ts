export type MapTool = "select" | "point" | "line" | "polygon" | "circle" | "measure";

export type OperationalLayer = {
  id: string;
  name: string;
  category: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  featureCount: number;
};
