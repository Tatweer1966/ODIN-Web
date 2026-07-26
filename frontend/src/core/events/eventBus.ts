export interface AppEventMap {
  "exercise:changed": { exerciseId: string };
  "simulation:started": { turn: number };
  "simulation:paused": { turn: number };
  "map:layer-added": { layerId: string };
  "map:layer-removed": { layerId: string };
  "map:unit-selected": { unitId: string };
  "notification:created": { id: string; message: string };
}

type EventName = keyof AppEventMap;
type EventHandler<K extends EventName> = (payload: AppEventMap[K]) => void;

class EventBus {
  private readonly target = new EventTarget();

  emit<K extends EventName>(name: K, payload: AppEventMap[K]) {
    this.target.dispatchEvent(new CustomEvent(name, { detail: payload }));
  }

  on<K extends EventName>(name: K, handler: EventHandler<K>) {
    const listener = (event: Event) => handler((event as CustomEvent<AppEventMap[K]>).detail);
    this.target.addEventListener(name, listener);
    return () => this.target.removeEventListener(name, listener);
  }
}

export const eventBus = new EventBus();
