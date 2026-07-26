import type BaseLayer from "ol/layer/Base";

export interface LayerAdapter {
  register(id: string, layer: BaseLayer): void;

  unregister(id: string): void;

  get(id: string): BaseLayer | undefined;

  has(id: string): boolean;

  getAll(): BaseLayer[];

  setVisible(id: string, visible: boolean): void;

  setOpacity(id: string, opacity: number): void;

  setZIndex(id: string, order: number): void;

  destroy(): void;
}
