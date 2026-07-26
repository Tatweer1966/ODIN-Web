import { ChevronDown, Eye, EyeOff, GripVertical, Lock, Unlock } from "lucide-react";
import type { OperationalLayer } from "../types";

export function LayerTree({ layers, onToggle, onLock, onOpacity }: { layers: OperationalLayer[]; onToggle: (id: string) => void; onLock: (id: string) => void; onOpacity: (id: string, value: number) => void }) {
  const categories = [...new Set(layers.map((layer) => layer.category))];
  return <section className="map-panel layer-panel"><div className="map-panel-heading"><div><span>OPERATIONAL OVERLAYS</span><strong>Layer Manager</strong></div><button><ChevronDown size={17}/></button></div>
    <div className="layer-tree">{categories.map((category) => <div className="layer-category" key={category}><div className="layer-category-title"><ChevronDown size={14}/><span>{category}</span></div>{layers.filter((layer) => layer.category === category).map((layer) => <div className="layer-row" key={layer.id}><GripVertical className="layer-grip" size={14}/><button className="layer-visibility" onClick={() => onToggle(layer.id)}>{layer.visible ? <Eye size={16}/> : <EyeOff size={16}/>}</button><div className="layer-main"><strong>{layer.name}</strong><span>{layer.featureCount} objects</span><input aria-label={`${layer.name} opacity`} type="range" min="0" max="100" value={layer.opacity} onChange={(e) => onOpacity(layer.id, Number(e.target.value))}/></div><button className="layer-lock" onClick={() => onLock(layer.id)}>{layer.locked ? <Lock size={14}/> : <Unlock size={14}/>}</button></div>)}</div>)}</div>
  </section>;
}
